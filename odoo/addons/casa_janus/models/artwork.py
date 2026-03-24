# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import re

AVAILABILITY = [
    ('available', 'Disponible'),
    ('reserved',  'Reservada'),
    ('sold',      'Vendida'),
    ('nfs',       'No está en venta'),
]

class CasaJanusArtwork(models.Model):
    _name = 'casa_janus.artwork'
    _description = 'Obra de Arte'
    _order = 'year desc, sequence, name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # ── Identificación ──────────────────────────────────────────────────────
    name = fields.Char(string='Título', required=True, tracking=True)
    slug = fields.Char(string='Slug URL', required=True, index=True)
    year = fields.Integer(string='Año', required=True)
    sequence = fields.Integer(string='Orden en colección', default=10)
    active = fields.Boolean(string='Activa', default=True)
    is_featured = fields.Boolean(string='Destacada', default=False)

    # ── Vínculo con el Artista (NUEVO) ───────────────────────────────────────
    artist_id = fields.Many2one(
        comodel_name='casa_janus.artist',
        string='Artista / Autor',
        required=True,
        index=True,
        tracking=True,
        default=lambda self: self.env['casa_janus.artist'].search([('is_main_artist', '=', True)], limit=1)
    )

    # ── Clasificación ───────────────────────────────────────────────────────
    collection_id = fields.Many2one('casa_janus.collection', string='Colección', required=True, ondelete='restrict', index=True, tracking=True)
    technique_id = fields.Many2one('casa_janus.technique', string='Técnica', related='collection_id.technique_id', store=True, readonly=True, index=True)
    technique_name = fields.Char(related='technique_id.name', store=True)

    # ── Datos técnicos ───────────────────────────────────────────────────────
    width_cm = fields.Float(string='Ancho (cm)', digits=(6, 1))
    height_cm = fields.Float(string='Alto (cm)', digits=(6, 1))
    depth_cm = fields.Float(string='Profundidad (cm)', digits=(6, 1))
    medium = fields.Char(string='Técnica / Soporte')
    description = fields.Text(string='Descripción')

    # Grabado / edición limitada
    edition_number = fields.Integer(string='Número de ejemplar')
    edition_total = fields.Integer(string='Tiraje total')
    edition_display = fields.Char(string='Edición', compute='_compute_edition_display', store=True)

    # ── Comercial ────────────────────────────────────────────────────────────
    price = fields.Float(string='Precio', digits=(10, 2), tracking=True)
    currency_id = fields.Many2one('res.currency', string='Moneda', default=lambda self: self.env.ref('base.USD').id)
    availability = fields.Selection(selection=AVAILABILITY, string='Disponibilidad', default='available', required=True, tracking=True)
    product_tmpl_id = fields.Many2one('product.template', string='Producto Odoo', ondelete='set null')

    # ── Imágenes (Cloudflare) ────────────────────────────────────────────────
    primary_cf_image_id = fields.Char(string='ID imagen principal (Cloudflare)')
    image_ids = fields.One2many('casa_janus.artwork.image', 'artwork_id', string='Galería de imágenes')

    # ── Metadatos SEO ────────────────────────────────────────────────────────
    meta_title = fields.Char(string='Meta título (SEO)')
    meta_description = fields.Char(string='Meta descripción (SEO)')

    # ── Relaciones inversas ──────────────────────────────────────────────────
    print_product_ids = fields.One2many('casa_janus.print_product', 'artwork_id', string='Prints / Reproducciones')

    _sql_constraints = [('slug_unique', 'UNIQUE(slug)', 'El slug de obra debe ser único.')]

    @api.depends('edition_number', 'edition_total')
    def _compute_edition_display(self):
        for rec in self:
            rec.edition_display = f'{rec.edition_number}/{rec.edition_total}' if rec.edition_number and rec.edition_total else ''

    @api.constrains('slug')
    def _check_slug(self):
        pattern = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
        for rec in self:
            if not pattern.match(rec.slug):
                raise ValidationError(f'El slug "{rec.slug}" no es válido. Usa solo letras minúsculas, números y guiones.')

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id: return None
        base = self.env['ir.config_parameter'].sudo().get_param('casa_janus.cloudflare_images_base_url', '')
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None

    def api_dict(self, detail=False):
        primary_url = self._build_cf_url(self.primary_cf_image_id)
        result = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'year': self.year,
            'artist': {
                'id': self.artist_id.id,
                'name': self.artist_id.name,
                'is_main_artist': self.artist_id.is_main_artist,
            },
            'collection': {
                'id': self.collection_id.id,
                'name': self.collection_id.name,
                'slug': self.collection_id.slug,
            },
            'technique': {
                'id': self.technique_id.id,
                'name': self.technique_id.name,
                'slug': self.technique_id.slug,
            },
            'medium': self.medium or '',
            'dimensions': self._dimensions_dict(),
            'description': self.description or '',
            'edition': self.edition_display or None,
            'price': self.price,
            'currency': self.currency_id.name if self.currency_id else 'USD',
            'availability': self.availability,
            'availability_label': dict(AVAILABILITY).get(self.availability, ''),
            'is_featured': self.is_featured,
            'primary_image': {
                'cf_id': self.primary_cf_image_id or '',
                'url': primary_url,
                'url_thumb': self._build_cf_url(self.primary_cf_image_id, 'thumb'),
                'url_medium': self._build_cf_url(self.primary_cf_image_id, 'medium'),
                'url_large': self._build_cf_url(self.primary_cf_image_id, 'large'),
            },
            'seo': {
                'title': self.meta_title or self.name,
                'description': self.meta_description or (self.description or '')[:160],
            },
        }
        if detail:
            result['images'] = [img.api_dict() for img in self.image_ids]
            result['prints'] = [p.api_dict() for p in self.print_product_ids.filtered(lambda p: p.stock_qty > 0)]
        return result

    def _dimensions_dict(self):
        parts = []
        if self.height_cm: parts.append(f'{self.height_cm:.0f}')
        if self.width_cm: parts.append(f'{self.width_cm:.0f}')
        if self.depth_cm: parts.append(f'{self.depth_cm:.0f}')
        return {
            'width_cm': self.width_cm,
            'height_cm': self.height_cm,
            'depth_cm': self.depth_cm or None,
            'label': ' × '.join(parts) + ' cm' if parts else '',
            'aspect_ratio': round(self.height_cm / self.width_cm, 4) if self.width_cm else 1.0,
        }

class CasaJanusArtworkImage(models.Model):
    _name = 'casa_janus.artwork.image'
    _description = 'Imagen de Obra'
    _order = 'is_primary desc, sequence'

    artwork_id = fields.Many2one('casa_janus.artwork', string='Obra', required=True, ondelete='cascade', index=True)
    cf_image_id = fields.Char(string='Cloudflare Image ID', required=True)
    is_primary = fields.Boolean(string='Imagen principal', default=False)
    alt_text = fields.Char(string='Texto alternativo')
    sequence = fields.Integer(string='Orden', default=10)

    def api_dict(self):
        artwork = self.artwork_id
        return {
            'cf_id': self.cf_image_id,
            'url': artwork._build_cf_url(self.cf_image_id),
            'url_thumb': artwork._build_cf_url(self.cf_image_id, 'thumb'),
            'url_medium': artwork._build_cf_url(self.cf_image_id, 'medium'),
            'url_large': artwork._build_cf_url(self.cf_image_id, 'large'),
            'is_primary': self.is_primary,
            'alt_text': self.alt_text or '',
            'sequence': self.sequence,
        }