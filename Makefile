.DEFAULT_GOAL := help
.PHONY: help dev stop restart logs logs-odoo logs-nextjs \
        shell-odoo shell-nextjs shell-db init-odoo update-module \
        install-deps status clean reset

help:
	@echo ""
	@echo "Casa Janus — comandos disponibles"
	@echo ""
	@echo "  make dev            Levantar Docker (todos los servicios)"
	@echo "  make stop           Parar servicios"
	@echo "  make restart        Reiniciar"
	@echo "  make logs           Logs en tiempo real"
	@echo "  make logs-odoo      Solo logs de Odoo"
	@echo "  make logs-nextjs    Solo logs de Next.js"
	@echo "  make shell-odoo     Terminal en contenedor Odoo"
	@echo "  make shell-nextjs   Terminal en contenedor Next.js"
	@echo "  make shell-db       psql en PostgreSQL"
	@echo "  make init-odoo      Inicializar BD (solo primera vez)"
	@echo "  make update-module  Actualizar módulo casa_janus"
	@echo "  make install-deps   npm install en nextjs/ (debug local)"
	@echo "  make status         Estado de contenedores"
	@echo "  make clean          Borrar imágenes locales"
	@echo "  make reset          PELIGRO: borra todos los datos"
	@echo ""

dev:
	docker compose up --build -d
	@echo "Next.js -> http://localhost:3000"
	@echo "Odoo    -> http://localhost:8069"

stop:
	docker compose down

restart: stop dev

logs:
	docker compose logs -f --tail=100

logs-odoo:
	docker compose logs -f --tail=100 odoo

logs-nextjs:
	docker compose logs -f --tail=100 nextjs

shell-odoo:
	docker compose exec odoo bash

shell-nextjs:
	docker compose exec nextjs sh

shell-db:
	docker compose exec postgres psql -U odoo -d casajanus

init-odoo:
	docker compose exec odoo bash /mnt/scripts/init_odoo.sh

update-module:
	docker compose exec odoo odoo \
		--config /etc/odoo/odoo.conf \
		--update casa_janus \
		--stop-after-init
	docker compose restart odoo

install-deps:
	cd nextjs && npm install

status:
	docker compose ps

clean:
	docker compose down --rmi local

reset:
	@read -rp "Escribe BORRAR para confirmar: " c; \
	[ "$$c" = "BORRAR" ] && docker compose down -v --rmi local || echo "Cancelado"
