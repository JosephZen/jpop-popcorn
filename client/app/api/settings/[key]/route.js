import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function PUT(request, { params }) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { key } = await params;
    const body = await request.json();

    let existing = serverDb.findOne('site_settings', () => true);
    if (!existing) {
      existing = serverDb.insert('site_settings', { [key]: body.value });
    } else {
      existing = serverDb.update('site_settings', () => true, { [key]: body.value });
    }

    return NextResponse.json({ message: `Setting ${key} updated successfully.` });
  } catch (error) {
    console.error('Update single setting error:', error);
    return NextResponse.json({ error: 'Failed to update setting.' }, { status: 500 });
  }
}
