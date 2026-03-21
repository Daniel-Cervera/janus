# -*- coding: utf-8 -*-
"""
API REST pública de Casa Janus.
Prefijo: /api/v1/

Todos los endpoints devuelven JSON.
Autenticación: token Bearer en header Authorization
"""
import json
import logging
import functools

from odoo import http
from odoo.http import request, Response

_logger = logging.getLogger(__name__)

API_PREFIX = '/api/v1'


def require_api_token(func):
    """Decorador: valida el Bearer token en todos los endpoints."""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        # Permitir peticiones OPTIONS (CORS preflight) pasar sin token
        if request.httprequest.method == 'OPTIONS':
            return func(self, *args, **kwargs)

        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return _json_error('Unauthorized', 401)
        token = auth_header[7:]
        expected = request.env['ir.config_parameter'].sudo().get_param(
            'casa_janus.api_token', ''
        )
        if not expected or token != expected:
            return _json_error('Forbidden', 403)
        return func(self, *args, **kwargs)
    return wrapper


def _json_response(data, status=200):
    return Response(
        json.dumps(data, ensure_ascii=False, default=str),
        status=status,
        mimetype='application/json',
        headers={
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300',  # 5 min cache en Cloudflare
        },
    )


def _json_error(message, status=400):
    return Response(
        json.dumps({'error': message}),
        status=status,
        mimetype='application/json',
        headers={'Access-Control-Allow-Origin': '*'},
    )


