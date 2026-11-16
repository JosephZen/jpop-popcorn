import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/local-db.json');
const SEED_FILE = path.join(__dirname, '../data/seed-data.json');
const LOCATIONS_FILE = path.join(__dirname, '../data/abra-locations.json');

// Initialize local database with seed data if file doesn't exist
const initData = () => {
  let seedData = { categories: [], products: [], customizationOptions: [], settings: {} };
  if (fs.existsSync(SEED_FILE)) {
    try {
      seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading seed-data.json:', e.message);
    }
  }

  let locationsData = [];
  if (fs.existsSync(LOCATIONS_FILE)) {
    try {
      locationsData = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading abra-locations.json:', e.message);
    }
  }

  const defaultAdminKey = 'AdminPopcorn2026';
  const defaultAdminUser = 'admin';
  const encryptedKey = bcrypt.hashSync(defaultAdminKey, 10);
  const usernameHash = bcrypt.hashSync(defaultAdminUser, 10);
  const demoPassHash = bcrypt.hashSync('demo1234', 10);

  // If local-db.json already exists, load and ensure required collections exist
  if (fs.existsSync(DB_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let modified = false;

      if (!existing.categories || existing.categories.length === 0) {
        existing.categories = seedData.categories || [];
        modified = true;
      }
      if (!existing.customization_options || existing.customization_options.length === 0) {
        existing.customization_options = (seedData.customizationOptions || []).map((o, idx) => ({ id: idx + 1, ...o }));
        modified = true;
      }
      if (!existing.cart_items) {
        existing.cart_items = [];
        modified = true;
      }
      if (!existing.abra_municipalities || existing.abra_municipalities.length === 0) {
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
        existing.abra_municipalities = municipalities;
        existing.abra_barangays = barangays;
        modified = true;
      }

      // Check for Admin@gmail.com
      const hasAdmin = existing.users && existing.users.some(u => u.email.toLowerCase() === 'admin@gmail.com');
      if (!hasAdmin) {
        existing.users = existing.users || [];
        existing.users.unshift({
          id: existing.users.length > 0 ? Math.max(...existing.users.map(u => u.id || 0)) + 1 : 1,
          email: 'admin@gmail.com',
          passwordHash: encryptedKey,
          name: 'J-Pop Admin',
          phone: '0912-345-6789',
          address: 'Poblacion, San Juan, Abra',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        });
        modified = true;
      }

      // Check if products have categoryId
      if (existing.products) {
        existing.products = existing.products.map(p => ({
          ...p,
          categoryId: p.categoryId || (p.category === 'mini-donut' ? 2 : 1),
          basePrice: p.basePrice || p.price,
          sizeLabel: p.sizeLabel || (p.name.includes('1kg') ? '1kg' : '500g'),
        }));
      }

      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2));
      }
      return existing;
    } catch (e) {
      console.error('Error reading local-db.json, recreating:', e.message);
    }
  }

  // Generate municipalities and barangays
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

  const initialDb = {
    categories: seedData.categories || [],
    products: (seedData.products || []).map((p, idx) => ({
      id: idx + 1,
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    customization_options: (seedData.customizationOptions || []).map((o, idx) => ({
      id: idx + 1,
      ...o,
      createdAt: new Date().toISOString(),
    })),
    admin_config: [
      { id: 1, encryptedKey, usernameHash }
    ],
    users: [
      {
        id: 1,
        email: 'admin@gmail.com',
        passwordHash: encryptedKey,
        name: 'J-Pop Administrator',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'demo@jpop.test',
        passwordHash: demoPassHash,
        name: 'Demo Customer',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'customer',
        createdAt: new Date().toISOString(),
      },
    ],
    cart_items: [],
    orders: [],
    order_items: [],
    abra_municipalities: municipalities,
    abra_barangays: barangays,
    site_settings: Object.entries(seedData.settings || {}).map(([key, value]) => ({
      key,
      value,
      updatedAt: new Date().toISOString(),
    })),
    chat_sessions: [],
    chat_messages: [],
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  } catch (err) {
    console.error('Failed to write initial local-db.json:', err.message);
  }

  return initialDb;
};

class LocalDB {
  constructor() {
    this.data = initData();
  }

  reload() {
    this.data = initData();
    return this.data;
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Failed to persist local-db.json:', err.message);
    }
  }

  // ─── Table Queries ───
  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  find(tableName, predicate) {
    const table = this.getTable(tableName);
    return predicate ? table.filter(predicate) : [...table];
  }

  findOne(tableName, predicate) {
    const table = this.getTable(tableName);
    return table.find(predicate) || null;
  }

  insert(tableName, row) {
    const table = this.getTable(tableName);
    const nextId = table.length > 0 ? Math.max(...table.map(r => r.id || 0)) + 1 : 1;
    const newRow = { id: nextId, createdAt: new Date().toISOString(), ...row };
    table.push(newRow);
    this.save();
    return newRow;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    let updatedRow = null;
    this.data[tableName] = table.map((r) => {
      if (predicate(r)) {
        updatedRow = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return updatedRow;
      }
      return r;
    });
    this.save();
    return updatedRow;
  }

  delete(tableName, predicate) {
    const table = this.getTable(tableName);
    const beforeLen = table.length;
    this.data[tableName] = table.filter((r) => !predicate(r));
    this.save();
    return beforeLen > this.data[tableName].length;
  }
}

const localDb = new LocalDB();
export default localDb;
