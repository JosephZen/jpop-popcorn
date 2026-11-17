import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET() {
  try {
    const sessions = serverDb.find('chat_sessions', () => true);
    sessions.sort((a, b) => new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime());

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('Chat sessions GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { sessionId, status } = await request.json();

    if (!sessionId || !status) {
      return NextResponse.json({ error: 'sessionId and status are required' }, { status: 400 });
    }

    const updated = serverDb.update(
      'chat_sessions',
      (s) => s.sessionId === sessionId,
      { status, unreadCount: 0 }
    );

    return NextResponse.json({ success: true, session: updated });
  } catch (err) {
    console.error('Chat sessions PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
