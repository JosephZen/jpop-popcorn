import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    const updated = serverDb.update('orders', o => String(o.id) === String(id), {
      paymentConfirmed: true,
      status: 'confirmed',
    });

    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
      order: updated,
      message: 'Payment confirmed and order marked as confirmed.',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment.' }, { status: 500 });
  }
}
