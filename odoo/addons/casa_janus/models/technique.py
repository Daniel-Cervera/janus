# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import re

class CasaJanusTechnique(models.Model):
    _name = 'casa_janus.technique'
    _description = 'Técnica Artística'
    _order = 'sequence, name'

    name = fields.Char(string='Nombre', required=True, translate=False)
    slug = fields.Char(string='Slug URL', required=True, index=True)
    description = fields.Text(string='Descripción')
    sequence = fields.Integer(string='Orden', default=10)
    active = fields.Boolean(string='Activa', default=True)

    collection_ids = fields.One2many('casa_janus.collection', 'technique_id', string='Colecciones')
    collection_count = fields.Integer(string='Núm. colecciones', compute='_compute_collection_count', store=True)
    artwork_count = fields.Integer(string='Núm. obras', compute='_compute_artwork_count')

    _sql_constraints = [
        ('slug_unique', 'UNIQUE(slug)', 'El slug debe ser único entre técnicas.'),
        ('name_unique', 'UNIQUE(name)', 'El nombre de técnica debe ser único.'),
    ]

    @api.depends('collection_ids')
    def _compute_collection_count(self):
        for rec in self:
            rec.collection_count = len(rec.collection_ids)

    @api.depends('collection_ids.artwork_ids')
    def _compute_artwork_count(self):
        artwork_data = self.env['casa_janus.artwork'].read_group(
            [('technique_id', 'in', self.ids), ('active', '=', True)],
            ['technique_id'],
            ['technique_id'],
        )
        counts = {r['technique_id'][0]: r['technique_id_count'] for r in artwork_data}
        for rec in self:
            rec.artwork_count = counts.get(rec.id, 0)

    @api.constrains('slug')
    def _check_slug(self):
        pattern = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
        for rec in self:
            if not pattern.match(rec.slug):
                raise ValidationError('El slug no es válido. Usa solo letras minúsculas, números y guiones.')

    def api_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description or '',
            'collection_count': self.collection_count,
            'artwork_count': self.artwork_count,
            'sequence': self.sequence,
        }