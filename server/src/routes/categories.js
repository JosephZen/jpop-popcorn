import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { categories, customizationOptions } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all categories with their customization options
router.get('/', async (req, res) => {
  try {
    if (isUsingNeon && db) {
      const allCats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
      const allOpts = await db.select().from(customizationOptions);
      
      const result = allCats.map(cat => ({
        ...cat,
        options: allOpts.filter(opt => opt.categoryId === cat.id)
      }));
      return res.json({ categories: result });
    } else {
      const allCats = localDb.find('categories').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const allOpts = localDb.find('customization_options');
      const result = allCats.map(cat => ({
        ...cat,
        options: allOpts.filter(opt => opt.categoryId === cat.id)
      }));
      return res.json({ categories: result });
    }
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Admin: Create Category
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, slug, sortOrder, customizationConfig } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required.' });
    }

    if (isUsingNeon && db) {
      const [newCat] = await db.insert(categories).values({
        name,
        slug: slug.toLowerCase().trim(),
        sortOrder: sortOrder || 0,
        customizationConfig: customizationConfig || {},
      }).returning();
      return res.status(201).json({ category: newCat });
    } else {
      const newCat = localDb.insert('categories', {
        name,
        slug: slug.toLowerCase().trim(),
        sortOrder: sortOrder || 0,
        customizationConfig: customizationConfig || {},
      });
      return res.status(201).json({ category: newCat });
    }
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Admin: Update Category (name, slug, sortOrder, customizationConfig)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug, sortOrder, customizationConfig } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug.toLowerCase().trim();
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (customizationConfig !== undefined) updates.customizationConfig = customizationConfig;

    if (isUsingNeon && db) {
      const [updated] = await db.update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: 'Category not found.' });
      return res.json({ category: updated });
    } else {
      const updated = localDb.update('categories', c => c.id === id, updates);
      if (!updated) return res.status(404).json({ error: 'Category not found.' });
      return res.json({ category: updated });
    }
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// Admin: Delete Category
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isUsingNeon && db) {
      await db.delete(customizationOptions).where(eq(customizationOptions.categoryId, id));
      const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
      if (!deleted) return res.status(404).json({ error: 'Category not found.' });
      return res.json({ message: 'Category deleted successfully.' });
    } else {
      localDb.delete('customization_options', o => o.categoryId === id);
      const deleted = localDb.delete('categories', c => c.id === id);
      if (!deleted) return res.status(404).json({ error: 'Category not found.' });
      return res.json({ message: 'Category deleted successfully.' });
    }
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
