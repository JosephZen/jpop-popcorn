import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');

    let list = serverDb.find('products', p => p.isActive !== false);

    if (categoryId) {
      list = list.filter(p => p.categoryId === parseInt(categoryId));
    } else if (category && category !== 'all') {
      list = list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({ products: list });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userPayload = serverDb.getUserFromRequest(request);
    if (!userPayload || (userPayload.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, basePrice, sizeLabel, imageUrl, category, categoryId, flavors, isActive, sortOrder } = body;

    if (!name || (price === undefined && basePrice === undefined)) {
      return NextResponse.json({ error: 'Name and price are required.' }, { status: 400 });
    }

    const finalPrice = parseFloat(basePrice !== undefined ? basePrice : price).toFixed(2);
    const newProduct = serverDb.insert('products', {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: finalPrice,
      basePrice: finalPrice,
      sizeLabel: sizeLabel || '500g',
      imageUrl: imageUrl || null,
      category: category || (categoryId === 2 ? 'mini-donut' : 'popcorn'),
      categoryId: categoryId ? parseInt(categoryId) : (category === 'mini-donut' ? 2 : 1),
      flavors: Array.isArray(flavors) ? flavors : [],
      isActive: isActive !== false,
      sortOrder: parseInt(sortOrder) || 0,
    });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
