import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=google_auth_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=token_exchange_failed`);
    }

    // 2. Fetch Google profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=no_email_from_google`);
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // 3. Find or create user
    let user = serverDb.findOne('users', (u) => 
      u.googleId === profile.id || 
      (u.email && u.email.toLowerCase() === normalizedEmail)
    );

    if (user) {
      if (!user.googleId) {
        user = serverDb.update('users', (u) => u.id === user.id, { googleId: profile.id });
      }
    } else {
      user = serverDb.insert('users', {
        email: normalizedEmail,
        name: profile.name || 'Google User',
        googleId: profile.id,
        role: 'customer',
        passwordHash: null,
        phone: null,
        address: null,
        authProvider: 'google',
      });
    }

    const token = serverDb.signToken(user);
    return NextResponse.redirect(`${protocol}://${host}/login?token=${token}&social=google`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${protocol}://${host}/login?error=oauth_exception`);
  }
}
