#!/bin/bash
# Script instalador de archivos Next.js para Casa Janus
# Ejecutar desde: /home/zkarrr/Documents/casa-janus
# Uso: bash instalar-nextjs.sh

set -e
BASE="/home/zkarrr/Documents/casa-janus"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}▸${NC} $1"; }
ok()  { echo -e "${GREEN}✓${NC} $1"; }

cd "$BASE"

# ── Directorios ──────────────────────────────────────────────
log "Creando directorios..."
mkdir -p nextjs/lib nextjs/hooks nextjs/styles nextjs/public/images
mkdir -p nextjs/components/{gallery,modal,commission}
mkdir -p nextjs/pages/galeria
mkdir -p nextjs/pages/api/{gallery,artwork,commission}
ok "Directorios listos"

# ── package.json ─────────────────────────────────────────────
log "package.json..."
cat > nextjs/package.json << 'EOF'
{
  "name": "casa-janus",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev":        "next dev",
    "build":      "next build",
    "start":      "next start",
    "lint":       "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next":      "14.2.5",
    "react":     "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node":        "^20",
    "@types/react":       "^18",
    "@types/react-dom":   "^18",
    "typescript":         "^5",
    "eslint":             "^8",
    "eslint-config-next": "14.2.5"
  }
}
EOF
ok "package.json"

# ── tsconfig.json ─────────────────────────────────────────────
log "tsconfig.json..."
cat > nextjs/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
ok "tsconfig.json"

# ── next.config.js ────────────────────────────────────────────
log "next.config.js..."
cat > nextjs/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
    ],
  },
}
module.exports = nextConfig
EOF
ok "next.config.js"

# ── .env.local ────────────────────────────────────────────────
log ".env.local..."
cat > nextjs/.env.local << 'EOF'
ODOO_BASE_URL=http://localhost:8069
ODOO_API_TOKEN=CAMBIAR_igual_que_CASA_JANUS_API_TOKEN
NEXT_PUBLIC_CF_IMAGES_BASE=https://imagedelivery.net/TU_ACCOUNT_HASH
NEXTJS_REVALIDATE_TOKEN=dev-token
NEXTAUTH_URL=http://localhost:3000
EOF
ok ".env.local"

echo ""
log "Copiando archivos TypeScript y CSS desde outputs..."

SRC="/mnt/user-data/outputs/casa-janus-completo/nextjs"

# lib/
cp "$SRC/lib/types.ts"           nextjs/lib/types.ts
cp "$SRC/lib/odoo-client.ts"     nextjs/lib/odoo-client.ts
ok "lib/"

# hooks/
cp "$SRC/hooks/useArtworkModal.ts"  nextjs/hooks/useArtworkModal.ts
cp "$SRC/hooks/useMural.ts"         nextjs/hooks/useMural.ts
ok "hooks/"

# styles/
cp "$SRC/styles/globals.css"  nextjs/styles/globals.css
ok "styles/"

# components/gallery/
cp "$SRC/components/gallery/ArtworkCard.tsx"          nextjs/components/gallery/
cp "$SRC/components/gallery/ArtworkCard.module.css"   nextjs/components/gallery/
cp "$SRC/components/gallery/GalleryMural.tsx"         nextjs/components/gallery/
cp "$SRC/components/gallery/GalleryMural.module.css"  nextjs/components/gallery/
ok "components/gallery/"

# components/modal/
cp "$SRC/components/modal/ArtworkModal.tsx"           nextjs/components/modal/
cp "$SRC/components/modal/ArtworkModal.module.css"    nextjs/components/modal/
ok "components/modal/"

# components/commission/
cp "$SRC/components/commission/CommissionForm.tsx"          nextjs/components/commission/
cp "$SRC/components/commission/CommissionForm.module.css"   nextjs/components/commission/
ok "components/commission/"

# pages/galeria/
cp "$SRC/pages/galeria/index.tsx"          nextjs/pages/galeria/
cp "$SRC/pages/galeria/Galeria.module.css" nextjs/pages/galeria/
ok "pages/galeria/"

# pages/api/
cp "$SRC/pages/api/gallery/index.ts"      nextjs/pages/api/gallery/
cp "$SRC/pages/api/artwork/[slug].ts"     "nextjs/pages/api/artwork/[slug].ts"
cp "$SRC/pages/api/commission/index.ts"   nextjs/pages/api/commission/
ok "pages/api/"

echo ""
echo -e "\033[0;32m═══════════════════════════════════════\033[0m"
echo -e "\033[0;32m ✅ Todos los archivos instalados\033[0m"
echo -e "\033[0;32m═══════════════════════════════════════\033[0m"
echo ""
echo "Archivos en nextjs/lib/"
ls nextjs/lib/
echo ""
echo "Archivos en nextjs/hooks/"
ls nextjs/hooks/
echo ""
echo "Archivos en nextjs/components/gallery/"
ls nextjs/components/gallery/
echo ""
echo "Siguiente paso:"
echo "  cd nextjs && npm install && cd .."
echo "  make dev"
