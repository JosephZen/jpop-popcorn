import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function DELETE(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = parseInt(id);

    serverDb.delete('cart_items', c => c.id === cartItemId && c.userId === user.id);
    return NextResponse.json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Delete cart item API error:', error);
    return NextResponse.json({ error: 'Failed to remove cart item.' }, { status: 500 });
  }
}
