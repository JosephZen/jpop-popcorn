import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (user && !serverDb.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const bId = parseInt(resolvedParams?.id);
    const body = await request.json();
    const { customDeliveryFee, isActive } = body;

    const updates = {};
    if (customDeliveryFee !== undefined) {
      updates.customDeliveryFee = customDeliveryFee === null || customDeliveryFee === '' ? null : String(customDeliveryFee);
    }
    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    const updated = serverDb.update('abra_barangays', b => b.id === bId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Barangay not found.' }, { status: 404 });
    }

    return NextResponse.json({ barangay: updated });
  } catch (error) {
    console.error('Update barangay fee error:', error);
    return NextResponse.json({ error: 'Failed to update barangay delivery fee.' }, { status: 500 });
  }
}
