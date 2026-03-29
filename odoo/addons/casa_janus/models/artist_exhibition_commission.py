# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import datetime

# ── Artista ───────────────────────────────────────────────────────────────────

ARTIST_ROLES = [
    ('main',        'Artista principal'),
    ('guest',       'Artista invitado'),
    ('collaborator','Colaborador'),
]

class CasaJanusArtist(models.Model):
    _name        = 'casa_janus.artist'
    _description = 'Artista'
    _order       = 'is_main_artist desc, name'
    _inherit     = ['casa_janus.cloudflare.mixin']

    name = fields.Char(string='Nombre artístico / completo', required=True)
    slug = fields.Char(string='Slug URL', help='Para la ruta /artista/[slug]. Solo para el artista principal.')
    role = fields.Selection(selection=ARTIST_ROLES, string='Rol', default='guest', required=True)
    is_main_artist = fields.Boolean(
        string='Artista principal',
        default=False,
        help='Solo puede haber un artista principal en el sistema. (Dueño de la galería).',
    )
    photo_cf_image_id = fields.Char(string='Cloudflare Image ID (foto)')
    artist_statement = fields.Text(string='Statement artístico')
    biography = fields.Html(string='Biografía', sanitize=True)
    nationality = fields.Char(string='Nacionalidad')
    birth_year  = fields.Integer(string='Año de nacimiento')
    website     = fields.Char(string='Sitio web personal')
    instagram   = fields.Char(string='Instagram (@handle)')
    email       = fields.Char(string='Email de contacto')

    cv_item_ids = fields.One2many('casa_janus.artist.cv_item', 'artist_id', string='Trayectoria / CV')
    
    # NUEVO: Relación con las obras creadas por este artista
    artwork_ids = fields.One2many('casa_janus.artwork', 'artist_id', string='Obras')

    exhibition_ids = fields.Many2many(
        comodel_name='casa_janus.exhibition',
        relation='casa_janus_exhibition_artist_rel',
        column1='artist_id',
        column2='exhibition_id',
        string='Exposiciones',
        readonly=True,
    )
    exhibition_count = fields.Integer(string='Exposiciones', compute='_compute_exhibition_count')

    @api.depends('exhibition_ids')
    def _compute_exhibition_count(self):
        for rec in self:
            rec.exhibition_count = len(rec.exhibition_ids)

    @api.constrains('is_main_artist')
    def _check_single_main_artist(self):
        """Garantiza que solo haya un artista principal."""
        for rec in self:
            if rec.is_main_artist:
                others = self.search([('is_main_artist', '=', True), ('id', '!=', rec.id)])
                if others:
                    raise ValidationError(
                        f'Ya existe un artista principal: "{others[0].name}". '
                        'Desmarca ese registro antes de asignar otro.'
                    )

    def api_dict(self):
        return {
            'id':               self.id,
            'name':             self.name,
            'slug':             self.slug or '',
            'role':             self.role,
            'is_main_artist':   self.is_main_artist,
            'nationality':      self.nationality or '',
            'birth_year':       self.birth_year,
            'website':          self.website or '',
            'instagram':        self.instagram or '',
            'artist_statement': self.artist_statement or '',
            'biography':        self.biography or '',
            'photo_url':        self._build_cf_url(self.photo_cf_image_id, 'medium'),
            'photo_cf_id':      self.photo_cf_image_id or '',
            'cv_items':         [item.api_dict() for item in self.cv_item_ids],
            'exhibition_count': self.exhibition_count,
            'artwork_ids':      self.artwork_ids.ids,
        }

# ── CV Item ───────────────────────────────────────────────────────────────────
CV_CATEGORIES = [
    ('exhibition', 'Exposición'),
    ('award',      'Premio / Reconocimiento'),
    ('residency',  'Residencia artística'),
    ('education',  'Formación'),
    ('publication','Publicación'),
    ('other',      'Otro'),
]

class CasaJanusArtistCVItem(models.Model):
    _name        = 'casa_janus.artist.cv_item'
    _description = 'Línea de CV del artista'
    _order       = 'year desc, sequence'

    artist_id   = fields.Many2one('casa_janus.artist', required=True, ondelete='cascade', index=True)
    year        = fields.Integer(string='Año', required=True)
    category    = fields.Selection(CV_CATEGORIES, string='Categoría', default='exhibition')
    description = fields.Char(string='Descripción', required=True)
    location    = fields.Char(string='Lugar / Ciudad')
    sequence    = fields.Integer(default=10)

    def api_dict(self):
        return {
            'year':        self.year,
            'category':    self.category,
            'description': self.description,
            'location':    self.location or '',
        }

