import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const updates = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.slug !== undefined) updates.slug = body.slug.toLowerCase().trim();
    if (body.sortOrder !== undefined) updates.sortOrder = parseInt(body.sortOrder);
    if (body.customizationConfig !== undefined) updates.customizationConfig = body.customizationConfig;

    const updated = serverDb.update('categories', c => c.id === id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    return NextResponse.json({ category: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    serverDb.delete('customization_options', o => o.categoryId === id);
    const deleted = serverDb.delete('categories', c => c.id === id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 });
  }
}
