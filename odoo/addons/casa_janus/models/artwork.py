# -*- coding: utf-8 -*-
# TODO: copiar el contenido desde el chat de Claude
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

BUDGET_RANGES = [
    ('lt500',    'Menos de $500'),
    ('500_1500', '$500 – $1,500'),
    ('1500_5k',  '$1,500 – $5,000'),
    ('5k_15k',   '$5,000 – $15,000'),
    ('gt15k',    'Más de $15,000'),
]


class CasaJanusArtwork(models.Model):
    """
    Obra de arte individual.
    Pertenece a una colección (que a su vez pertenece a una técnica).
    Puede tener múltiples imágenes en Cloudflare Images.
    Puede tener prints/reproducciones asociados.
    """
    _name = 'casa_janus.artwork'
    _description = 'Obra de Arte'
    _order = 'year desc, sequence, name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # ── Identificación ──────────────────────────────────────────────────────
    name = fields.Char(
        string='Título',
        required=True,
        tracking=True,
    )
    slug = fields.Char(
        string='Slug URL',
        required=True,
        index=True,
        help='Identificador único para la URL. Ej: vigilia-en-calma-2022',
    )
    year = fields.Integer(
        string='Año',
        required=True,
    )
    sequence = fields.Integer(string='Orden en colección', default=10)
    active = fields.Boolean(string='Activa', default=True)
    is_featured = fields.Boolean(
        string='Destacada',
        default=False,
        help='Aparece en portada y secciones destacadas del sitio.',
    )

    # ── Clasificación ───────────────────────────────────────────────────────
    collection_id = fields.Many2one(
        comodel_name='casa_janus.collection',
        string='Colección',
        required=True,
        ondelete='restrict',
        index=True,
        tracking=True,
    )
    technique_id = fields.Many2one(
        comodel_name='casa_janus.technique',
        string='Técnica',
        related='collection_id.technique_id',
        store=True,
        readonly=True,
        index=True,
    )
    technique_name = fields.Char(
        related='technique_id.name',
        store=True,
    )

    # ── Datos técnicos ───────────────────────────────────────────────────────
    width_cm = fields.Float(string='Ancho (cm)', digits=(6, 1))
    height_cm = fields.Float(string='Alto (cm)', digits=(6, 1))
    depth_cm = fields.Float(
        string='Profundidad (cm)',
        digits=(6, 1),
        help='Relevante para esculturas u obras tridimensionales.',
    )
    medium = fields.Char(
        string='Técnica / Soporte',
        help='Ej: "Óleo sobre lino", "Acuarela sobre papel de algodón 300g"',
    )
    description = fields.Text(
        string='Descripción',
        help='Texto que aparece en el modal de la galería y la ficha de obra.',
    )

    # Grabado / edición limitada
    edition_number = fields.Integer(
        string='Número de ejemplar',
        help='Ej: 3 (de una edición 3/12)',
    )
    edition_total = fields.Integer(
        string='Tiraje total',
        help='Ej: 12',
    )
    edition_display = fields.Char(
        string='Edición',
        compute='_compute_edition_display',
        store=True,
    )

    # ── Comercial ────────────────────────────────────────────────────────────
    price = fields.Float(
        string='Precio',
        digits=(10, 2),
        tracking=True,
    )
    currency_id = fields.Many2one(
        comodel_name='res.currency',
        string='Moneda',
        default=lambda self: self.env.ref('base.USD').id,
    )
    availability = fields.Selection(
        selection=AVAILABILITY,
        string='Disponibilidad',
        default='available',
        required=True,
        tracking=True,
    )
    # Vínculo con product.template de Odoo para integrar con e-commerce
    product_tmpl_id = fields.Many2one(
        comodel_name='product.template',
        string='Producto Odoo',
        help='Producto e-commerce vinculado para procesar compras.',
        ondelete='set null',
    )

    # ── Imágenes (Cloudflare Images) ─────────────────────────────────────────
    primary_cf_image_id = fields.Char(
        string='ID imagen principal (Cloudflare)',
        help='Cloudflare Images ID de la imagen primaria de la obra.',
    )
    image_ids = fields.One2many(
        comodel_name='casa_janus.artwork.image',
        inverse_name='artwork_id',
        string='Galería de imágenes',
    )

    # ── Metadatos SEO ────────────────────────────────────────────────────────
    meta_title = fields.Char(string='Meta título (SEO)')
    meta_description = fields.Char(string='Meta descripción (SEO)')

    # ── Relaciones inversas ──────────────────────────────────────────────────
    print_product_ids = fields.One2many(
        comodel_name='casa_janus.print_product',
        inverse_name='artwork_id',
        string='Prints / Reproducciones',
    )

    _sql_constraints = [
        ('slug_unique', 'UNIQUE(slug)', 'El slug de obra debe ser único.'),
    ]

    @api.depends('edition_number', 'edition_total')
    def _compute_edition_display(self):
        for rec in self:
            if rec.edition_number and rec.edition_total:
                rec.edition_display = f'{rec.edition_number}/{rec.edition_total}'
            else:
                rec.edition_display = ''

    @api.constrains('slug')
    def _check_slug(self):
        pattern = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
        for rec in self:
            if not pattern.match(rec.slug):
                raise ValidationError(
                    f'El slug "{rec.slug}" no es válido. '
                    'Usa solo letras minúsculas, números y guiones.'
                )

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id:
            return None
        base = self.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.cloudflare_images_base_url', ''
        )
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None

    def api_dict(self, detail=False):
        """
        Serialización completa para la API headless.
        Si detail=True incluye imágenes adicionales y prints.
        """
        primary_url = self._build_cf_url(self.primary_cf_image_id)

        result = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'year': self.year,
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
                # URLs de variantes para srcset dinámico con Cloudflare Images
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
            result['prints'] = [p.api_dict() for p in self.print_product_ids.filtered(
                lambda p: p.stock_qty > 0
            )]

        return result

    def _dimensions_dict(self):
        parts = []
        if self.height_cm:
            parts.append(f'{self.height_cm:.0f}')
        if self.width_cm:
            parts.append(f'{self.width_cm:.0f}')
        if self.depth_cm:
            parts.append(f'{self.depth_cm:.0f}')
        label = ' × '.join(parts) + ' cm' if parts else ''
        return {
            'width_cm': self.width_cm,
            'height_cm': self.height_cm,
            'depth_cm': self.depth_cm or None,
            'label': label,
            # Ratio útil para calcular la altura en el mural masonry de Next.js
            'aspect_ratio': round(self.height_cm / self.width_cm, 4) if self.width_cm else 1.0,
        }


class CasaJanusArtworkImage(models.Model):
    """
    Imagen adicional de una obra (detalle, reverso, proceso, instalación...).
    Todas las imágenes viven en Cloudflare Images.
    """
    _name = 'casa_janus.artwork.image'
    _description = 'Imagen de Obra'
    _order = 'is_primary desc, sequence'

    artwork_id = fields.Many2one(
        comodel_name='casa_janus.artwork',
        string='Obra',
        required=True,
        ondelete='cascade',
        index=True,
    )
    cf_image_id = fields.Char(
        string='Cloudflare Image ID',
        required=True,
    )
    is_primary = fields.Boolean(string='Imagen principal', default=False)
    alt_text = fields.Char(
        string='Texto alternativo',
        help='Descripción para accesibilidad y SEO.',
    )
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