import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (userPayload && !serverDb.isAdmin(userPayload)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    if (userId === userPayload.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    const deleted = serverDb.delete('users', u => u.id === userId);
    if (!deleted) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User removed successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