# ── Print Product ─────────────────────────────────────────────────────────────
class CasaJanusPrintProduct(models.Model):
    _name        = 'casa_janus.print_product'
    _description = 'Reproducción / Print de una obra'
    _order       = 'sequence'

    artwork_id    = fields.Many2one('casa_janus.artwork', required=True, ondelete='cascade', index=True)
    size_label    = fields.Char(string='Tamaño')
    paper_type    = fields.Char(string='Papel / Material')
    price         = fields.Float(string='Precio', digits=(10, 2))
    currency_id   = fields.Many2one('res.currency', default=lambda s: s.env.ref('base.USD').id)
    stock_qty     = fields.Integer(string='Stock', default=0)
    product_tmpl_id = fields.Many2one('product.template', string='Producto Odoo', ondelete='set null')
    sequence      = fields.Integer(default=10)

    def api_dict(self):
        return {
            'id':         self.id,
            'size_label': self.size_label or '',
            'paper_label': self.paper_type or '',
            'price':      self.price,
            'currency':   self.currency_id.name if self.currency_id else 'USD',
            'in_stock':   self.stock_qty > 0,
            'stock_qty':  self.stock_qty,
            'product_id': self.product_tmpl_id.id if self.product_tmpl_id else None,
        }

# ── Exposición ────────────────────────────────────────────────────────────────
class CasaJanusExhibition(models.Model):
    _name        = 'casa_janus.exhibition'
    _description = 'Exposición'
    _order       = 'date_start desc'
    _inherit     = ['mail.thread', 'casa_janus.cloudflare.mixin']

    name = fields.Char(string='Título', required=True, tracking=True)
    slug = fields.Char(string='Slug URL', index=True)

    main_artist_id = fields.Many2one(
        comodel_name='casa_janus.artist',
        string='Artista principal',
        domain=[('role', '=', 'main')],
        default=lambda self: self._default_main_artist(),
    )
    guest_artist_ids = fields.Many2many(
        comodel_name='casa_janus.artist',
        relation='casa_janus_exhibition_artist_rel',
        column1='exhibition_id',
        column2='artist_id',
        string='Artistas invitados',
        domain=[('role', 'in', ('guest', 'collaborator'))],
    )
    exhibition_artist_ids = fields.One2many(
        comodel_name='casa_janus.exhibition.artist',
        inverse_name='exhibition_id',
        string='Artistas con roles específicos',
    )

    date_start = fields.Date(string='Fecha de inicio', tracking=True)
    date_end   = fields.Date(string='Fecha de fin',   tracking=True)
    location   = fields.Char(string='Lugar / Galería')
    city       = fields.Char(string='Ciudad')

    state = fields.Selection(
        selection=[('upcoming', 'Próxima'), ('active', 'En curso'), ('past', 'Pasada')],
        string='Estado',
        compute='_compute_state',
    )

    description     = fields.Html(string='Descripción', sanitize=True)
    cover_cf_image_id = fields.Char(string='Cloudflare Image ID (portada)')
    active          = fields.Boolean(default=True)
    artwork_ids     = fields.Many2many('casa_janus.artwork', string='Obras en exposición')
    website_event_id = fields.Many2one('event.event', string='Evento del sitio web', ondelete='set null')

    @api.model
    def _default_main_artist(self):
        return self.env['casa_janus.artist'].search([('is_main_artist', '=', True)], limit=1)

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

    def api_dict(self):
        guest_artists = []
        for ea in self.exhibition_artist_ids:
            guest_artists.append({
                'id':        ea.artist_id.id,
                'name':      ea.artist_id.name,
                'role_label': ea.role_label,
                'instagram': ea.artist_id.instagram or '',
                'photo_url': ea.artist_id._build_cf_url(ea.artist_id.photo_cf_image_id, 'thumb'),
            })

        return {
            'id':          self.id,
            'name':        self.name,
            'slug':        self.slug or '',
            'state':       self.state,
            'date_start':  str(self.date_start) if self.date_start else None,
            'date_end':    str(self.date_end)   if self.date_end   else None,
            'location':    self.location or '',
            'city':        self.city or '',
            'description': self.description or '',
            'cover_image': self._build_cf_url(self.cover_cf_image_id, 'large'),
            'main_artist': {
                'id':   self.main_artist_id.id,
                'name': self.main_artist_id.name,
            } if self.main_artist_id else None,
            'guest_artists': guest_artists,
            'artwork_count': len(self.artwork_ids),
        }

