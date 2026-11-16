import { NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN || 'jpop_messenger_verify_token_2026';

// ─── Meta Messenger Verification Challenge (GET) ───
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Next.js Meta Messenger Webhook verified successfully!');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  return new Response('Bad Request', { status: 400 });
}

// ─── Meta Messenger Incoming Webhook Events (POST) ───
export async function POST(request) {
  try {
    const body = await request.json();

    if (body.object === 'page') {
      body.entry?.forEach((entry) => {
        const webhookEvent = entry.messaging?.[0];
        if (webhookEvent) {
          const senderPsid = webhookEvent.sender?.id;
          const message = webhookEvent.message;
          console.log(`📩 Incoming Meta Messenger webhook: Sender PSID ${senderPsid}:`, message?.text || '');
          // Shared inbox managed via Meta Business Suite across all linked admin accounts
        }
      });
      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Error processing Messenger webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
