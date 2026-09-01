# Hostinger DNS Setup Guide for `castrojosephzen.shop`

Follow these instructions to connect your Hostinger domain **castrojosephzen.shop** to your **J-Pop Popcorn** deployment (Vercel for Frontend, Render for Backend).

---

## 1. Frontend (Vercel) DNS Configuration

1. Log into your **Hostinger Control Panel** -> **Domains** -> **`castrojosephzen.shop`** -> **DNS / Nameservers**.
2. Add / update the following records:

| Type | Name / Host | Points to / Value | TTL | Notes |
|------|-------------|-------------------|-----|-------|
| **A** | `@` (or leave blank) | `76.76.21.21` | 3600 | Points apex domain `castrojosephzen.shop` to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com.` | 3600 | Points `www.castrojosephzen.shop` to Vercel |

3. In your **Vercel Project Dashboard**:
   - Go to **Settings** -> **Domains**.
   - Add `castrojosephzen.shop` and `www.castrojosephzen.shop`.
   - Vercel will automatically detect the DNS records and issue a free SSL certificate.

---

## 2. Backend API (Render) DNS Configuration

1. In your **Render Dashboard**:
   - Select your Web Service (`jpop-server`).
   - Go to **Settings** -> **Custom Domains**.
   - Add `api.castrojosephzen.shop`.
   - Render will give you a target URL (e.g., `jpop-server.onrender.com` or an IP address).

2. In your **Hostinger DNS Management**:
   - Add the CNAME record:

| Type | Name / Host | Points to / Value | TTL | Notes |
|------|-------------|-------------------|-----|-------|
| **CNAME** | `api` | `your-render-service.onrender.com.` | 3600 | Points `api.castrojosephzen.shop` to Render |

---

## 3. Environment Variables Quick Reference

Once DNS records are propagated:
- **Client Production (`client/.env.production`)**:
  ```env
  NEXT_PUBLIC_API_URL=https://api.castrojosephzen.shop/api
  ```
- **Server Production (`server/.env`)**:
  ```env
  SITE_DOMAIN=castrojosephzen.shop
  API_DOMAIN=api.castrojosephzen.shop
  CORS_ORIGINS=https://castrojosephzen.shop,https://www.castrojosephzen.shop,http://localhost:3000
  ```

---

## 4. Changing Your Domain Later

If you change your domain in the future:
1. Update `SITE_DOMAIN` and `API_DOMAIN` in `server/.env`.
2. Update `NEXT_PUBLIC_API_URL` in `client/.env.production`.
3. Add the new domain in Vercel and Render dashboards.
No code changes are needed!
