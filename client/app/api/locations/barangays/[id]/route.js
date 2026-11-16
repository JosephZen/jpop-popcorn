import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const municipalityId = parseInt(id);
    const list = serverDb.find('abra_barangays', b => b.municipalityId === municipalityId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ barangays: list });
  } catch (error) {
    console.error('Fetch barangays API error:', error);
    return NextResponse.json({ error: 'Failed to fetch barangays.' }, { status: 500 });
  }
}
