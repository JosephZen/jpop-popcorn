import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function POST(request) {
  try {
    const { name, email, password, phone, address } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = serverDb.findOne('users', u => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await serverDb.hashPassword(password);
    const newUser = serverDb.insert('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      role: 'customer',
    });

    const token = serverDb.signToken(newUser);

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
