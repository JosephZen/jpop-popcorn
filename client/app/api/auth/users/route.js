import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const allUsers = serverDb.find('users').map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      address: u.address || null,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}
