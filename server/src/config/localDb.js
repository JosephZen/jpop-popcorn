import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/local-db.json');
const SEED_FILE = path.join(__dirname, '../data/seed-data.json');

// Initialize local database with seed data if file doesn't exist
const initData = () => {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading local-db.json, resetting to seed:', e.message);
    }
  }

  let seedData = { products: [], settings: {} };
  if (fs.existsSync(SEED_FILE)) {
    try {
      seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    } catch {}
  }

  const defaultAdminKey = 'admin123';
  const defaultAdminUser = 'admin';
  const encryptedKey = bcrypt.hashSync(defaultAdminKey, 10);
  const usernameHash = bcrypt.hashSync(defaultAdminUser, 10);
  const demoPassHash = bcrypt.hashSync('demo1234', 10);

  const initialDb = {
    products: seedData.products?.map((p, idx) => ({
      id: idx + 1,
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) || [],
    admin_config: [
      { id: 1, encryptedKey, usernameHash }
    ],
    users: [
      {
        id: 1,
        email: 'admin@jpop.local',
        passwordHash: encryptedKey,
        name: 'J-Pop Admin (Joseph Zen)',
        phone: '0912-345-6789',
        address: 'Abra, Philippines',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'demo@jpop.test',
        passwordHash: demoPassHash,
        name: 'Demo Customer',
        phone: '0912-345-6789',
        address: '123 Sunshine Street, San Juan, Abra',
        role: 'customer',
        createdAt: new Date().toISOString(),
      },
    ],
    orders: [],
    order_items: [],
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

export const localDb = new LocalDB();
export default localDb;
