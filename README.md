# 🍿 J-Pop Popcorn E-Commerce Platform (v3)

A full-stack e-commerce platform for gourmet popcorn with real-time customer support bot, live chat handoff, QR code checkout (GCash, Maya, InstaPay), admin control center, and custom branding.

---

## 🚀 Quick Start

### 1. Backend Server Setup
```bash
cd server
npm install
cp .env.example .env     # update DATABASE_URL with your Neon / PostgreSQL connection
npm run db:push          # push database schema
npm run db:seed          # seed demo popcorn products, admin, and demo user
npm run dev              # runs API on http://localhost:5000
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev              # runs Next.js on http://localhost:3000
```

---

## 🔐 Default Demo Accounts

- **Demo Customer**:
  - Email: `demo@jpop.test`
  - Password: `demo1234`
- **Admin Portal** (`/admin/login`):
  - Master Secret Key: `admin123`
  - Hidden Username: `admin`

---

## 🌐 Custom Domain Setup (`castrojosephzen.shop`)

See [`dns-setup.md`](./dns-setup.md) for full Hostinger DNS instructions.

- **Frontend**: Vercel (`castrojosephzen.shop`)
- **Backend API**: Render (`api.castrojosephzen.shop`)
"# jpop-popcorn" 
