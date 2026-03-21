.DEFAULT_GOAL := help
.PHONY: help dev stop restart logs logs-odoo logs-nextjs \
        shell-odoo shell-nextjs shell-db init-odoo update-module \
        install-deps status clean reset

help:
	@echo "make dev            Levantar Docker"
	@echo "make stop           Parar servicios"
	@echo "make restart        Reiniciar"
	@echo "make logs           Logs todos"
	@echo "make logs-odoo      Logs Odoo"
	@echo "make logs-nextjs    Logs Next.js"
	@echo "make shell-odoo     Terminal Odoo"
	@echo "make shell-nextjs   Terminal Next.js"
	@echo "make shell-db       psql PostgreSQL"
	@echo "make init-odoo      Inicializar BD (primera vez)"
	@echo "make update-module  Actualizar módulo"
	@echo "make status         Estado contenedores"
	@echo "make reset          Borrar todo"

dev:
	docker compose up --build -d

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
	
reset:
	@read -rp "Escribe BORRAR para confirmar: " c; \
	[ "$$c" = "BORRAR" ] && docker compose down -v --rmi local || echo "Cancelado"
