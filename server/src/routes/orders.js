import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { orders, orderItems, products, users } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── Customer: Create Order ───
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      items,
      deliveryMethod,
      deliveryAddress,
      deliveryNotes,
      scheduledTime,
      paymentMethod,
      paymentReceiptUrl,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!deliveryMethod || !['pickup', 'delivery'].includes(deliveryMethod)) {
      return res.status(400).json({ error: 'Valid delivery method is required.' });
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress && !deliveryNotes) {
      return res.status(400).json({ error: 'Please provide delivery address or delivery notes.' });
    }

    // Resolve products & calculate subtotal
    let calculatedSubtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      let product = null;
      if (isUsingNeon && db) {
        const [found] = await db.select().from(products).where(eq(products.id, parseInt(item.productId)));
        product = found;
      } else {
        product = localDb.findOne('products', p => p.id === parseInt(item.productId));
      }

      if (!product) {
        return res.status(400).json({ error: `Product with ID ${item.productId} was not found.` });
      }

      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(product.price);
      calculatedSubtotal += unitPrice * qty;

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        priceAtTime: unitPrice.toFixed(2),
        flavor: item.flavor || null,
        size: item.size || null,
      });
    }

    // Shipping calculation:
    // Order & Pickup is default. Free delivery to eligible areas.
    // The frontend will handle area eligibility validation.
    let shippingFee = 0;

    const grandTotal = (calculatedSubtotal + shippingFee).toFixed(2);

    if (isUsingNeon && db) {
      const [order] = await db.insert(orders).values({
        userId: req.user.id,
        total: grandTotal,
        deliveryMethod,
        deliveryAddress: deliveryAddress ? deliveryAddress.trim() : null,
        deliveryNotes: deliveryNotes ? deliveryNotes.trim() : null,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        paymentMethod: paymentMethod || 'gcash',
        paymentReceiptUrl: paymentReceiptUrl || null,
      }).returning();

      for (const item of resolvedItems) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          flavor: item.flavor,
          size: item.size,
        });
      }

      const savedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return res.status(201).json({ order: { ...order, items: savedItems } });
    } else {
      const order = localDb.insert('orders', {
        userId: req.user.id,
        status: 'pending',
        total: grandTotal,
        deliveryMethod,
        deliveryAddress: deliveryAddress ? deliveryAddress.trim() : null,
        deliveryNotes: deliveryNotes ? deliveryNotes.trim() : null,
        scheduledTime: scheduledTime || null,
        paymentMethod: paymentMethod || 'gcash',
        paymentReceiptUrl: paymentReceiptUrl || null,
        paymentConfirmed: false,
      });

      const savedItems = resolvedItems.map((item) => {
        return localDb.insert('order_items', {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          flavor: item.flavor,
          size: item.size,
        });
      });

      return res.status(201).json({ order: { ...order, items: savedItems } });
    }
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// ─── Customer: Get Own Orders ───
router.get('/', authenticate, async (req, res) => {
  try {
    if (isUsingNeon && db) {
      const userOrders = await db.select().from(orders)
        .where(eq(orders.userId, req.user.id))
        .orderBy(desc(orders.createdAt));

      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db.select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: products.name,
            productImage: products.imageUrl,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            flavor: orderItems.flavor,
            size: orderItems.size,
          }).from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );
      return res.json({ orders: ordersWithItems });
    } else {
      const userOrders = localDb.find('orders', o => o.userId === req.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const ordersWithItems = userOrders.map(order => {
        const items = localDb.find('order_items', i => i.orderId === order.id);
        return { ...order, items };
      });
      return res.json({ orders: ordersWithItems });
    }
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// ─── Admin: List All Orders ───
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    if (isUsingNeon && db) {
      const allOrders = await db.select({
        id: orders.id,
        userId: orders.userId,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
        status: orders.status,
        total: orders.total,
        deliveryMethod: orders.deliveryMethod,
        deliveryAddress: orders.deliveryAddress,
        deliveryNotes: orders.deliveryNotes,
        scheduledTime: orders.scheduledTime,
        paymentMethod: orders.paymentMethod,
        paymentReceiptUrl: orders.paymentReceiptUrl,
        paymentConfirmed: orders.paymentConfirmed,
        createdAt: orders.createdAt,
      }).from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt));

      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db.select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: products.name,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            flavor: orderItems.flavor,
            size: orderItems.size,
          }).from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );
      return res.json({ orders: ordersWithItems });
    } else {
      const allOrders = localDb.find('orders')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const ordersWithItems = allOrders.map(order => {
        const user = localDb.findOne('users', u => u.id === order.userId);
        const items = localDb.find('order_items', i => i.orderId === order.id);
        return {
          ...order,
          customerName: user?.name || `Customer #${order.userId}`,
          customerEmail: user?.email || '',
          customerPhone: user?.phone || '',
          items,
        };
      });
      return res.json({ orders: ordersWithItems });
    }
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch customer orders.' });
  }
});

// ─── Admin: Update Order Status ───
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (isUsingNeon && db) {
      const [updated] = await db.update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Order not found.' });
      return res.json({ order: updated });
    } else {
      const updated = localDb.update('orders', o => o.id === id, { status });
      if (!updated) return res.status(404).json({ error: 'Order not found.' });
      return res.json({ order: updated });
    }
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// ─── Admin: Confirm Payment ───
router.patch('/:id/confirm', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isUsingNeon && db) {
      const [updated] = await db.update(orders)
        .set({ paymentConfirmed: true, status: 'confirmed' })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Order not found.' });
      return res.json({ order: updated, message: 'Payment confirmed and order marked as confirmed.' });
    } else {
      const updated = localDb.update('orders', o => o.id === id, { paymentConfirmed: true, status: 'confirmed' });
      if (!updated) return res.status(404).json({ error: 'Order not found.' });
      return res.json({ order: updated, message: 'Payment confirmed and order marked as confirmed.' });
    }
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Failed to confirm payment.' });
  }
});

export default router;
