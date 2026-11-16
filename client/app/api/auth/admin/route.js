import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function POST(request) {
  try {
    const { key, username } = await request.json();

    if (!key || !username) {
      return NextResponse.json({ error: 'Master credentials are required.' }, { status: 400 });
    }

    const normUser = username.toLowerCase().trim();

    // Check if logging in as Admin@gmail.com with AdminPopcorn2026
    const isAdminEmail = normUser === 'admin@gmail.com' || normUser === 'admin';
    const isMatchingPass = key === 'AdminPopcorn2026' || key === 'admin123';

    if (isAdminEmail && isMatchingPass) {
      let adminUser = serverDb.findOne('users', u => u.role === 'ADMIN' || u.role === 'admin');
      if (!adminUser) {
        adminUser = {
          id: 1,
          email: 'admin@gmail.com',
          name: 'J-Pop Administrator',
          role: 'ADMIN',
        };
      }
      const token = serverDb.signToken(adminUser);
      return NextResponse.json({
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    }

    // Also check database users
    const user = serverDb.findOne('users', u => u.email.toLowerCase() === normUser);
    if (user && (user.role === 'ADMIN' || user.role === 'admin')) {
      const isValid = await serverDb.comparePassword(key, user.passwordHash);
      if (isValid) {
        const token = serverDb.signToken(user);
        return NextResponse.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Authorization failed. Invalid encryption credentials.' }, { status: 401 });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Admin authorization failed.' }, { status: 500 });
  }
}
