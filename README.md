# Safvane Naturals — Ecommerce Website

Next.js ecommerce storefront and admin panel for Safvane Naturals, built from the PRD v2 spec.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4**
- **Supabase** (Postgres, Auth, Storage)
- **Resend** (order email notifications, optional)

## Quick Start

### 1. Install dependencies

```bash
cd safvane-web
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create two admin users in **Authentication → Users** (founder + brother)
4. Copy your project URL and keys

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=          # optional
RESEND_FROM_EMAIL=
```

### 4. Run locally

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin

## What's Included (Phase 1)

### Storefront
- Home (hero, featured products, trust badges)
- Shop with category filtering
- Product detail (variants, gallery, stock-aware cart)
- Cart (localStorage persistence, stock validation)
- Checkout (guest, COD, Pakistani phone validation)
- Order confirmation
- About, FAQ, Contact (CMS-driven)

### Admin Panel (`/admin`)
- Dashboard with recent orders and low-stock alerts
- Products CRUD with variants and image upload
- Categories CRUD
- Orders list and status management (stock restored on cancel)
- Content editor (About, FAQ)
- Site settings (shipping fee, notifications, contact info)

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Outstanding PRD Decisions

| Decision | Current approach |
|---|---|
| WhatsApp notifications | `wa.me` click-to-send link on order confirmation (v1 fallback) |
| Customer email at checkout | Optional field added |
| Blog / Analytics | Phase 2 — not yet built |

## Project Structure

```
safvane-web/
├── supabase/schema.sql    # Database schema + seed data
├── src/
│   ├── app/
│   │   ├── (storefront)/  # Public pages
│   │   ├── admin/         # Admin panel
│   │   └── api/           # Order & settings APIs
│   ├── components/
│   ├── context/           # Cart state
│   └── lib/               # Supabase, data, utils
```
