import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function PUT(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const { deliveryFee, isActive } = await request.json();
    const updates = {};
    if (deliveryFee !== undefined) updates.deliveryFee = String(deliveryFee);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = serverDb.update('abra_municipalities', m => m.id === id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Municipality not found.' }, { status: 404 });
    }
    return NextResponse.json({ municipality: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rate.' }, { status: 500 });
  }
}
