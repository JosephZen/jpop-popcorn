import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import seedData from '../data/seed-data.js';
import locationsData from '../data/abra-locations.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jpop-gourmet-popcorn-jwt-secret-key-2024';

// ─── Initialize In-Memory / Server Store ───
const defaultAdminPass = 'AdminPopcorn2026';
const adminHash = bcrypt.hashSync(defaultAdminPass, 10);
const demoHash = bcrypt.hashSync('demo1234', 10);

const TMP_FILE = path.join(process.platform === 'win32' ? process.cwd() : '/tmp', 'jpop-serverless-data.json');

// Global store cached across serverless invocations
let globalStore = global._jpopStore;

if (!globalStore) {
  let mId = 1;
  let bId = 1;
  const municipalities = [];
  const barangays = [];

  for (const loc of locationsData) {
    municipalities.push({
      id: mId,
      name: loc.name,
      deliveryFee: loc.deliveryFee || '50.00',
      isActive: true,
    });

    for (const bName of loc.barangays || []) {
      barangays.push({
        id: bId++,
        municipalityId: mId,
        name: bName,
        customDeliveryFee: null,
        isActive: true,
      });
    }
    mId++;
  }

  globalStore = {
    users: [
      {
        id: 1,
        email: 'Admin@gmail.com',
        passwordHash: adminHash,
        name: 'J-Pop Administrator',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'castrojosephzen@gmail.com',
        passwordHash: adminHash,
        name: 'Joseph Zen Castro',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'customer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        email: 'jzpinoy1144@gmail.com',
        passwordHash: adminHash,
        name: 'Joseph Zen Castro',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'customer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        email: 'demo@jpop.test',
        passwordHash: demoHash,
        name: 'Demo Customer',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'customer',
        createdAt: new Date().toISOString(),
      },
    ],
    categories: seedData.categories || [
      {
        id: 1,
        name: 'Popcorn',
        slug: 'popcorn',
        sortOrder: 1,
        customizationConfig: { type: 'percentage_mix', step: 25, unit: '%', allowMix: true },
      },
      {
        id: 2,
        name: 'Mini Donut',
        slug: 'mini-donut',
        sortOrder: 2,
        customizationConfig: { type: 'multi_select', maxFlavors: 8 },
      },
    ],
    products: (seedData.products || []).map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice || p.price || '35.00',
      price: p.price || p.basePrice || '35.00',
      sizeLabel: p.sizeLabel || (p.name.includes('1kg') ? '1kg' : '500g'),
      category: p.category || (p.name.includes('Donut') ? 'mini-donut' : 'popcorn'),
      categoryId: p.categoryId || (p.category === 'mini-donut' ? 2 : 1),
      imageUrl: p.imageUrl || (
        p.name.includes('1kg') ? '/products/popcorn-1kg.jpg' :
        p.name.includes('500g') ? '/products/popcorn-500g.jpg' :
        p.name.includes('16') ? '/products/donuts-16.jpg' :
        p.name.includes('Donut') ? '/products/donuts-8.jpg' :
        '/products/popcorn-500g.jpg'
      ),
      flavors: p.flavors || ['Spicy BBQ', 'Sour Cream & Onion', 'Cheese', 'BBQ'],
      sizes: p.sizes || [],
      isActive: p.isActive !== false,
      sortOrder: p.sortOrder || idx + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    customization_options: (seedData.customizationOptions || []).map((o, idx) => ({
      id: idx + 1,
      categoryId: o.categoryId,
      groupName: o.groupName,
      name: o.name,
      extraPrice: o.extraPrice || '0.00',
      isAvailable: o.isAvailable !== false,
    })),
    abra_municipalities: municipalities,
    abra_barangays: barangays,
    cart_items: [],
    orders: [],
    order_items: [],
    settings: seedData.settings || {},
    chat_sessions: [],
    chat_messages: [],
  };

  // Sync from /tmp if available
  try {
    if (fs.existsSync(TMP_FILE)) {
      const persisted = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
      if (Array.isArray(persisted.users)) {
        for (const u of persisted.users) {
          if (!globalStore.users.some(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
            globalStore.users.push(u);
          }
        }
      }
      if (Array.isArray(persisted.orders)) globalStore.orders = persisted.orders;
      if (Array.isArray(persisted.order_items)) globalStore.order_items = persisted.order_items;
      if (Array.isArray(persisted.cart_items)) globalStore.cart_items = persisted.cart_items;
      if (Array.isArray(persisted.chat_sessions)) globalStore.chat_sessions = persisted.chat_sessions;
      if (Array.isArray(persisted.chat_messages)) globalStore.chat_messages = persisted.chat_messages;
      if (persisted.settings) {
        if (persisted.settings.qr_codes) {
          for (const key of ['gcash', 'maya', 'instapay']) {
            if (persisted.settings.qr_codes[key]?.imageUrl?.includes('qrserver.com')) {
              persisted.settings.qr_codes[key].imageUrl = seedData.settings?.qr_codes?.[key]?.imageUrl || `/qr/${key}.jpg`;
            }
          }
        }
        globalStore.settings = { ...globalStore.settings, ...persisted.settings };
      }
    }
  } catch {}

  global._jpopStore = globalStore;
}

const syncSave = () => {
  try {
    const toSave = {
      users: globalStore.users,
      products: globalStore.products,
      categories: globalStore.categories,
      customization_options: globalStore.customization_options,
      abra_municipalities: globalStore.abra_municipalities,
      abra_barangays: globalStore.abra_barangays,
      orders: globalStore.orders,
      order_items: globalStore.order_items,
      cart_items: globalStore.cart_items,
      settings: globalStore.settings,
      chat_sessions: globalStore.chat_sessions,
      chat_messages: globalStore.chat_messages,
    };
    fs.writeFileSync(TMP_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  } catch {}
};

const syncLoad = () => {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const persisted = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
      if (Array.isArray(persisted.products)) {
        globalStore.products = persisted.products.map((p) => {
          if (!p.imageUrl || p.imageUrl.includes('unsplash.com')) {
            return {
              ...p,
              imageUrl: p.name.includes('1kg') ? '/products/popcorn-1kg.jpg' :
                p.name.includes('500g') ? '/products/popcorn-500g.jpg' :
                p.name.includes('16') ? '/products/donuts-16.jpg' :
                '/products/donuts-8.jpg'
            };
          }
          return p;
        });
      }
      if (Array.isArray(persisted.categories)) globalStore.categories = persisted.categories;
      if (Array.isArray(persisted.customization_options)) globalStore.customization_options = persisted.customization_options;
      if (Array.isArray(persisted.abra_municipalities)) globalStore.abra_municipalities = persisted.abra_municipalities;
      if (Array.isArray(persisted.abra_barangays)) globalStore.abra_barangays = persisted.abra_barangays;
      if (Array.isArray(persisted.chat_sessions)) globalStore.chat_sessions = persisted.chat_sessions;
      if (Array.isArray(persisted.chat_messages)) globalStore.chat_messages = persisted.chat_messages;
      if (Array.isArray(persisted.users)) {
        for (const u of persisted.users) {
          if (!globalStore.users.some(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
            globalStore.users.push(u);
          }
        }
      }
      if (Array.isArray(persisted.orders)) globalStore.orders = persisted.orders;
      if (Array.isArray(persisted.order_items)) globalStore.order_items = persisted.order_items;
      if (Array.isArray(persisted.cart_items)) globalStore.cart_items = persisted.cart_items;
      if (persisted.settings) {
        if (persisted.settings.qr_codes) {
          for (const key of ['gcash', 'maya', 'instapay']) {
            if (persisted.settings.qr_codes[key]?.imageUrl?.includes('qrserver.com')) {
              persisted.settings.qr_codes[key].imageUrl = seedData.settings?.qr_codes?.[key]?.imageUrl || `/qr/${key}.jpg`;
            }
          }
        }
        globalStore.settings = { ...globalStore.settings, ...persisted.settings };
      }
    }
  } catch {}
};

export const serverDb = {
  find: (table, predicate) => {
    syncLoad();
    const list = globalStore[table] || [];
    return predicate ? list.filter(predicate) : [...list];
  },

  findOne: (table, predicate) => {
    syncLoad();
    const list = globalStore[table] || [];
    return list.find(predicate) || null;
  },

  insert: (table, row) => {
    if (!globalStore[table]) globalStore[table] = [];
    const list = globalStore[table];
    const nextId = list.length > 0 ? Math.max(...list.map(r => r.id || 0)) + 1 : 1;
    const newRow = { id: nextId, createdAt: new Date().toISOString(), ...row };
    list.push(newRow);
    syncSave();
    return newRow;
  },

  update: (table, predicate, updates) => {
    if (!globalStore[table]) globalStore[table] = [];
    let updated = null;
    globalStore[table] = globalStore[table].map((r) => {
      if (predicate(r)) {
        updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return r;
    });
    syncSave();
    return updated;
  },

  delete: (table, predicate) => {
    if (!globalStore[table]) return false;
    const beforeLen = globalStore[table].length;
    globalStore[table] = globalStore[table].filter(r => !predicate(r));
    syncSave();
    return beforeLen > globalStore[table].length;
  },

  // ─── Settings Helpers ───
  getSettings: () => {
    syncLoad();
    const base = seedData.settings || {};
    const stored = globalStore.settings || {};
    return {
      ...base,
      ...stored,
      qr_codes: {
        ...(base.qr_codes || {}),
        ...(stored.qr_codes || {}),
      },
      oauth: {
        ...(base.oauth || {}),
        ...(stored.oauth || {}),
      },
      site_customization: {
        ...(base.site_customization || {}),
        ...(stored.site_customization || {}),
      },
      facebook_messenger: {
        ...(base.facebook_messenger || {}),
        ...(stored.facebook_messenger || {}),
      },
    };
  },

  updateSettings: (updates = {}) => {
    syncLoad();
    const current = serverDb.getSettings();
    globalStore.settings = {
      ...current,
      ...updates,
      qr_codes: {
        ...(current.qr_codes || {}),
        ...(updates.qr_codes || {}),
      },
      oauth: {
        ...(current.oauth || {}),
        ...(updates.oauth || {}),
      },
      site_customization: {
        ...(current.site_customization || {}),
        ...(updates.site_customization || {}),
      },
      facebook_messenger: {
        ...(current.facebook_messenger || {}),
        ...(updates.facebook_messenger || {}),
      },
      faq: updates.faq || current.faq || [],
    };
    syncSave();
    return globalStore.settings;
  },

  // ─── Auth / JWT Helpers ───
  signToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  },

  getUserFromRequest: (request) => {
    try {
      const authHeader = request.headers.get('authorization') || '';
      if (!authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch {
      return null;
    }
  },

  isAdmin: (userPayload) => {
    if (!userPayload) return false;
    const role = (userPayload.role || '').toLowerCase();
    const email = (userPayload.email || '').toLowerCase();
    return (
      role === 'admin' ||
      email === 'admin@gmail.com' ||
      email === 'castrojosephzen@gmail.com' ||
      email === 'jzpinoy1144@gmail.com'
    );
  },

  comparePassword: async (password, hash) => {
    if (!password || !hash) return false;
    if (password === hash) return true;
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  },

  hashPassword: async (password) => {
    return bcrypt.hash(password, 10);
  },
};

export default serverDb;
