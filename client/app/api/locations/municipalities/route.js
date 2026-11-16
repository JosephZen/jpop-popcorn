import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET() {
  try {
    const list = serverDb.find('abra_municipalities').sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ municipalities: list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch municipalities.' }, { status: 500 });
  }
}
