import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']);
export const deliveryMethodEnum = pgEnum('delivery_method', ['pickup', 'delivery']);
export const chatStatusEnum = pgEnum('chat_status', ['bot', 'live', 'closed']);
export const senderTypeEnum = pgEnum('sender_type', ['customer', 'bot', 'admin']);

// ─── Users ───
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  role: userRoleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Admin Config (Encryption Key + Hidden Username) ───
export const adminConfig = pgTable('admin_config', {
  id: serial('id').primaryKey(),
  encryptedKey: varchar('encrypted_key', { length: 255 }).notNull(),
  usernameHash: varchar('username_hash', { length: 255 }).notNull(),
});

// ─── Products ───
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  category: varchar('category', { length: 100 }).default('popcorn'),
  flavors: jsonb('flavors').default([]),
  sizes: jsonb('sizes').default([]),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Orders ───
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  deliveryMethod: deliveryMethodEnum('delivery_method').notNull(),
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
