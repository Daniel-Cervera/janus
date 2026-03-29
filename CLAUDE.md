# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Casa Janus is a headless CMS + art gallery platform combining:
- **Odoo 17** (backend/CMS) — manages artworks, collections, techniques, exhibitions, commissions
- **Next.js 14** (frontend) — gallery, artist profile, print shop, commission requests
- **PostgreSQL 15** — primary database
- **Cloudflare Images** — image CDN for artwork photography

## Development Commands

All major dev tasks are in the `Makefile`:

```bash
make dev            # Start Docker stack with hot-reload
make stop           # Stop all containers
make restart        # Restart everything
make logs           # View all logs
make logs-odoo      # Odoo-specific logs
make logs-nextjs    # Next.js-specific logs
make shell-odoo     # Shell into Odoo container
make shell-nextjs   # Shell into Next.js container
make shell-db       # psql access to PostgreSQL
make init-odoo      # First-time DB setup and module install
make update-module  # Reload casa_janus Odoo module after Python changes
make install-deps   # npm install for Next.js
make status         # Show container status
```

Next.js standalone (outside Docker):
```bash
cd nextjs
npm run dev         # Dev server at :3000
npm run build       # Production build
npm run lint        # ESLint
npm run type-check  # TypeScript check
```

> **After any Python change in `odoo/addons/casa_janus/`**, run `make update-module` then `make restart` for changes to take effect.

## Architecture

### Data Flow

```
Browser → Nginx (prod) → Next.js :3000 → Odoo API :8069 → PostgreSQL
```

Next.js pages fetch from its own `/api/*` routes, which proxy to the Odoo REST API with Bearer token auth. The frontend never talks directly to Odoo.

### Odoo Module (`odoo/addons/casa_janus/`)

**4 core models:**
- `casa_janus.technique` — Art techniques (slug, sequence)
- `casa_janus.collection` — Collections grouped by technique and year
- `casa_janus.artwork` — Individual artworks (dimensions, pricing, availability states, prints)
- `casa_janus.artist_exhibition_commission` — Artist profile, exhibitions, commission requests

**REST API controller** (`controllers/api.py`) — all routes under `/api/v1/`:
- `GET /api/v1/techniques` — list techniques (optional `include_collections`)
- `GET /api/v1/collections` — filter by `technique_id`
- `GET /api/v1/artworks` — paginated (24/page), filterable by technique/collection/availability
- `GET /api/v1/artwork/<slug>` — detail with images and prints
- All routes require `Authorization: Bearer <CASA_JANUS_API_TOKEN>` header

### Next.js Frontend (`nextjs/`)

**Pages Router** pages:
- `/` — Landing (hero, featured works, techniques)
- `/galeria` — Masonry gallery with filters
- `/artista` — Artist biography and CV
- `/encargos` — Custom commission form
- `/exposiciones` — Exhibitions
- `/tienda` — Print shop (in progress)

**Key lib files:**
- `lib/odoo-client.ts` — Typed HTTP client for the Odoo API with Zod validation
- `lib/types.ts` — TypeScript interfaces for all domain objects
- `lib/schemas.ts` — Zod schemas mirroring the types

**State (Zustand):**
- `store/cartStore.ts` — Shopping cart with localStorage persistence (24h TTL)
- `store/selectionStore.ts` — Gallery filter state

**Next.js API routes** (`pages/api/`):
- `gallery/index.ts` — proxies artworks to Odoo
- `artwork/[slug].ts` — proxies artwork detail (10 min cache)
- `commission/index.ts` — rate-limited, Zod-validated, honeypot-protected form submission
- `cart/checkout.ts` — validates and processes print orders
- `odoo/lead.ts` — creates CRM leads via Odoo XML-RPC

### Infrastructure

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Dev stack (PostgreSQL, Odoo, Next.js, Cloudflare Tunnel) |
| `docker-compose.prod.yml` | Production overrides (Nginx, SSL, compiled Next.js) |
| `nginx/nginx.conf` | Reverse proxy: casajanus.com → Next.js, admin.casajanus.com → Odoo |
| `.env` / `.env.example` | All secrets and config (see below) |

### Environment Variables

Required in `.env` (see `.env.example`):
```
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD
CASA_JANUS_API_TOKEN          # 32-byte hex — Bearer auth for Odoo REST API
CF_IMAGES_BASE_URL            # Cloudflare Images CDN base URL
CF_ACCOUNT_ID / CF_IMAGES_API_TOKEN
NEXTAUTH_URL / NEXTJS_BASE_URL
NEXTJS_REVALIDATE_TOKEN       # Used for ISR revalidation
```

## Odoo Development Notes

- XML views live in `odoo/addons/casa_janus/views/`
- After editing Python models or controllers, `make update-module && make restart` is required
- After editing XML views only, `make update-module` is usually sufficient
- The module manifest is at `__manifest__.py`; add new Python/XML files there before they'll load
- Odoo runs in threaded mode (workers: 0) in development; change in `odoo/odoo.conf` for production
