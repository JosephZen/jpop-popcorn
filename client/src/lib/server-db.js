import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import seedData from '../data/seed-data.json';
import locationsData from '../data/abra-locations.json';

const JWT_SECRET = process.env.JWT_SECRET || 'jpop-gourmet-popcorn-jwt-secret-key-2024';

// ─── Initialize In-Memory / Server Store ───
const defaultAdminPass = 'AdminPopcorn2026';
const adminHash = bcrypt.hashSync(defaultAdminPass, 10);
const demoHash = bcrypt.hashSync('demo1234', 10);

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
        email: 'admin@gmail.com',
        passwordHash: adminHash,
        name: 'J-Pop Administrator',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
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
      imageUrl: p.imageUrl,
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
  };

  global._jpopStore = globalStore;
}

export const serverDb = {
  find: (table, predicate) => {
    const list = globalStore[table] || [];
    return predicate ? list.filter(predicate) : [...list];
  },

  findOne: (table, predicate) => {
    const list = globalStore[table] || [];
    return list.find(predicate) || null;
  },

  insert: (table, row) => {
    if (!globalStore[table]) globalStore[table] = [];
    const list = globalStore[table];
    const nextId = list.length > 0 ? Math.max(...list.map(r => r.id || 0)) + 1 : 1;
    const newRow = { id: nextId, createdAt: new Date().toISOString(), ...row };
    list.push(newRow);
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
    return updated;
  },

  delete: (table, predicate) => {
    if (!globalStore[table]) return false;
    const beforeLen = globalStore[table].length;
    globalStore[table] = globalStore[table].filter(r => !predicate(r));
    return beforeLen > globalStore[table].length;
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

  comparePassword: async (password, hash) => {
    return bcrypt.compare(password, hash);
  },

  hashPassword: async (password) => {
    return bcrypt.hash(password, 10);
  },
};

export default serverDb;
