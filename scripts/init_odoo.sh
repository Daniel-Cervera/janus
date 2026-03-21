#!/bin/bash
# scripts/init_odoo.sh
#
# Inicializa la base de datos de Odoo e instala el módulo casa_janus.
# Ejecutar UNA SOLA VEZ después de levantar los contenedores por primera vez.
#
# Uso:
#   ./scripts/init_odoo.sh
#
# o con docker compose:
#   docker compose exec odoo bash /mnt/scripts/init_odoo.sh

set -euo pipefail

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Casa Janus — Inicialización de Odoo"
echo "═══════════════════════════════════════════════════"
echo ""

DB_NAME="${DB:-casajanus}"
DB_USER="${USER:-odoo}"
DB_HOST="${HOST:-postgres}"
DB_PORT="${PORT:-5432}"
DB_PASS="${PASSWORD:-}"

echo "▸ Base de datos: ${DB_NAME}"
echo "▸ Host Postgres: ${DB_HOST}:${DB_PORT}"
echo ""

# ── Esperar a que Postgres esté listo ──────────────────────────────────────
echo "⏳ Esperando a PostgreSQL..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" > /dev/null 2>&1; do
  sleep 2
done
echo "✓  PostgreSQL listo"
echo ""

# ── Inicializar la base de datos con el módulo casa_janus ──────────────────
echo "⏳ Instalando base de datos e módulo casa_janus..."
echo "   (esto puede tomar 2-5 minutos la primera vez)"
echo ""

odoo \
  --config /etc/odoo/odoo.conf \
  --database "${DB_NAME}" \
  --db_host "${DB_HOST}" \
  --db_port "${DB_PORT}" \
  --db_user "${DB_USER}" \
  --db_password "${DB_PASS}" \
  --init casa_janus \
  --without-demo all \
  --stop-after-init \
  --log-level warn

echo ""
echo "✓  Módulo casa_janus instalado"
echo ""

# ── Configurar parámetros del sistema vía psql ─────────────────────────────
echo "⏳ Configurando parámetros del sistema..."

PGPASSWORD="${DB_PASS}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  <<-SQL
    -- API token para la comunicación con Next.js
    INSERT INTO ir_config_parameter (key, value)
    VALUES
      ('casa_janus.api_token',               '${CASA_JANUS_API_TOKEN:-changeme}'),
      ('casa_janus.cloudflare_images_base_url', '${CASA_JANUS_CF_IMAGES_BASE_URL:-}'),
      ('casa_janus.cloudflare_account_id',    '${CASA_JANUS_CF_ACCOUNT_ID:-}'),
      ('casa_janus.cloudflare_images_api_token', '${CASA_JANUS_CF_IMAGES_API_TOKEN:-}'),
      ('casa_janus.nextjs_base_url',          '${CASA_JANUS_NEXTJS_BASE_URL:-http://nextjs:3000}'),
      ('casa_janus.nextjs_revalidate_token',  '${CASA_JANUS_NEXTJS_REVALIDATE_TOKEN:-changeme}')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
SQL

echo "✓  Parámetros del sistema configurados"
echo ""

# ── Crear usuario artista ──────────────────────────────────────────────────
echo "⏳ Creando usuario artista en Odoo..."

PGPASSWORD="${DB_PASS}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  <<-SQL
    DO \$\$
    DECLARE
      partner_id INTEGER;
      user_id    INTEGER;
    BEGIN
      -- Crear partner
      INSERT INTO res_partner (name, email, active)
      VALUES ('Artista Casa Janus', 'artista@casajanus.com', true)
      RETURNING id INTO partner_id;

      -- Crear usuario (contraseña: cambiar tras primer login)
      INSERT INTO res_users (partner_id, login, active)
      VALUES (partner_id, 'artista@casajanus.com', true)
      RETURNING id INTO user_id;

      RAISE NOTICE 'Usuario artista creado con ID: %', user_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'Usuario artista ya existe, saltando...';
    END \$\$;
SQL

echo "✓  Usuario artista creado (login: artista@casajanus.com)"
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Inicialización completada"
echo ""
echo "  Accesos:"
echo "  Odoo admin:    http://localhost:8069"
echo "  Next.js:       http://localhost:3000"
echo "  Galería:       http://localhost:3000/galeria"
echo ""
echo "  Credenciales Odoo por defecto:"
echo "  Usuario: admin"
echo "  Pass:    admin  ← ¡Cambiar inmediatamente!"
echo "═══════════════════════════════════════════════════"
echo ""