import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/facebook/callback`;
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';

  const settings = serverDb.getSettings();
  const oauth = settings.oauth || {};
  const appId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID || oauth.facebook_app_id;

  if (!appId) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=missing_facebook_keys`);
  }

  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      scope: 'email,public_profile',
      response_type: 'code',
      state: redirect,
    }).toString();

  return NextResponse.redirect(fbAuthUrl);
}