class CasaJanusAPI(http.Controller):

    # ── /api/v1/techniques ──────────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/techniques', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def list_techniques(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
        
        with_collections = kwargs.get('with_collections', '').lower() == 'true'
        techniques = request.env['casa_janus.technique'].sudo().search(
            [('active', '=', True)],
            order='sequence, name',
        )
        data = []
        for t in techniques:
            t_dict = t.api_dict()
            if with_collections:
                t_dict['collections'] = [
                    c.api_dict() for c in t.collection_ids.filtered('active')
                ]
            data.append(t_dict)

        return _json_response({'data': data, 'total': len(data)})

    # ── /api/v1/collections ─────────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/collections', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def list_collections(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        domain = [('active', '=', True)]

        if kwargs.get('technique_id'):
            try:
                domain.append(('technique_id', '=', int(kwargs['technique_id'])))
            except ValueError:
                pass
        elif kwargs.get('technique_slug'):
            tech = request.env['casa_janus.technique'].sudo().search(
                [('slug', '=', kwargs['technique_slug']), ('active', '=', True)], limit=1
            )
            if not tech:
                return _json_error('Technique not found', 404)
            domain.append(('technique_id', '=', tech.id))

        with_artworks = kwargs.get('with_artworks', '').lower() == 'true'
        collections = request.env['casa_janus.collection'].sudo().search(
            domain, order='sequence, name'
        )
        data = [c.api_dict(include_artworks=with_artworks) for c in collections]
        return _json_response({'data': data, 'total': len(data)})

    # ── /api/v1/artworks ────────────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/artworks', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def list_artworks(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        domain = [('active', '=', True)]

        if kwargs.get('technique_id'):
            try:
                domain.append(('technique_id', '=', int(kwargs['technique_id'])))
            except ValueError:
                pass
        elif kwargs.get('technique_slug'):
            tech = request.env['casa_janus.technique'].sudo().search(
                [('slug', '=', kwargs['technique_slug']), ('active', '=', True)], limit=1
            )
            if not tech:
                return _json_error('Technique not found', 404)
            domain.append(('technique_id', '=', tech.id))

        if kwargs.get('collection_id'):
            try:
                domain.append(('collection_id', '=', int(kwargs['collection_id'])))
            except ValueError:
                pass
        elif kwargs.get('collection_slug'):
            col = request.env['casa_janus.collection'].sudo().search(
                [('slug', '=', kwargs['collection_slug']), ('active', '=', True)], limit=1
            )
            if not col:
                return _json_error('Collection not found', 404)
            domain.append(('collection_id', '=', col.id))

        if kwargs.get('availability'):
            domain.append(('availability', '=', kwargs['availability']))
        if kwargs.get('featured', '').lower() == 'true':
            domain.append(('is_featured', '=', True))

        order_map = {
            'year_desc':  'year desc, sequence',
            'year_asc':   'year asc, sequence',
            'name_asc':   'name asc',
            'sequence':   'sequence, year desc',
        }
        order = order_map.get(kwargs.get('order', 'year_desc'), 'year desc, sequence')

        # Manejo seguro de paginación para evitar ValueError
        try:
            per_page_str = kwargs.get('per_page')
            per_page = min(int(per_page_str), 100) if per_page_str and per_page_str not in ('undefined', 'null') else 24
            
            page_str = kwargs.get('page')
            page = max(int(page_str), 1) if page_str and page_str not in ('undefined', 'null') else 1
        except ValueError:
            per_page = 24
            page = 1
            
        offset = (page - 1) * per_page

        Artwork = request.env['casa_janus.artwork'].sudo()
        total = Artwork.search_count(domain)
        artworks = Artwork.search(domain, order=order, limit=per_page, offset=offset)

        return _json_response({
            'data': [a.api_dict() for a in artworks],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': -(-total // per_page),
        })

    # ── /api/v1/artwork/<slug> ───────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/artwork/<string:slug>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def get_artwork(self, slug, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        artwork = request.env['casa_janus.artwork'].sudo().search(
            [('slug', '=', slug), ('active', '=', True)], limit=1
        )
        if not artwork:
            return _json_error('Artwork not found', 404)
        return _json_response({'data': artwork.api_dict(detail=True)})

    # ── /api/v1/artist ───────────────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/artist', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def get_artist(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        artist = request.env['casa_janus.artist'].sudo().search([], limit=1)
        if not artist:
            return _json_error('Artist profile not configured', 404)
        return _json_response({'data': artist.api_dict()})

    # ── /api/v1/exhibitions ─────────────────────────────────────────────────

    @http.route(f'{API_PREFIX}/exhibitions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def list_exhibitions(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        domain = [('active', '=', True)]
        state = kwargs.get('state', 'all')
        if state != 'all':
            domain.append(('state', '=', state))

        try:
            limit = min(int(kwargs.get('limit', 20)), 50)
        except ValueError:
            limit = 20
            
        exhibitions = request.env['casa_janus.exhibition'].sudo().search(
            domain, order='date_start desc', limit=limit
        )
        data = [e.api_dict() for e in exhibitions]
        return _json_response({'data': data, 'total': len(data)})

    @http.route(f'{API_PREFIX}/exhibition/<string:slug>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_api_token
    def get_exhibition(self, slug, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization'})
            
        exhibition = request.env['casa_janus.exhibition'].sudo().search(
            [('slug', '=', slug), ('active', '=', True)], limit=1
        )
        if not exhibition:
            return _json_error('Exhibition not found', 404)
        return _json_response({'data': exhibition.api_dict(include_artworks=True)})

    # ── /api/v1/commission  (POST) ──────────────────────────────────────────

    @http.route(f'{API_PREFIX}/commission', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def submit_commission(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return Response(
                status=200,
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            )

        try:
            body = request.httprequest.get_data(as_text=True)
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            return _json_error('Invalid JSON body', 400)

        errors = {}
        for field in ('partner_name', 'email', 'description'):
            if not data.get(field, '').strip():
                errors[field] = 'Este campo es requerido.'
        if errors:
            return _json_error({'validation': errors}, 422)

        vals = {
            'partner_name': data['partner_name'].strip(),
            'email':        data['email'].strip().lower(),
            'phone':        data.get('phone', '').strip() or False,
            'description':  data['description'].strip(),
            'budget_range': data.get('budget_range') or False,
            'state':        'new',
        }

        if data.get('technique_id'):
            try:
                vals['technique_id'] = int(data['technique_id'])
            except ValueError:
                pass
        if data.get('ref_artwork_id'):
            try:
                vals['ref_artwork_id'] = int(data['ref_artwork_id'])
            except ValueError:
                pass

        commission = request.env['casa_janus.commission'].sudo().create(vals)
        _logger.info('New commission request #%s from %s', commission.id, vals['email'])

        return _json_response({
            'success': True,
            'message': 'Tu solicitud ha sido recibida. Te contactaremos pronto.',
            'id': commission.id,
        }, status=201)