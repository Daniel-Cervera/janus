# -*- coding: utf-8 -*-
# TODO: copiar el contenido desde el chat de Claude
# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import re


class CasaJanusCollection(models.Model):
    """
    Colección dentro de una técnica.
    Una colección agrupa obras temáticamente relacionadas.
    Ej: "Sombras Mediterráneas" (Óleo), "Botánica Imaginaria" (Acuarela).
    """
    _name = 'casa_janus.collection'
    _description = 'Colección'
    _order = 'sequence, name'

    name = fields.Char(
        string='Nombre',
        required=True,
    )
    slug = fields.Char(
        string='Slug URL',
        required=True,
        index=True,
    )
    technique_id = fields.Many2one(
        comodel_name='casa_janus.technique',
        string='Técnica',
        required=True,
        ondelete='restrict',
        index=True,
    )
    technique_name = fields.Char(
        related='technique_id.name',
        string='Técnica (nombre)',
        store=True,
    )
    description = fields.Text(
        string='Descripción',
    )
    # Imagen de portada almacenada en Cloudflare Images
    cover_cf_image_id = fields.Char(
        string='Cloudflare Image ID (portada)',
        help='ID de la imagen en Cloudflare Images. '
             'La URL se construye como: https://imagedelivery.net/<HASH>/<cf_image_id>/public',
    )
    year_start = fields.Integer(string='Año inicio')
    year_end = fields.Integer(string='Año fin')
    sequence = fields.Integer(string='Orden', default=10)
    active = fields.Boolean(string='Activa', default=True)

    artwork_ids = fields.One2many(
        comodel_name='casa_janus.artwork',
        inverse_name='collection_id',
        string='Obras',
    )
    artwork_count = fields.Integer(
        string='Núm. obras',
        compute='_compute_artwork_count',
        store=True,
    )

    _sql_constraints = [
        ('slug_technique_unique', 'UNIQUE(slug, technique_id)',
         'El slug debe ser único dentro de cada técnica.'),
    ]

    @api.depends('artwork_ids')
    def _compute_artwork_count(self):
        for rec in self:
            rec.artwork_count = len(rec.artwork_ids.filtered('active'))

    @api.constrains('slug')
    def _check_slug(self):
        pattern = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
        for rec in self:
            if not pattern.match(rec.slug):
                raise ValidationError(
                    f'El slug "{rec.slug}" no es válido.'
                )

    @api.constrains('year_start', 'year_end')
    def _check_years(self):
        for rec in self:
            if rec.year_start and rec.year_end:
                if rec.year_end < rec.year_start:
                    raise ValidationError('El año de fin no puede ser anterior al de inicio.')

    def api_dict(self, include_artworks=False):
        """Serialización para la API headless."""
        result = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'technique': {
                'id': self.technique_id.id,
                'name': self.technique_id.name,
                'slug': self.technique_id.slug,
            },
            'description': self.description or '',
            'cover_image': self._build_cf_url(self.cover_cf_image_id),
            'cover_cf_id': self.cover_cf_image_id or '',
            'year_start': self.year_start,
            'year_end': self.year_end,
            'artwork_count': self.artwork_count,
            'sequence': self.sequence,
        }
        if include_artworks:
            result['artworks'] = [a.api_dict() for a in self.artwork_ids.filtered('active')]
        return result

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id:
            return None
        base = self.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.cloudflare_images_base_url', ''
        )
        if not base:
            return None
        return f'{base.rstrip("/")}/{cf_id}/{variant}'