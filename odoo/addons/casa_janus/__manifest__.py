# -*- coding: utf-8 -*-
{
    'name': 'Casa Janus — Galería de Arte',
    'version': '17.0.1.0.0',
    'summary': 'Módulo headless para la galería de arte Casa Janus',
    'author': 'Casa Janus',
    'category': 'Website/eCommerce',
    'license': 'LGPL-3',
    'depends': ['base', 'mail', 'sale', 'crm', 'event'],
    'data': [
        'security/groups.xml',
        'security/ir.model.access.csv',
        'data/cron.xml',
        'views/technique_views.xml',
        'views/collection_views.xml',
        'views/artwork_views.xml',
        'views/artist_exhibition_commission_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}