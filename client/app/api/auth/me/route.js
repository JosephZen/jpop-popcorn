import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = serverDb.findOne('users', u => u.id === userPayload.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || null,
        address: user.address || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};
    if (body.name) updates.name = body.name.trim();
    if (body.phone !== undefined) updates.phone = body.phone ? body.phone.trim() : null;
    if (body.address !== undefined) updates.address = body.address ? body.address.trim() : null;

    const updated = serverDb.update('users', u => u.id === userPayload.id, updates);

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone || null,
        address: updated.address || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
