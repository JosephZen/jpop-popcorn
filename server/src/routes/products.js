import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { products } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── Public: List Active Products ───
router.get('/', async (req, res) => {
  try {
    const { category, categoryId } = req.query;
    let list = [];

    if (isUsingNeon && db) {
      let query = db.select().from(products).where(eq(products.isActive, true));
      if (categoryId) {
        query = query.where(eq(products.categoryId, parseInt(categoryId)));
      } else if (category) {
        query = query.where(eq(products.category, category));
      }
      list = await query.orderBy(asc(products.sortOrder));
    } else {
      list = localDb.find('products', p => p.isActive !== false);
      if (categoryId) {
        list = list.filter(p => p.categoryId === parseInt(categoryId));
      } else if (category) {
        list = list.filter(p => p.category === category);
      }
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    res.json({ products: list });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ─── Public: Get Single Product ───
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

    let product = null;
    if (isUsingNeon && db) {
      const [found] = await db.select().from(products).where(eq(products.id, id));
      product = found;
    } else {
      product = localDb.findOne('products', p => p.id === id);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    console.error('Get single product error:', err);
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// ─── Admin: Get All Products (including inactive) ───
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    let list = [];
    if (isUsingNeon && db) {
      list = await db.select().from(products).orderBy(asc(products.sortOrder));
    } else {
      list = localDb.find('products').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    res.json({ products: list });
  } catch (err) {
    console.error('Admin get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products inventory.' });
  }
});

// ─── Admin: Create Product ───
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      basePrice,
      imageUrl,
      category,
      categoryId,
      sizeLabel,
      flavors,
      sizes,
      isActive,
      sortOrder
    } = req.body;

    if (!name || (price === undefined && basePrice === undefined)) {
      return res.status(400).json({ error: 'Product name and price/basePrice are required.' });
    }

    const finalPrice = parseFloat(basePrice !== undefined ? basePrice : price).toFixed(2);

    const payload = {
      name: name.trim(),
      description: description ? description.trim() : '',
      basePrice: finalPrice,
      price: finalPrice,
      sizeLabel: sizeLabel || '500g',
      imageUrl: imageUrl || null,
      category: category || (categoryId === 2 ? 'mini-donut' : 'popcorn'),
      categoryId: categoryId ? parseInt(categoryId) : (category === 'mini-donut' ? 2 : 1),
      flavors: Array.isArray(flavors) ? flavors : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      isActive: isActive !== false,
      sortOrder: parseInt(sortOrder) || 0,
    };

    if (isUsingNeon && db) {
      const [newProduct] = await db.insert(products).values(payload).returning();
      return res.status(201).json({ product: newProduct });
    } else {
      const newProduct = localDb.insert('products', payload);
      return res.status(201).json({ product: newProduct });
    }
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// ─── Admin: Update Product ───
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

    const {
      name,
      description,
      price,
      basePrice,
      imageUrl,
      category,
      categoryId,
      sizeLabel,
      flavors,
      sizes,
      isActive,
      sortOrder
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined || basePrice !== undefined) {
      const p = parseFloat(basePrice !== undefined ? basePrice : price).toFixed(2);
      updates.price = p;
      updates.basePrice = p;
    }
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (category !== undefined) updates.category = category;
    if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
    if (sizeLabel !== undefined) updates.sizeLabel = sizeLabel;
    if (flavors !== undefined) updates.flavors = Array.isArray(flavors) ? flavors : [];
    if (sizes !== undefined) updates.sizes = Array.isArray(sizes) ? sizes : [];
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder) || 0;

    if (isUsingNeon && db) {
      const [updated] = await db.update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ product: updated });
    } else {
      const updated = localDb.update('products', p => p.id === id, updates);
      if (!updated) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ product: updated });
    }
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ─── Admin: Delete Product ───
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

    if (isUsingNeon && db) {
      const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
      if (!deleted) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ message: 'Product deleted successfully.' });
    } else {
      const deleted = localDb.delete('products', p => p.id === id);
      if (!deleted) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ message: 'Product deleted successfully.' });
    }
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

export default router;
