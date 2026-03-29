# -*- coding: utf-8 -*-
from odoo import models


class CasaJanusCloudflareImageMixin(models.AbstractModel):
    _name = 'casa_janus.cloudflare.mixin'
    _description = 'Mixin: construcción de URLs de Cloudflare Images'

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id:
            return None
        base = self.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.cloudflare_images_base_url', ''
        )
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None
