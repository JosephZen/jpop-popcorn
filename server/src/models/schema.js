import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin', 'USER', 'ADMIN']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']);
export const deliveryMethodEnum = pgEnum('delivery_method', ['pickup', 'delivery']);
export const chatStatusEnum = pgEnum('chat_status', ['bot', 'live', 'closed']);
export const senderTypeEnum = pgEnum('sender_type', ['customer', 'bot', 'admin']);

// ─── Abra Municipalities & Barangays ───
export const abraMunicipalities = pgTable('abra_municipalities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('50.00').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const abraBarangays = pgTable('abra_barangays', {
  id: serial('id').primaryKey(),
  municipalityId: integer('municipality_id').references(() => abraMunicipalities.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  customDeliveryFee: decimal('custom_delivery_fee', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
});

// ─── Users ───
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }), // Nullable for social logins
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  defaultMunicipalityId: integer('default_municipality_id').references(() => abraMunicipalities.id),
  defaultBarangayId: integer('default_barangay_id').references(() => abraBarangays.id),
  role: varchar('role', { length: 20 }).default('customer').notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  facebookId: varchar('facebook_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Admin Config (Encryption Key + Hidden Username) ───
export const adminConfig = pgTable('admin_config', {
  id: serial('id').primaryKey(),
  encryptedKey: varchar('encrypted_key', { length: 255 }).notNull(),
  usernameHash: varchar('username_hash', { length: 255 }).notNull(),
});

// ─── Categories ───
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  sortOrder: integer('sort_order').default(0).notNull(),
  customizationConfig: jsonb('customization_config').default({}), // rules like slider-percentage vs multi-select
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Products ───
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('35.00').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('35.00').notNull(), // alias for compatibility
  imageUrl: text('image_url'),
  sizeLabel: varchar('size_label', { length: 50 }).default('500g'),
  category: varchar('category', { length: 100 }).default('popcorn'),
  flavors: jsonb('flavors').default([]),
  sizes: jsonb('sizes').default([]),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Customization Options ───
export const customizationOptions = pgTable('customization_options', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  groupName: varchar('group_name', { length: 100 }).notNull(), // 'Popcorn Flavor', 'Donut Syrup', 'Donut Choco Dip', 'Donut Topping'
  name: varchar('name', { length: 100 }).notNull(),
  extraPrice: decimal('extra_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Persistent Account Carts ───
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  customizationPayload: jsonb('customization_payload').default({}), // flavor percentages, syrups, dips, toppings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Orders ───
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0.00'),
  shippingFee: decimal('shipping_fee', { precision: 10, scale: 2 }).default('0.00'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  deliveryMethod: deliveryMethodEnum('delivery_method').notNull(),
  municipalityId: integer('municipality_id').references(() => abraMunicipalities.id),
  barangayId: integer('barangay_id').references(() => abraBarangays.id),
  deliveryAddress: text('delivery_address'),
  deliveryNotes: text('delivery_notes'),
  scheduledTime: timestamp('scheduled_time'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReceiptUrl: text('payment_receipt_url'),
  paymentConfirmed: boolean('payment_confirmed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Order Items ───
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtTime: decimal('price_at_time', { precision: 10, scale: 2 }).notNull(),
  customizationPayload: jsonb('customization_payload').default({}),
  flavor: varchar('flavor', { length: 100 }),
  size: varchar('size', { length: 100 }),
});

// ─── Chat Sessions ───
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  customerName: varchar('customer_name', { length: 255 }),
  status: chatStatusEnum('status').default('bot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Chat Messages ───
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),
  senderType: senderTypeEnum('sender_type').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Site Settings ───
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
