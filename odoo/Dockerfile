# odoo/Dockerfile
# Odoo 17 Community con el módulo Casa Janus pre-instalado

FROM odoo:17.0

# Instalar dependencias del sistema que Odoo 17 pueda necesitar
USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python adicionales del módulo casa_janus
# (si el módulo requiere librerías extra, añadir aquí)
# RUN pip3 install --no-cache-dir requests pillow

# Crear directorio de addons extra
RUN mkdir -p /mnt/extra-addons && chown -R odoo:odoo /mnt/extra-addons

USER odoo

# El módulo se monta como volumen en docker-compose
# pero copiamos para que la imagen sea autocontenida en producción
COPY --chown=odoo:odoo addons/ /mnt/extra-addons/

EXPOSE 8069 8072