import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { abraMunicipalities, abraBarangays } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all 27 Abra Municipalities
router.get('/municipalities', async (req, res) => {
  try {
    if (isUsingNeon && db) {
      const list = await db.select().from(abraMunicipalities).orderBy(asc(abraMunicipalities.name));
      return res.json({ municipalities: list });
    } else {
      const list = localDb.find('abra_municipalities').sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ municipalities: list });
    }
  } catch (err) {
    console.error('Fetch municipalities error:', err);
    res.status(500).json({ error: 'Failed to fetch municipalities.' });
  }
});

// GET Barangays for a Municipality
router.get('/barangays/:municipalityId', async (req, res) => {
  try {
    const municipalityId = parseInt(req.params.municipalityId);
    if (isUsingNeon && db) {
      const list = await db.select().from(abraBarangays)
        .where(eq(abraBarangays.municipalityId, municipalityId))
        .orderBy(asc(abraBarangays.name));
      return res.json({ barangays: list });
    } else {
      const list = localDb.find('abra_barangays', b => b.municipalityId === municipalityId)
        .sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ barangays: list });
    }
  } catch (err) {
    console.error('Fetch barangays error:', err);
    res.status(500).json({ error: 'Failed to fetch barangays.' });
  }
});

// GET Complete Shipping Rates Matrix (for Admin)
router.get('/matrix', async (req, res) => {
  try {
    if (isUsingNeon && db) {
      const munList = await db.select().from(abraMunicipalities).orderBy(asc(abraMunicipalities.name));
      const barList = await db.select().from(abraBarangays).orderBy(asc(abraBarangays.name));
      const matrix = munList.map(m => ({
        ...m,
        barangays: barList.filter(b => b.municipalityId === m.id)
      }));
      return res.json({ matrix });
    } else {
      const munList = localDb.find('abra_municipalities').sort((a, b) => a.name.localeCompare(b.name));
      const barList = localDb.find('abra_barangays').sort((a, b) => a.name.localeCompare(b.name));
      const matrix = munList.map(m => ({
        ...m,
        barangays: barList.filter(b => b.municipalityId === m.id)
      }));
      return res.json({ matrix });
    }
  } catch (err) {
    console.error('Fetch shipping matrix error:', err);
    res.status(500).json({ error: 'Failed to fetch shipping matrix.' });
  }
});

// Admin: Update Municipality Delivery Fee
router.put('/municipalities/:id/fee', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { deliveryFee, isActive } = req.body;
    const updates = {};
    if (deliveryFee !== undefined) updates.deliveryFee = String(deliveryFee);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (isUsingNeon && db) {
      const [updated] = await db.update(abraMunicipalities)
        .set(updates)
        .where(eq(abraMunicipalities.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: 'Municipality not found.' });
      return res.json({ municipality: updated });
    } else {
      const updated = localDb.update('abra_municipalities', m => m.id === id, updates);
      if (!updated) return res.status(404).json({ error: 'Municipality not found.' });
      return res.json({ municipality: updated });
    }
  } catch (err) {
    console.error('Update municipality fee error:', err);
    res.status(500).json({ error: 'Failed to update delivery fee.' });
  }
});

// Admin: Update Barangay Custom Delivery Fee
router.put('/barangays/:id/fee', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customDeliveryFee, isActive } = req.body;
    const updates = {};
    if (customDeliveryFee !== undefined) updates.customDeliveryFee = customDeliveryFee ? String(customDeliveryFee) : null;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (isUsingNeon && db) {
      const [updated] = await db.update(abraBarangays)
        .set(updates)
        .where(eq(abraBarangays.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: 'Barangay not found.' });
      return res.json({ barangay: updated });
    } else {
      const updated = localDb.update('abra_barangays', b => b.id === id, updates);
      if (!updated) return res.status(404).json({ error: 'Barangay not found.' });
      return res.json({ barangay: updated });
    }
  } catch (err) {
    console.error('Update barangay fee error:', err);
    res.status(500).json({ error: 'Failed to update barangay delivery fee.' });
  }
});

export default router;
