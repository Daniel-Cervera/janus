# -*- coding: utf-8 -*-
{
    'name': 'Casa Janus — Galería de Arte',
    'version': '17.0.1.0.0',
    'summary': 'Módulo headless para la galería de arte Casa Janus',
    'author': 'Casa Janus',
    'category': 'Website/eCommerce',
    'license': 'LGPL-3',
    'depends': ['base', 'mail', 'website', 'website_sale', 'portal', 'event', 'crm'],
    'data': [
        'security/ir.model.access.csv',
        'views/technique_views.xml', # <-- Action is defined here / La acción se define aquí
        'views/collection_views.xml',
        'views/artwork_views.xml',
        'views/artist_exhibition_commission_views.xml',
        'views/menu_views.xml',      # <-- Menus MUST be loaded last / Los menús DEBEN cargarse al final
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}