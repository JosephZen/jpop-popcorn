import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { products } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── Public: List Active Products ───
router.get('/', async (req, res) => {
  try {
    let list = [];
    if (isUsingNeon && db) {
      list = await db.select().from(products)
        .where(eq(products.isActive, true))
        .orderBy(asc(products.sortOrder));
    } else {
      list = localDb.find('products', p => p.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
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
    const { name, description, price, imageUrl, category, flavors, isActive, sortOrder } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Product name and price are required.' });
    }

    const payload = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price).toFixed(2),
      imageUrl: imageUrl || null,
      category: category || 'classic',
      flavors: Array.isArray(flavors) ? flavors : [],
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

    const { name, description, price, imageUrl, category, flavors, isActive, sortOrder } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) updates.price = parseFloat(price).toFixed(2);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (category !== undefined) updates.category = category;
    if (flavors !== undefined) updates.flavors = Array.isArray(flavors) ? flavors : [];
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder) || 0;

    if (isUsingNeon && db) {
      const [updated] = await db.update(products)
        .set({ ...updates, updatedAt: new Date() })
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
      const [deleted] = await db.delete(products)
        .where(eq(products.id, id))
        .returning();

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
