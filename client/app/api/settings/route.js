import { NextResponse } from 'next/server';
import serverDb from '@/lib/server-db';
import seedData from '@/data/seed-data.js';

const DEFAULT_SETTINGS = seedData.settings || {
  qr_codes: {
    gcash: {
      label: 'GCash',
      accountName: 'Joseph Zen Castro',
      accountNumber: '0912-345-6789',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH:09123456789;NAME:Joseph+Zen+Castro;NOTE:JPOP-CORNER',
    },
    maya: {
      label: 'Maya',
      accountName: 'Joseph Zen Castro',
      accountNumber: '0912-345-6789',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA:09123456789;NAME:Joseph+Zen+Castro;NOTE:JPOP-CORNER',
    },
    instapay: {
      label: 'InstaPay',
      accountName: 'Joseph Zen Castro (BDO/BPI)',
      accountNumber: '1234-5678-9012',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INSTAPAY:123456789012;NAME:Joseph+Zen+Castro;NOTE:JPOP-CORNER',
    },
  },
  faq: [
    {
      question: 'Can I pick up my order?',
      answer: 'Yes! You can choose "Store Pickup" at checkout with ₱0 shipping fee.\n📍 Pickup Location: J-Pop Corner, Poblacion, San Juan, Abra.\n⏱️ Prep Time: 15–30 minutes fresh from popping/frying. You will receive a ready-for-pickup notification!',
    },
    {
      question: 'Operating Hours',
      answer: '🕒 Store Hours: Monday to Saturday, 9:00 AM – 8:00 PM.\n⏰ Order Cut-off: 7:30 PM for same-day delivery or pickup.',
    },
    {
      question: 'Payment methods',
      answer: 'We support cashless QR code payments (GCash, Maya, InstaPay bank transfer with receipt screenshot upload) and Cash on Pickup/Delivery.',
    },
  ],
  site_customization: {
    heroTitle: 'J-Pop Corner — Fresh Gourmet Snacks & Custom Treats',
    heroSubtitle: 'Artisan monster-mushroom popcorn with custom flavor mix sliders & freshly glazed mini donuts. Popped fresh daily in Abra!',
    primaryColor: '#C23616',
    accentColor: '#F9CA24',
    bannerAnnouncement: '🎉 FREE DELIVERY PROMO: Order 5+ units of 1kg Popcorn (₱60) or 10+ units of 500g Popcorn (₱35) for automatic free shipping!',
  },
  facebook_messenger: {
    enabled: true,
    url: 'https://m.me/josephzencastro',
    label: 'Chat with Team on Messenger',
    username: 'josephzencastro',
  },
};

export async function GET() {
  try {
    const saved = serverDb.findOne('site_settings', () => true);
    const settingsMap = { ...DEFAULT_SETTINGS, ...(saved || {}) };
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Fetch settings API error:', error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

export async function PUT(request) {
  try {
    const user = serverDb.getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
    }

    let existing = serverDb.findOne('site_settings', () => true);
    if (existing) {
      serverDb.update('site_settings', () => true, settings);
    } else {
      serverDb.insert('site_settings', settings);
    }

    return NextResponse.json({ message: 'All site customizations and settings have been saved and applied!' });
  } catch (error) {
    console.error('Bulk update settings API error:', error);
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}
