import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function PUT(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const updates = {};
    if (body.groupName !== undefined) updates.groupName = body.groupName.trim();
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.extraPrice !== undefined) updates.extraPrice = String(body.extraPrice);
    if (body.isAvailable !== undefined) updates.isAvailable = Boolean(body.isAvailable);

    const updated = serverDb.update('customization_options', o => o.id === id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Option not found.' }, { status: 404 });
    }
    return NextResponse.json({ option: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update option.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const deleted = serverDb.delete('customization_options', o => o.id === id);
    if (!deleted) {
      return NextResponse.json({ error: 'Option not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Option deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete option.' }, { status: 500 });
  }
}
