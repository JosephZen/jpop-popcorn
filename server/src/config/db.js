import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import config from './index.js';
import * as schema from '../models/schema.js';
import localDb from './localDb.js';

let db = null;
let isUsingNeon = false;

if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
  try {
    const sql = neon(config.databaseUrl);
    db = drizzle(sql, { schema });
    isUsingNeon = true;
    console.log('⚡ Connected to Neon PostgreSQL cloud database.');
  } catch (err) {
    console.warn('⚠️ Could not connect to Neon DB, falling back to Local JSON database:', err.message);
    isUsingNeon = false;
  }
} else {
  console.log('📁 Using local persistent database (server/src/data/local-db.json). Ready for local testing!');
  console.log('💡 To connect Neon PostgreSQL, set DATABASE_URL in server/.env');
}

export { isUsingNeon, localDb };
export default db;
