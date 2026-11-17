import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function PUT(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (user && !serverDb.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required. Please sign in to the Admin Desk.' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const key = resolvedParams?.key;
    const body = await request.json();

    const updated = serverDb.updateSettings({ [key]: body.value });

    return NextResponse.json({ message: `Setting ${key} updated successfully.`, settings: updated });
  } catch (error) {
    console.error('Update single setting error:', error);
    return NextResponse.json({ error: 'Failed to update setting.' }, { status: 500 });
  }
}
