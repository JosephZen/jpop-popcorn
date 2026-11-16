import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const allCart = serverDb.find('cart_items', c => c.userId === user.id);
    const allProducts = serverDb.find('products');

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

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fetch cart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to sync cart.' }, { status: 401 });
    }

    const body = await request.json();
    const { items, productId, quantity, customizationPayload } = body;

    // Full cart array replacement sync
    if (Array.isArray(items)) {
      serverDb.delete('cart_items', c => c.userId === user.id);
      for (const item of items) {
        if (item.productId) {
          serverDb.insert('cart_items', {
            userId: user.id,
            productId: item.productId,
            quantity: item.quantity || 1,
            customizationPayload: item.customizationPayload || {},
          });
        }
      }
      return NextResponse.json({ message: 'Cart synced successfully.' });
    }

    // Single item add / update
    if (!productId) {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
    }

    const newCart = serverDb.insert('cart_items', {
      userId: user.id,
      productId,
      quantity: quantity || 1,
      customizationPayload: customizationPayload || {},
    });

    return NextResponse.json({ item: newCart }, { status: 201 });
  } catch (error) {
    console.error('Cart sync API error:', error);
    return NextResponse.json({ error: 'Failed to update cart.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    serverDb.delete('cart_items', c => c.userId === user.id);
    return NextResponse.json({ message: 'Cart cleared successfully.' });
  } catch (error) {
    console.error('Clear cart API error:', error);
    return NextResponse.json({ error: 'Failed to clear cart.' }, { status: 500 });
  }
}
