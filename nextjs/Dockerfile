# nextjs/Dockerfile
# Multi-stage build:
#   development  → hot-reload, source montado como volumen
#   production   → imagen optimizada, sin devDependencies

# ── Stage base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copiar archivos de dependencias primero (mejora caché de Docker)
COPY package.json package-lock.json* ./

# ── Stage: instalar dependencias ─────────────────────────────────────────
FROM base AS deps
RUN npm ci

# ── Stage: desarrollo (hot-reload) ────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# El código se monta como volumen en docker-compose.yml
# COPY . .  ← NO copiar aquí; el código viene del volumen

EXPOSE 3000

# next dev escucha en todas las interfaces
CMD ["npx", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

# ── Stage: builder (para producción) ─────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar dependencias del stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo el código fuente
COPY . .

# Build de producción de Next.js
RUN npm run build

# ── Stage: producción ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copiar solo lo necesario para producción (standalone output de Next.js)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# En producción Next.js usa standalone server.js
CMD ["node", "server.js"]