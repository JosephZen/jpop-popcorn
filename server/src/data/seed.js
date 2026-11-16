import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from '../config/db.js';
import {
  products,
  adminConfig,
  users,
  siteSettings,
  categories,
  customizationOptions,
  abraMunicipalities,
  abraBarangays
} from '../models/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const isReset = process.argv.includes('--reset');

  if (!db) {
    console.error('❌ Database not initialized. Please ensure DATABASE_URL is set in server/.env');
    process.exit(1);
  }

  try {
    console.log('🌱 Starting J-Pop Corner database seeding...');

    if (isReset) {
      console.log('⚠️ Reset flag detected. Cleaning existing tables...');
      await db.delete(abraBarangays);
      await db.delete(abraMunicipalities);
      await db.delete(customizationOptions);
      await db.delete(products);
      await db.delete(categories);
      await db.delete(adminConfig);
      await db.delete(users);
      await db.delete(siteSettings);
      console.log('✅ Existing data wiped.');
    }

    const dataPath = path.join(__dirname, 'seed-data.json');
    const locationsPath = path.join(__dirname, 'abra-locations.json');
    const seedData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    const locationsData = JSON.parse(await fs.readFile(locationsPath, 'utf-8'));

    // 1. Seed Categories
    console.log('📦 Seeding Categories...');
    const existingCats = await db.select().from(categories);
    const catMap = {};
    if (existingCats.length === 0 || isReset) {
      for (const cat of seedData.categories) {
        const [inserted] = await db.insert(categories).values({
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          customizationConfig: cat.customizationConfig,
        }).returning();
        catMap[cat.slug] = inserted.id;
      }
      console.log(`✅ Seeded ${seedData.categories.length} categories.`);
    } else {
      existingCats.forEach(c => { catMap[c.slug] = c.id; });
    }

    // 2. Seed Customization Options
    console.log('🎨 Seeding Customization Options...');
    const existingOpts = await db.select().from(customizationOptions);
    if (existingOpts.length === 0 || isReset) {
      for (const opt of seedData.customizationOptions) {
        const categoryId = opt.categoryId === 1 ? catMap['popcorn'] : catMap['mini-donut'];
        if (categoryId) {
          await db.insert(customizationOptions).values({
            categoryId,
            groupName: opt.groupName,
            name: opt.name,
            extraPrice: opt.extraPrice,
            isAvailable: opt.isAvailable,
          });
        }
      }
      console.log(`✅ Seeded ${seedData.customizationOptions.length} customization options.`);
    }

    // 3. Seed Products
    console.log('🍿 Seeding Products...');
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0 || isReset) {
      for (const p of seedData.products) {
        const categoryId = p.category === 'mini-donut' ? catMap['mini-donut'] : catMap['popcorn'];
        await db.insert(products).values({
          categoryId,
          name: p.name,
          description: p.description,
          basePrice: p.basePrice || p.price,
          price: p.price || p.basePrice,
          sizeLabel: p.sizeLabel || '500g',
          imageUrl: p.imageUrl,
          category: p.category,
          flavors: p.flavors,
          sizes: p.sizes,
          isActive: p.isActive,
          sortOrder: p.sortOrder,
        });
      }
      console.log(`✅ Seeded ${seedData.products.length} snack products.`);
    }

    // 4. Seed Admin User & Config
    console.log('🔐 Seeding Administrator (Admin@gmail.com / AdminPopcorn2026)...');
    const adminPassword = 'AdminPopcorn2026';
    const encryptedKey = await bcrypt.hash(adminPassword, 12);
    const usernameHash = await bcrypt.hash('admin', 12);

    const existingAdminConfig = await db.select().from(adminConfig);
    if (existingAdminConfig.length === 0 || isReset) {
      await db.insert(adminConfig).values({ encryptedKey, usernameHash });
    }

    const [existingAdminUser] = await db.select().from(users).where(eq(users.email, 'admin@gmail.com'));
    if (!existingAdminUser) {
      await db.insert(users).values({
        email: 'admin@gmail.com',
        passwordHash: encryptedKey,
        name: 'J-Pop Administrator',
        phone: '0912-345-6789',
        address: 'Poblacion, San Juan, Abra',
        role: 'ADMIN',
      });
      console.log('✅ Admin account seeded: Admin@gmail.com');
    }

    // 5. Seed Abra Municipalities & Barangays
    console.log('🗺️ Seeding 27 Abra Municipalities & Barangays...');
    const existingMun = await db.select().from(abraMunicipalities);
    if (existingMun.length === 0 || isReset) {
      for (const loc of locationsData) {
        const [m] = await db.insert(abraMunicipalities).values({
          name: loc.name,
          deliveryFee: loc.deliveryFee,
          isActive: true,
        }).returning();

        for (const b of loc.barangays) {
          await db.insert(abraBarangays).values({
            municipalityId: m.id,
            name: b,
            isActive: true,
          });
        }
      }
      console.log(`✅ Seeded 27 Abra Municipalities and all corresponding barangays!`);
    }

    // 6. Seed Site Settings
    console.log('⚙️ Seeding Site Settings...');
    const existingSettings = await db.select().from(siteSettings);
    if (existingSettings.length === 0 || isReset) {
      for (const [key, value] of Object.entries(seedData.settings)) {
        await db.insert(siteSettings).values({ key, value });
      }
      console.log('✅ Site settings seeded.');
    }

    console.log('🎉 Seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
