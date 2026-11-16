import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET() {
  try {
    const cats = serverDb.find('categories').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const allOpts = serverDb.find('customization_options');

    const result = cats.map(cat => ({
      ...cat,
      options: allOpts.filter(o => o.categoryId === cat.id),
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { name, slug, sortOrder, customizationConfig } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 });
    }

    const newCat = serverDb.insert('categories', {
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      sortOrder: parseInt(sortOrder) || 0,
      customizationConfig: customizationConfig || {},
    });

    return NextResponse.json({ category: newCat }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
