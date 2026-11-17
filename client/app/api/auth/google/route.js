import { NextResponse } from 'next/server';

export async function GET(request) {
  const host = request.headers.get('host') || 'castrojosephzen.shop';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    // Graceful fallback to instant fast-track social login on login page
    return NextResponse.redirect(`${protocol}://${host}/login?fastSocial=google`);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
