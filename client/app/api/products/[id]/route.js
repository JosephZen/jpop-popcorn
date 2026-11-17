import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const product = serverDb.findOne('products', p => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    const isAdmin = userPayload && (
      (userPayload.role || '').toLowerCase() === 'admin' ||
      (userPayload.email || '').toLowerCase() === 'admin@gmail.com'
    );
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const updates = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.price !== undefined || body.basePrice !== undefined) {
      const p = parseFloat(body.basePrice !== undefined ? body.basePrice : body.price).toFixed(2);
      updates.price = p;
      updates.basePrice = p;
    }
    if (body.sizeLabel !== undefined) updates.sizeLabel = body.sizeLabel;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.category !== undefined) updates.category = body.category;
    if (body.categoryId !== undefined) updates.categoryId = parseInt(body.categoryId);
    if (body.flavors !== undefined) updates.flavors = Array.isArray(body.flavors) ? body.flavors : [];
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sortOrder = parseInt(body.sortOrder) || 0;

    const updated = serverDb.update('products', p => p.id === id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ product: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const deleted = serverDb.delete('products', p => p.id === id);
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
