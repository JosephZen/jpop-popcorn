import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (userPayload && !serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    const { role } = await request.json();

    const updated = serverDb.update('users', u => u.id === userId, { role });
    if (!updated) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user: updated, message: 'Role updated successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role.' }, { status: 500 });
  }
}
