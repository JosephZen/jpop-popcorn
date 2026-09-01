import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '../config/db.js';
import { products, adminConfig, users, siteSettings } from '../models/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const isReset = process.argv.includes('--reset');

  if (!db) {
    console.error('❌ Database not initialized. Please ensure DATABASE_URL is set in server/.env');
    process.exit(1);
  }

  try {
    console.log('🌱 Starting J-Pop Popcorn database seeding...');

    if (isReset) {
      console.log('⚠️ Reset flag detected. Cleaning existing tables...');
      await db.delete(products);
      await db.delete(adminConfig);
      await db.delete(users);
      await db.delete(siteSettings);
      console.log('✅ Existing data wiped.');
    }

    const dataPath = path.join(__dirname, 'seed-data.json');
    const fileData = await fs.readFile(dataPath, 'utf-8');
    const seedData = JSON.parse(fileData);

    // 1. Seed Products
    const existingProducts = await db.select().from(products);
    if (existingProducts.length > 0 && !isReset) {
      console.log(`⏭️ Products already exist (${existingProducts.length} items). Skipping product seed.`);
    } else {
      console.log('📦 Seeding demo products...');
      for (const product of seedData.products) {
        await db.insert(products).values(product);
      }
      console.log(`✅ Seeded ${seedData.products.length} gourmet popcorn demo products.`);
    }

    // 2. Seed Admin Config & Admin User
    const existingAdmin = await db.select().from(adminConfig);
    if (existingAdmin.length > 0 && !isReset) {
      console.log('⏭️ Admin config already exists. Skipping admin seed.');
    } else {
      console.log('🔐 Seeding demo admin credentials...');
      const adminKey = 'admin123';
      const adminUsername = 'admin';

      const encryptedKey = await bcrypt.hash(adminKey, 12);
      const usernameHash = await bcrypt.hash(adminUsername, 12);

      await db.insert(adminConfig).values({
        encryptedKey,
        usernameHash,
      });

      // Also create an admin user record
      const existingAdminUser = await db.select().from(users).where(eq(users.role, 'admin'));
      if (existingAdminUser.length === 0) {
        await db.insert(users).values({
          email: 'admin@jpop.local',
          passwordHash: encryptedKey,
          name: 'J-Pop Admin (Joseph Zen)',
          phone: '09123456789',
          role: 'admin',
        });
      }

      console.log('✅ Seeded demo admin config (Key: admin123, Username: admin).');
    }

    // 3. Seed Demo Customer Account
    const existingCustomer = await db.select().from(users).where(eq(users.email, 'demo@jpop.test'));
    if (existingCustomer.length > 0 && !isReset) {
      console.log('⏭️ Demo customer already exists. Skipping customer seed.');
    } else {
      console.log('👤 Seeding demo customer account...');
      const customerPassword = 'demo1234';
      const passwordHash = await bcrypt.hash(customerPassword, 12);

      await db.insert(users).values({
        email: 'demo@jpop.test',
        passwordHash,
        name: 'Demo Customer',
        phone: '09123456789',
        address: 'Blk 5 Lot 12 Sunshine St, Barangay San Juan, Abra',
        role: 'customer',
      });
      console.log('✅ Seeded demo customer (Email: demo@jpop.test, Password: demo1234).');
    }

    // 4. Seed Site Settings (QR Codes, FAQ, Customization)
    if (seedData.settings) {
      for (const [key, value] of Object.entries(seedData.settings)) {
        const existingSetting = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
        if (existingSetting.length === 0 || isReset) {
          if (existingSetting.length > 0) {
            await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
          } else {
            await db.insert(siteSettings).values({ key, value });
          }
        }
      }
      console.log('✅ Seeded site settings (QR Codes, FAQs, Site Customization).');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