# ── Artista por Exposición ────────────────────────────────────────────────────
EXHIBITION_ARTIST_ROLES = [
    ('featured',   'Artista destacado'),
    ('guest',      'Artista invitado'),
    ('collaborator','Colaborador'),
    ('curator',    'Curador'),
]

class CasaJanusExhibitionArtist(models.Model):
    _name        = 'casa_janus.exhibition.artist'
    _description = 'Artista por Exposición'
    _order       = 'sequence'

    exhibition_id = fields.Many2one('casa_janus.exhibition', string='Exposición', required=True, ondelete='cascade', index=True)
    artist_id = fields.Many2one('casa_janus.artist', string='Artista', required=True, domain=[('role', 'in', ('guest', 'collaborator'))], ondelete='cascade')
    role_label = fields.Selection(selection=EXHIBITION_ARTIST_ROLES, string='Rol en esta exposición', default='guest', required=True)
    bio_override = fields.Text(string='Bio específica para esta exposición')
    sequence = fields.Integer(default=10)

    _sql_constraints = [('artist_exhibition_unique', 'UNIQUE(exhibition_id, artist_id)', 'El artista ya está registrado en esta exposición.')]

# ── Encargo personalizado ─────────────────────────────────────────────────────
COMMISSION_STATES = [
    ('new',     'Nuevo'),
    ('review',  'En revisión'),
    ('quoted',  'Presupuestado'),
    ('accept',  'Aceptado'),
    ('decline', 'Rechazado'),
]
BUDGET_RANGES = [
    ('lt500',    'Menos de $500'),
    ('500_1500', '$500 – $1,500'),
    ('1500_5k',  '$1,500 – $5,000'),
    ('5k_15k',   '$5,000 – $15,000'),
    ('gt15k',    'Más de $15,000'),
]

class CasaJanusCommission(models.Model):
    _name        = 'casa_janus.commission'
    _description = 'Encargo personalizado'
    _order       = 'create_date desc'
    _inherit     = ['mail.thread', 'mail.activity.mixin']

    partner_name = fields.Char(string='Nombre del cliente', required=True, tracking=True)
    email        = fields.Char(string='Email', required=True)
    phone        = fields.Char(string='Teléfono')
    description  = fields.Text(string='Descripción del encargo', required=True)
    budget_range = fields.Selection(BUDGET_RANGES, string='Presupuesto estimado')
    technique_id = fields.Many2one('casa_janus.technique', string='Técnica preferida', ondelete='set null')
    ref_artwork_id = fields.Many2one('casa_janus.artwork', string='Obra de referencia', ondelete='set null')
    selected_artwork_ids = fields.Many2many('casa_janus.artwork', string='Obras de interés')
    state = fields.Selection(COMMISSION_STATES, string='Estado', default='new', tracking=True)
    notes = fields.Text(string='Notas internas')
    crm_lead_id = fields.Many2one('crm.lead', string='Oportunidad CRM', ondelete='set null')

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec in records:
            rec._create_crm_lead()
        return records

    def _create_crm_lead(self):
        if not self.env['ir.model'].sudo().search([('model', '=', 'crm.lead')], limit=1):
            return

        artworks_text = ''
        if self.selected_artwork_ids:
            artworks_text = '\n\nObras de interés:\n' + '\n'.join(f'- {a.name} ({a.year})' for a in self.selected_artwork_ids)

        lead = self.env['crm.lead'].sudo().create({
            'name':         f'Encargo web: {self.partner_name}',
            'contact_name': self.partner_name,
            'email_from':   self.email,
            'phone':        self.phone or False,
            'description':  (self.description or '') + artworks_text,
            'type':         'lead',
        })
        self.crm_lead_id = lead.id