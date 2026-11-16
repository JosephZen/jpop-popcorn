import { Router } from 'express';
import { eq } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { customizationOptions } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all customization options (optionally by categoryId)
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
    if (isUsingNeon && db) {
      let query = db.select().from(customizationOptions);
      if (categoryId) {
        query = query.where(eq(customizationOptions.categoryId, categoryId));
      }
      const options = await query;
      return res.json({ options });
    } else {
      let options = localDb.find('customization_options');
      if (categoryId) {
        options = options.filter(o => o.categoryId === categoryId);
      }
      return res.json({ options });
    }
  } catch (err) {
    console.error('Fetch customizations error:', err);
    res.status(500).json({ error: 'Failed to fetch customization options.' });
  }
});

// Admin: Add customization option
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { categoryId, groupName, name, extraPrice, isAvailable } = req.body;
    if (!categoryId || !groupName || !name) {
      return res.status(400).json({ error: 'categoryId, groupName, and name are required.' });
    }

    const payload = {
      categoryId: parseInt(categoryId),
      groupName: groupName.trim(),
      name: name.trim(),
      extraPrice: extraPrice ? String(extraPrice) : '0.00',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    };

    if (isUsingNeon && db) {
      const [opt] = await db.insert(customizationOptions).values(payload).returning();
      return res.status(201).json({ option: opt });
    } else {
      const opt = localDb.insert('customization_options', payload);
      return res.status(201).json({ option: opt });
    }
  } catch (err) {
    console.error('Create customization error:', err);
    res.status(500).json({ error: 'Failed to create customization option.' });
  }
});

// Admin: Update customization option
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryId, groupName, name, extraPrice, isAvailable } = req.body;
    const updates = {};
    if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
    if (groupName !== undefined) updates.groupName = groupName.trim();
    if (name !== undefined) updates.name = name.trim();
    if (extraPrice !== undefined) updates.extraPrice = String(extraPrice);
    if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);

    if (isUsingNeon && db) {
      const [opt] = await db.update(customizationOptions)
        .set(updates)
        .where(eq(customizationOptions.id, id))
        .returning();
      if (!opt) return res.status(404).json({ error: 'Option not found.' });
      return res.json({ option: opt });
    } else {
      const opt = localDb.update('customization_options', o => o.id === id, updates);
      if (!opt) return res.status(404).json({ error: 'Option not found.' });
      return res.json({ option: opt });
    }
  } catch (err) {
    console.error('Update customization error:', err);
    res.status(500).json({ error: 'Failed to update customization option.' });
  }
});

// Admin: Delete customization option
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isUsingNeon && db) {
      const [opt] = await db.delete(customizationOptions).where(eq(customizationOptions.id, id)).returning();
      if (!opt) return res.status(404).json({ error: 'Option not found.' });
      return res.json({ message: 'Option deleted successfully.' });
    } else {
      const deleted = localDb.delete('customization_options', o => o.id === id);
      if (!deleted) return res.status(404).json({ error: 'Option not found.' });
      return res.json({ message: 'Option deleted successfully.' });
    }
  } catch (err) {
    console.error('Delete customization error:', err);
    res.status(500).json({ error: 'Failed to delete customization option.' });
  }
});

export default router;
