import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const list = serverDb.find('products').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return NextResponse.json({ products: list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products inventory.' }, { status: 500 });
  }
}
