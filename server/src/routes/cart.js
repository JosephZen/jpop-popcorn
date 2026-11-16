import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { cartItems, products } from '../models/schema.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET all cart items for authenticated user with product details
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isUsingNeon && db) {
      const items = await db.select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        customizationPayload: cartItems.customizationPayload,
        productName: products.name,
        price: products.price,
        imageUrl: products.imageUrl,
        sizeLabel: products.sizeLabel,
        category: products.category,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.updatedAt));

      return res.json({ items });
    } else {
      const allCart = localDb.find('cart_items', c => c.userId === userId);
      const allProducts = localDb.find('products');
      const items = allCart.map(c => {
        const prod = allProducts.find(p => p.id === c.productId) || {};
        return {
          id: c.id,
          userId: c.userId,
          productId: c.productId,
          quantity: c.quantity,
          customizationPayload: c.customizationPayload,
          productName: prod.name,
          price: prod.price || prod.basePrice,
          imageUrl: prod.imageUrl,
          sizeLabel: prod.sizeLabel,
          category: prod.category,
        };
      });
      return res.json({ items });
    }
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// POST /api/cart: Sync whole cart or add/update item
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, productId, quantity, customizationPayload } = req.body;

    // Full cart array replacement sync
    if (Array.isArray(items)) {
      if (isUsingNeon && db) {
        await db.delete(cartItems).where(eq(cartItems.userId, userId));
        for (const item of items) {
          if (item.productId) {
            await db.insert(cartItems).values({
              userId,
              productId: item.productId,
              quantity: item.quantity || 1,
              customizationPayload: item.customizationPayload || {},
            });
          }
        }
      } else {
        localDb.delete('cart_items', c => c.userId === userId);
        for (const item of items) {
          if (item.productId) {
            localDb.insert('cart_items', {
              userId,
              productId: item.productId,
              quantity: item.quantity || 1,
              customizationPayload: item.customizationPayload || {},
            });
          }
        }
      }
      return res.json({ message: 'Cart synced successfully.' });
    }

    // Single item add / update
    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' });
    }

    const payload = customizationPayload || {};
    const qty = quantity || 1;

    if (isUsingNeon && db) {
      const [newCart] = await db.insert(cartItems).values({
        userId,
        productId,
        quantity: qty,
        customizationPayload: payload,
      }).returning();
      return res.status(201).json({ item: newCart });
    } else {
      const newCart = localDb.insert('cart_items', {
        userId,
        productId,
        quantity: qty,
        customizationPayload: payload,
      });
      return res.status(201).json({ item: newCart });
    }
  } catch (err) {
    console.error('Cart sync error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// DELETE /api/cart: Clear user cart
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isUsingNeon && db) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else {
      localDb.delete('cart_items', c => c.userId === userId);
    }
    res.json({ message: 'Cart cleared successfully.' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

// DELETE /api/cart/:id: Remove single cart item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;
    if (isUsingNeon && db) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
    } else {
      localDb.delete('cart_items', c => c.id === id && c.userId === userId);
    }
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Failed to remove cart item.' });
  }
});

export default router;
