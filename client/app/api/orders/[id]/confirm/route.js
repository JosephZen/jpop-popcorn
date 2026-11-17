import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (user && !serverDb.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    let updated = serverDb.update('orders', o => String(o.id) === String(id), {
      paymentConfirmed: true,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      updated = serverDb.insert('orders', {
        id: isNaN(Number(id)) ? id : Number(id),
        status: 'confirmed',
        paymentConfirmed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message: 'Payment confirmed and order marked as confirmed.',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment.' }, { status: 500 });
  }
}
