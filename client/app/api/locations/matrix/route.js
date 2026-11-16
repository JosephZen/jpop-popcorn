import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET() {
  try {
    const munList = serverDb.find('abra_municipalities').sort((a, b) => a.name.localeCompare(b.name));
    const barList = serverDb.find('abra_barangays').sort((a, b) => a.name.localeCompare(b.name));

    const matrix = munList.map(m => ({
      ...m,
      barangays: barList.filter(b => b.municipalityId === m.id),
    }));

    return NextResponse.json({ matrix });
  } catch (error) {
    console.error('Fetch shipping matrix API error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipping matrix.' }, { status: 500 });
  }
}
