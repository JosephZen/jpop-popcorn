import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=facebook_auth_failed`);
  }

  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
  const callbackUrl = `${protocol}://${host}/api/auth/facebook/callback`;

  try {
    // 1. Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: callbackUrl,
        code,
      }).toString();

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=facebook_token_failed`);
    }

    // 2. Fetch Facebook profile
    const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
    const profile = await userRes.json();

    const email = profile.email || `${profile.id}@facebook.user`;
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find or create user
    let user = serverDb.findOne('users', (u) => 
      u.facebookId === profile.id || 
      (u.email && u.email.toLowerCase() === normalizedEmail)
    );

    if (user) {
      if (!user.facebookId) {
        user = serverDb.update('users', (u) => u.id === user.id, { facebookId: profile.id });
      }
    } else {
      user = serverDb.insert('users', {
        email: normalizedEmail,
        name: profile.name || 'Facebook User',
        facebookId: profile.id,
        role: 'customer',
        passwordHash: null,
        phone: null,
        address: null,
        authProvider: 'facebook',
      });
    }

    const token = serverDb.signToken(user);
    return NextResponse.redirect(`${protocol}://${host}/login?token=${token}&social=facebook`);
  } catch (err) {
    console.error('Facebook OAuth callback error:', err);
    return NextResponse.redirect(`${protocol}://${host}/login?error=oauth_exception`);
  }
}
