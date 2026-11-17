import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const messages = serverDb.find('chat_messages', (m) => m.sessionId === sessionId);
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Chat messages GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, content, senderType = 'customer', customerName, adminName, cart } = body;

    if (!sessionId || !content) {
      return NextResponse.json({ error: 'sessionId and content are required' }, { status: 400 });
    }

    // Check or create session
    let session = serverDb.findOne('chat_sessions', (s) => s.sessionId === sessionId);
    if (!session) {
      session = serverDb.insert('chat_sessions', {
        sessionId,
        customerName: customerName || `Visitor #${sessionId.slice(-4)}`,
        status: 'live',
        lastMessage: content,
        lastActivity: new Date().toISOString(),
        unreadCount: senderType === 'customer' ? 1 : 0,
        cart: cart || null,
      });
    } else {
      serverDb.update(
        'chat_sessions',
        (s) => s.sessionId === sessionId,
        {
          lastMessage: content,
          lastActivity: new Date().toISOString(),
          unreadCount: senderType === 'customer' ? (session.unreadCount || 0) + 1 : 0,
          customerName: customerName || session.customerName,
          status: 'live',
          ...(cart ? { cart } : {}),
        }
      );
    }

    const newMsg = serverDb.insert('chat_messages', {
      sessionId,
      senderType,
      content,
      adminName: senderType === 'admin' ? (adminName || 'Store Team') : null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err) {
    console.error('Chat messages POST error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
