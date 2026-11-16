import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Built-in Admin Bypass Check
    if (
      (normalizedEmail === 'admin@gmail.com' || normalizedEmail === 'admin') &&
      (password === 'AdminPopcorn2026' || password === 'admin123' || password === 'admin')
    ) {
      let adminUser = serverDb.findOne('users', u => (u.role || '').toLowerCase() === 'admin');
      if (!adminUser) {
        adminUser = {
          id: 1,
          email: 'Admin@gmail.com',
          name: 'J-Pop Administrator',
          role: 'ADMIN',
          phone: '0912-345-6789',
          address: 'Poblacion, San Juan, Abra',
        };
      }
      const token = serverDb.signToken(adminUser);
      return NextResponse.json({
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: 'ADMIN',
          phone: adminUser.phone || null,
          address: adminUser.address || null,
        },
      });
    }

    const user = serverDb.findOne('users', u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = await serverDb.comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
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
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
