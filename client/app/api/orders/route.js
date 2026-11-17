import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

const calculateShipping = (items, deliveryMethod, municipalityId, barangayId) => {
  if (deliveryMethod === 'pickup') {
    return { shippingFee: 0, promoApplied: false, reason: 'Store Pickup' };
  }

  let units1kg = 0;
  let units500g = 0;

  for (const item of items) {
    const size = (item.size || item.sizeLabel || '').toLowerCase();
    const name = (item.productName || item.name || '').toLowerCase();
    const qty = parseInt(item.quantity) || 1;

    if (size.includes('1kg') || name.includes('1kg')) {
      units1kg += qty;
    } else if (size.includes('500g') || name.includes('500g')) {
      units500g += qty;
    }
  }

  // Free shipping promo logic: 5+ 1kg bags OR 10+ 500g bags
  if (units1kg >= 5 || units500g >= 10) {
    return {
      shippingFee: 0,
      promoApplied: true,
      reason: units1kg >= 5
        ? `Free Shipping Promo: ${units1kg} units of 1kg Popcorn (min. 5)`
        : `Free Shipping Promo: ${units500g} units of 500g Popcorn (min. 10)`,
    };
  }

  let fee = 50.00;
  if (barangayId) {
    const b = serverDb.findOne('abra_barangays', row => row.id === parseInt(barangayId));
    if (b && b.customDeliveryFee) {
      return { shippingFee: parseFloat(b.customDeliveryFee), promoApplied: false };
    }
  }

  if (municipalityId) {
    const m = serverDb.findOne('abra_municipalities', row => row.id === parseInt(municipalityId));
    if (m && m.deliveryFee) {
      fee = parseFloat(m.deliveryFee);
    }
  }

  return { shippingFee: fee, promoApplied: false };
};

export async function GET(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const normalizedUserEmail = (user.email || '').toLowerCase().trim();
    const userOrders = serverDb.find('orders', o => (
      o.userId === user.id ||
      (o.customerEmail && o.customerEmail.toLowerCase().trim() === normalizedUserEmail)
    )).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const allProducts = serverDb.find('products');
    const ordersWithItems = userOrders.map(order => {
      const items = serverDb.find('order_items', i => i.orderId === order.id).map(item => {
        const prod = allProducts.find(p => p.id === item.productId);
        return {
          ...item,
          productImage: prod?.imageUrl || null,
        };
      });
      return { ...order, items };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    const userId = user ? user.id : 1; // Fallback or guest user

    const body = await request.json();
    const {
      items,
      deliveryMethod,
      municipalityId,
      barangayId,
      deliveryAddress,
      deliveryNotes,
      scheduledTime,
      paymentMethod,
      paymentReceiptUrl,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }

    if (!deliveryMethod || !['pickup', 'delivery'].includes(deliveryMethod)) {
      return NextResponse.json({ error: 'Valid delivery method is required.' }, { status: 400 });
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress && !deliveryNotes) {
      return NextResponse.json({ error: 'Please provide a delivery address or notes.' }, { status: 400 });
    }

    let calculatedSubtotal = 0;
    const resolvedItems = [];
    const allProducts = serverDb.find('products');

    for (const item of items) {
      const pId = parseInt(item.productId);
      const product = allProducts.find(p => p.id === pId);

      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} was not found.` }, { status: 400 });
      }

      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(product.price || product.basePrice || 35.00);
      calculatedSubtotal += unitPrice * qty;

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        priceAtTime: unitPrice.toFixed(2),
        flavor: item.flavor || null,
        size: item.size || product.sizeLabel || null,
        customizationPayload: item.customizationPayload || {},
      });
    }

    const shippingResult = calculateShipping(resolvedItems, deliveryMethod, municipalityId, barangayId);
    const shippingFee = shippingResult.shippingFee;
    const grandTotal = (calculatedSubtotal + shippingFee).toFixed(2);

    const order = serverDb.insert('orders', {
      userId,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      status: 'pending',
      subtotal: calculatedSubtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      total: grandTotal,
      deliveryMethod,
      municipalityId: municipalityId ? parseInt(municipalityId) : null,
      barangayId: barangayId ? parseInt(barangayId) : null,
      deliveryAddress: deliveryAddress ? deliveryAddress.trim() : null,
      deliveryNotes: deliveryNotes ? deliveryNotes.trim() : null,
      scheduledTime: scheduledTime || null,
      paymentMethod: paymentMethod || 'gcash',
      paymentReceiptUrl: paymentReceiptUrl || null,
      paymentConfirmed: false,
    });

    const savedItems = resolvedItems.map((item) => {
      return serverDb.insert('order_items', {
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        flavor: item.flavor,
        size: item.size,
        customizationPayload: item.customizationPayload,
      });
    });

    // Clear user cart if authenticated
    if (user) {
      serverDb.delete('cart_items', c => c.userId === user.id);
    }

    return NextResponse.json({
      order: {
        ...order,
        items: savedItems,
        promoApplied: shippingResult.promoApplied,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
