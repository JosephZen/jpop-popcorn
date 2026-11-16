import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const allOrders = serverDb.find('orders')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const ordersWithItems = allOrders.map(order => {
      const customer = serverDb.findOne('users', u => u.id === order.userId);
      const items = serverDb.find('order_items', i => i.orderId === order.id);
      return {
        ...order,
        customerName: customer?.name || `Customer #${order.userId}`,
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
        items,
      };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Admin get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer orders.' }, { status: 500 });
  }
}
