import { NextResponse } from 'next/server';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/facebook/callback`;

  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID;

  if (!appId) {
    // Graceful fallback to instant fast-track social login on login page
    return NextResponse.redirect(`${protocol}://${host}/login?fastSocial=facebook`);
  }

  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      scope: 'email,public_profile',
      response_type: 'code',
    }).toString();

  return NextResponse.redirect(fbAuthUrl);
}
