import { Router } from 'express';
import { eq } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { siteSettings } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const DEFAULT_SETTINGS = {
  qr_codes: {
    gcash: {
      label: 'GCash',
      accountName: 'Joseph Zen Castro',
      accountNumber: '0912-345-6789',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH:09123456789;NAME:Joseph+Zen+Castro;NOTE:JPOP-POPCORN',
    },
    maya: {
      label: 'Maya',
      accountName: 'Joseph Zen Castro',
      accountNumber: '0912-345-6789',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA:09123456789;NAME:Joseph+Zen+Castro;NOTE:JPOP-POPCORN',
    },
    instapay: {
      label: 'InstaPay',
      accountName: 'Joseph Zen Castro (BDO/BPI)',
      accountNumber: '1234-5678-9012',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INSTAPAY:123456789012;NAME:Joseph+Zen+Castro;NOTE:JPOP-POPCORN',
    },
  },
  faq: [
    {
      question: 'What flavors do you have?',
      answer: 'We offer 6 artisan flavors: Classic Golden Butter, Aged Sharp Cheddar, Salted Caramel Gold, Fiery Sriracha BBQ, Cookies & Cream Dream, and Kyoto Matcha White Chocolate! Check our Shop page for the full menu.'
    },
    {
      question: 'How do I order?',
      answer: 'Browse our menu, choose your favorite flavors, add them to your cart, and proceed to checkout. You can pay seamlessly via QR code (GCash, Maya, InstaPay).'
    },
    {
      question: 'What are the delivery fees & bulk discounts?',
      answer: '🍿 Bulk Order Promo:\n• 10 or more items: FREE Delivery!\n• 7 to 9 items: Only ₱5 shipping fee\n• 2 to 6 items: ₱40 shipping fee\n• 1 item: ₱50 shipping fee\n• Pickup at store: FREE!'
    },
    {
      question: 'How do I pay?',
      answer: 'We accept cashless QR code payments via GCash, Maya, and InstaPay. Scan the QR code during checkout, make the transfer, and upload your payment receipt screenshot.'
    },
    {
      question: 'What are your operating hours?',
      answer: 'We pop fresh popcorn Monday to Saturday, 9:00 AM to 8:00 PM.'
    },
    {
      question: 'Can I pick up my order?',
      answer: 'Yes! Select "Pickup" at checkout and choose your scheduled pickup time.'
    }
  ],
  site_customization: {
    heroTitle: 'Freshly Popped, Perfectly Flavored',
    heroSubtitle: 'Handcrafted gourmet popcorn popped fresh daily and delivered straight to your door.',
    primaryColor: '#8B1A1A',
    accentColor: '#F5A623',
    bannerAnnouncement: '🎉 Bulk Order Promo: Order 10+ items for FREE DELIVERY!'
  }
};

// ─── Get Settings (Public) ───
router.get('/', async (req, res) => {
  try {
    const settingsMap = { ...DEFAULT_SETTINGS };

    if (isUsingNeon && db) {
      const rows = await db.select().from(siteSettings);
      for (const row of rows) {
        settingsMap[row.key] = row.value;
      }
    } else {
      const rows = localDb.find('site_settings');
      for (const row of rows) {
        settingsMap[row.key] = row.value;
      }
    }

    res.json({ settings: settingsMap });
  } catch (err) {
    console.error('Get settings error:', err);
    res.json({ settings: DEFAULT_SETTINGS });
  }
});

// ─── Admin: Bulk Update Settings (Save / Apply Changes) ───
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }

    if (isUsingNeon && db) {
      for (const [key, value] of Object.entries(settings)) {
        const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
        if (existing.length > 0) {
          await db.update(siteSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(siteSettings.key, key));
        } else {
          await db.insert(siteSettings).values({ key, value });
        }
      }
    } else {
      for (const [key, value] of Object.entries(settings)) {
        const existing = localDb.findOne('site_settings', s => s.key === key);
        if (existing) {
          localDb.update('site_settings', s => s.key === key, { value });
        } else {
          localDb.insert('site_settings', { key, value });
        }
      }
    }

    res.json({ message: 'All site customizations and settings have been saved and applied!' });
  } catch (err) {
    console.error('Bulk update settings error:', err);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

export default router;
