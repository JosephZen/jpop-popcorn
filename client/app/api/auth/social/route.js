import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function POST(request) {
  try {
    const { provider, email, name, providerId } = await request.json();

    if (!provider || !email) {
      return NextResponse.json({ error: 'Provider and email are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const providerField = provider === 'google' ? 'googleId' : 'facebookId';

    // 1. Check if user exists by provider ID or email
    let user = serverDb.findOne('users', (u) => 
      (providerId && u[providerField] === providerId) ||
      (u.email && u.email.toLowerCase() === normalizedEmail)
    );

    if (user) {
      // Link provider ID if not linked yet
      if (providerId && !user[providerField]) {
        user = serverDb.update('users', (u) => u.id === user.id, {
          [providerField]: providerId,
        });
      }
    } else {
      // 2. Create new user from social auth
      user = serverDb.insert('users', {
        email: normalizedEmail,
        name: name || (provider === 'google' ? 'Google User' : 'Facebook User'),
        [providerField]: providerId || `${provider}_${Date.now()}`,
        role: 'customer',
        passwordHash: null,
        phone: null,
        address: null,
        authProvider: provider,
      });
    }

    const token = serverDb.signToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        address: user.address || null,
      },
    });
  } catch (err) {
    console.error('Social auth error:', err);
    return NextResponse.json({ error: 'Social authentication failed.' }, { status: 500 });
  }
}
