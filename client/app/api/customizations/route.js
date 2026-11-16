import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let list = serverDb.find('customization_options');
    if (categoryId) {
      list = list.filter(o => o.categoryId === parseInt(categoryId));
    }
    return NextResponse.json({ options: list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch options.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { categoryId, groupName, name, extraPrice, isAvailable } = await request.json();
    if (!categoryId || !groupName || !name) {
      return NextResponse.json({ error: 'categoryId, groupName, and name are required.' }, { status: 400 });
    }

    const newOpt = serverDb.insert('customization_options', {
      categoryId: parseInt(categoryId),
      groupName: groupName.trim(),
      name: name.trim(),
      extraPrice: extraPrice ? String(extraPrice) : '0.00',
      isAvailable: isAvailable !== false,
    });

    return NextResponse.json({ option: newOpt }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create option.' }, { status: 500 });
  }
}
