# -*- coding: utf-8 -*-
# TODO: copiar el contenido desde el chat de Claude
# -*- coding: utf-8 -*-
from odoo import models, fields, api


class CasaJanusArtist(models.Model):
    """
    Perfil del artista. Solo existe un registro (singleton).
    Gestionable desde el panel de Odoo.
    """
    _name = 'casa_janus.artist'
    _description = 'Artista'

    name = fields.Char(string='Nombre completo', required=True)
    biography = fields.Html(
        string='Biografía',
        help='Texto enriquecido. Se renderiza en la página /artista.',
    )
    artist_statement = fields.Text(
        string='Statement del artista',
        help='Declaración artística breve. Aparece destacada en la página del artista.',
    )
    photo_cf_image_id = fields.Char(
        string='Cloudflare Image ID (foto)',
    )
    # CV / Highlights
    cv_item_ids = fields.One2many(
        comodel_name='casa_janus.artist.cv_item',
        inverse_name='artist_id',
        string='Hitos del CV',
    )

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id:
            return None
        base = self.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.cloudflare_images_base_url', ''
        )
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None

    def api_dict(self):
        return {
            'name': self.name,
            'biography': self.biography or '',
            'artist_statement': self.artist_statement or '',
            'photo': {
                'cf_id': self.photo_cf_image_id or '',
                'url': self._build_cf_url(self.photo_cf_image_id),
                'url_medium': self._build_cf_url(self.photo_cf_image_id, 'medium'),
            },
            'cv': [item.api_dict() for item in self.cv_item_ids],
        }


class CasaJanusArtistCVItem(models.Model):
    """Línea del CV del artista (exposición, premio, residencia, publicación...)."""
    _name = 'casa_janus.artist.cv_item'
    _description = 'Ítem CV Artista'
    _order = 'year desc, sequence'

    artist_id = fields.Many2one('casa_janus.artist', ondelete='cascade')
    year = fields.Integer(string='Año', required=True)
    category = fields.Selection([
        ('solo',        'Exposición individual'),
        ('group',       'Exposición colectiva'),
        ('award',       'Premio / Reconocimiento'),
        ('residency',   'Residencia artística'),
        ('publication', 'Publicación'),
        ('other',       'Otro'),
    ], string='Categoría', required=True)
    description = fields.Char(string='Descripción', required=True)
    location = fields.Char(string='Lugar / Institución')
    sequence = fields.Integer(default=10)

    def api_dict(self):
        return {
            'year': self.year,
            'category': self.category,
            'description': self.description,
            'location': self.location or '',
        }


class CasaJanusExhibition(models.Model):
    """
    Exposición / evento de la galería.
    Aparece en la sección Blog/Noticias del sitio.
    Puede vincular obras participantes.
    """
    _name = 'casa_janus.exhibition'
    _description = 'Exposición'
    _order = 'date_start desc'
    _inherit = ['mail.thread']

    name = fields.Char(string='Título', required=True)
    slug = fields.Char(string='Slug URL', required=True, index=True)
    date_start = fields.Date(string='Fecha de inicio', required=True)
    date_end = fields.Date(string='Fecha de fin')
    location = fields.Char(string='Lugar')
    description = fields.Html(string='Descripción')
    cover_cf_image_id = fields.Char(string='Cloudflare Image ID (portada)')
    artwork_ids = fields.Many2many(
        comodel_name='casa_janus.artwork',
        relation='casa_janus_exhibition_artwork_rel',
        column1='exhibition_id',
        column2='artwork_id',
        string='Obras en exposición',
    )
    state = fields.Selection([
        ('upcoming', 'Próximamente'),
        ('active',   'En curso'),
        ('past',     'Finalizada'),
    ], string='Estado', compute='_compute_state', store=True)
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ('slug_unique', 'UNIQUE(slug)', 'El slug de exposición debe ser único.'),
    ]

    @api.depends('date_start', 'date_end')
    def _compute_state(self):
        today = fields.Date.today()
        for rec in self:
            if not rec.date_start:
                rec.state = 'upcoming'
            elif rec.date_start > today:
                rec.state = 'upcoming'
            elif rec.date_end and rec.date_end < today:
                rec.state = 'past'
            else:
                rec.state = 'active'

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id:
            return None
        base = self.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.cloudflare_images_base_url', ''
        )
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None

    def api_dict(self, include_artworks=False):
        result = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'date_start': self.date_start.isoformat() if self.date_start else None,
            'date_end': self.date_end.isoformat() if self.date_end else None,
            'location': self.location or '',
            'description': self.description or '',
            'cover_image': self._build_cf_url(self.cover_cf_image_id),
            'state': self.state,
            'artwork_count': len(self.artwork_ids),
        }
        if include_artworks:
            result['artworks'] = [a.api_dict() for a in self.artwork_ids]
        return result


