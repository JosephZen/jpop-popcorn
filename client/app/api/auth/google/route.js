import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';

  const settings = serverDb.getSettings();
  const oauth = settings.oauth || {};
  const clientId = process.env.GOOGLE_CLIENT_ID || oauth.google_client_id;

  if (!clientId) {
    return NextResponse.redirect(`${protocol}://${host}/login?error=missing_google_keys`);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'consent',
      state: redirect,
    }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
