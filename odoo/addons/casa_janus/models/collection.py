# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class CasaJanusCollection(models.Model):
    _name = 'casa_janus.collection'
    _description = 'Colección'
    _order = 'sequence, name'

    name = fields.Char(string='Nombre', required=True)
    slug = fields.Char(string='Slug URL', required=True, index=True)
    technique_id = fields.Many2one('casa_janus.technique', string='Técnica', required=True, ondelete='restrict', index=True)
    technique_name = fields.Char(related='technique_id.name', string='Técnica (nombre)', store=True)
    description = fields.Text(string='Descripción')
    cover_cf_image_id = fields.Char(string='Cloudflare Image ID (portada)')
    
    year_start = fields.Integer(string='Año de inicio')
    year_end = fields.Integer(string='Año de fin')
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    artwork_ids = fields.One2many('casa_janus.artwork', 'collection_id', string='Obras')
    artwork_count = fields.Integer(string='Núm. obras', compute='_compute_artwork_count')

    @api.depends('artwork_ids')
    def _compute_artwork_count(self):
        for rec in self:
            rec.artwork_count = len(rec.artwork_ids.filtered('active'))

    @api.constrains('year_start', 'year_end')
    def _check_years(self):
        for rec in self:
            if rec.year_start and rec.year_end:
                if rec.year_end < rec.year_start:
                    raise ValidationError('El año de fin no puede ser anterior al de inicio.')

    def _build_cf_url(self, cf_id, variant='public'):
        if not cf_id: return None
        base = self.env['ir.config_parameter'].sudo().get_param('casa_janus.cloudflare_images_base_url', '')
        return f'{base.rstrip("/")}/{cf_id}/{variant}' if base else None

    def api_dict(self, include_artworks=False):
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