class CasaJanusPrintProduct(models.Model):
    """
    Reproducción / print de una obra.
    Vincula con product.template de Odoo para e-commerce.
    """
    _name = 'casa_janus.print_product'
    _description = 'Print / Reproducción'
    _order = 'sequence'

    artwork_id = fields.Many2one(
        comodel_name='casa_janus.artwork',
        string='Obra original',
        required=True,
        ondelete='cascade',
        index=True,
    )
    product_tmpl_id = fields.Many2one(
        comodel_name='product.template',
        string='Producto Odoo',
        ondelete='set null',
        help='Producto de e-commerce de Odoo para gestionar stock y carrito.',
    )
    size_label = fields.Char(
        string='Tamaño',
        required=True,
        help='Ej: "A4 (21×30 cm)", "50×70 cm", "70×100 cm"',
    )
    paper_type = fields.Selection([
        ('fine_art',     'Fine Art (algodón 310g)'),
        ('photo_gloss',  'Fotográfico brillo'),
        ('photo_matte',  'Fotográfico mate'),
        ('canvas',       'Lienzo (canvas)'),
    ], string='Tipo de papel/soporte', required=True)
    price = fields.Float(string='Precio', digits=(10, 2), required=True)
    stock_qty = fields.Integer(string='Stock disponible', default=0)
    sequence = fields.Integer(default=10)

    def api_dict(self):
        return {
            'id': self.id,
            'size_label': self.size_label,
            'paper_type': self.paper_type,
            'paper_label': dict(self._fields['paper_type'].selection).get(self.paper_type, ''),
            'price': self.price,
            'currency': self.artwork_id.currency_id.name if self.artwork_id.currency_id else 'USD',
            'stock_qty': self.stock_qty,
            'in_stock': self.stock_qty > 0,
            'product_id': self.product_tmpl_id.id if self.product_tmpl_id else None,
        }


class CasaJanusCommissionRequest(models.Model):
    """
    Encargo personalizado enviado desde el formulario del sitio.
    Se gestiona como un lead/solicitud desde el panel de Odoo.
    """
    _name = 'casa_janus.commission'
    _description = 'Encargo Personalizado'
    _order = 'create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    partner_name = fields.Char(string='Nombre', required=True)
    email = fields.Char(string='Email', required=True)
    phone = fields.Char(string='Teléfono')
    description = fields.Text(
        string='Descripción del encargo',
        required=True,
        help='Qué desea el cliente: tamaño, temática, uso previsto, etc.',
    )
    budget_range = fields.Selection([
        ('lt500',    'Menos de $500'),
        ('500_1500', '$500 – $1,500'),
        ('1500_5k',  '$1,500 – $5,000'),
        ('5k_15k',   '$5,000 – $15,000'),
        ('gt15k',    'Más de $15,000'),
    ], string='Presupuesto estimado')
    technique_id = fields.Many2one(
        comodel_name='casa_janus.technique',
        string='Técnica preferida',
        ondelete='set null',
    )
    ref_artwork_id = fields.Many2one(
        comodel_name='casa_janus.artwork',
        string='Obra de referencia (opcional)',
        ondelete='set null',
    )
    state = fields.Selection([
        ('new',     'Nueva solicitud'),
        ('review',  'En revisión'),
        ('quoted',  'Presupuesto enviado'),
        ('accept',  'Aceptada'),
        ('decline', 'Declinada'),
    ], string='Estado', default='new', tracking=True)
    notes = fields.Text(
        string='Notas internas',
        help='Notas privadas del artista. No visibles para el cliente.',
    )
    create_date = fields.Datetime(string='Fecha de solicitud', readonly=True)