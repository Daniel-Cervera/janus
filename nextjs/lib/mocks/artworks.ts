/**
 * lib/mocks/artworks.ts
 *
 * Datos de prueba para desarrollo sin Odoo.
 * Las imágenes usan cfIds con prefijo "test-" que cfImageUrl() resuelve
 * automáticamente a picsum.photos con seeds aleatorios.
 *
 * Activar con: NEXT_PUBLIC_USE_MOCK_DATA=true en .env.local
 */

import type { Artwork, ArtworkDetail, PrintProduct, ListResponse } from '@/lib/types'

// ── Técnicas y colecciones ficticias ─────────────────────────────────────────

const TECHNIQUES = [
  { id: 1, name: 'Óleo sobre tela', slug: 'oleo-sobre-tela' },
  { id: 2, name: 'Grabado', slug: 'grabado' },
  { id: 3, name: 'Acrílico sobre papel', slug: 'acrilico-sobre-papel' },
  { id: 4, name: 'Técnica mixta', slug: 'tecnica-mixta' },
] as const

const COLLECTIONS = [
  { id: 1, name: 'Memoria Táctil', slug: 'memoria-tactil', technique: TECHNIQUES[0], artwork_count: 6 },
  { id: 2, name: 'Geometría Orgánica', slug: 'geometria-organica', technique: TECHNIQUES[1], artwork_count: 5 },
  { id: 3, name: 'Transiciones', slug: 'transiciones', technique: TECHNIQUES[2], artwork_count: 4 },
  { id: 4, name: 'Umbral', slug: 'umbral', technique: TECHNIQUES[3], artwork_count: 3 },
] as const

// ── Prints compartidos (3 formatos por obra) ─────────────────────────────────

export const MOCK_PRINTS: PrintProduct[] = [
  {
    id: 1, size_label: '30 × 40 cm', paper_type: 'fine_art',
    paper_label: 'Fine Art Hahnemühle 310g', price: 1800, currency: 'MXN',
    stock_qty: 5, in_stock: true, product_id: 101,
  },
  {
    id: 2, size_label: '50 × 70 cm', paper_type: 'fine_art',
    paper_label: 'Fine Art Hahnemühle 310g', price: 3200, currency: 'MXN',
    stock_qty: 3, in_stock: true, product_id: 102,
  },
  {
    id: 3, size_label: '60 × 90 cm', paper_type: 'canvas',
    paper_label: 'Canvas estirado sobre bastidor', price: 5500, currency: 'MXN',
    stock_qty: 0, in_stock: false, product_id: 103,
  },
]

// ── Helper para construir primary_image ──────────────────────────────────────

function img(seed: string) {
  return {
    cf_id: `test-${seed}`,
    url: null,
    url_thumb: null,
    url_medium: null,
    url_large: null,
  }
}

// ── 18 obras mock ────────────────────────────────────────────────────────────

export const MOCK_ARTWORKS: Artwork[] = [
  // ── Colección 1: Memoria Táctil (Óleo) ─────────────────────────────────
  {
    id: 1, slug: 'obra-test-01', name: 'Estratos I',
    year: 2023, availability: 'available', availability_label: 'Disponible',
    price: 28000, currency: 'MXN', is_featured: true,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo y arena volcánica sobre lino',
    dimensions: { width_cm: 90, height_cm: 120, depth_cm: 4, label: '90 × 120 cm', aspect_ratio: 1.33 },
    description: 'Exploración de capas de pigmento sobre lino crudo. El color emerge y se retira como marea.',
    primary_image: img('abstract-forest'),
    seo: { title: 'Estratos I — Janus', description: 'Óleo sobre tela, 90 × 120 cm' },
  },
  {
    id: 2, slug: 'obra-test-02', name: 'Estratos II',
    year: 2023, availability: 'sold', availability_label: 'Vendida',
    price: 31000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo sobre tela',
    dimensions: { width_cm: 100, height_cm: 80, depth_cm: 4, label: '100 × 80 cm', aspect_ratio: 0.8 },
    description: 'Segunda obra de la serie Estratos. Dialogá con la primera en formato apaisado.',
    primary_image: img('nature-mountains'),
    seo: { title: 'Estratos II — Janus', description: 'Óleo sobre tela, 100 × 80 cm' },
  },
  {
    id: 3, slug: 'obra-test-03', name: 'Residuo',
    year: 2022, availability: 'nfs', availability_label: 'No en venta',
    price: null, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo, cera y carbón',
    dimensions: { width_cm: 60, height_cm: 80, depth_cm: 3, label: '60 × 80 cm', aspect_ratio: 1.33 },
    description: 'Obra de colección privada. La superficie retiene huellas del proceso creativo.',
    primary_image: img('painting-texture'),
    seo: { title: 'Residuo — Janus', description: 'Óleo, cera y carbón, 60 × 80 cm' },
  },
  {
    id: 4, slug: 'obra-test-04', name: 'Umbral Rojo',
    year: 2024, availability: 'available', availability_label: 'Disponible',
    price: 45000, currency: 'MXN', is_featured: true,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo sobre tela',
    dimensions: { width_cm: 140, height_cm: 180, depth_cm: 5, label: '140 × 180 cm', aspect_ratio: 1.28 },
    description: 'Obra de gran formato. El rojo cadmio actúa como umbral entre dos estados.',
    primary_image: img('vibrant-colors'),
    seo: { title: 'Umbral Rojo — Janus', description: 'Óleo sobre tela, 140 × 180 cm' },
  },
  {
    id: 5, slug: 'obra-test-05', name: 'Capa Fósil',
    year: 2022, availability: 'reserved', availability_label: 'Reservada',
    price: 22000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo y arena',
    dimensions: { width_cm: 70, height_cm: 100, depth_cm: 3, label: '70 × 100 cm', aspect_ratio: 1.43 },
    description: 'La arena preserva el tiempo dentro del cuadro.',
    primary_image: img('earth-tones'),
    seo: { title: 'Capa Fósil — Janus', description: 'Óleo y arena, 70 × 100 cm' },
  },
  // ── Colección 2: Geometría Orgánica (Grabado) ───────────────────────────
  {
    id: 6, slug: 'obra-test-06', name: 'Red I',
    year: 2021, availability: 'available', availability_label: 'Disponible',
    price: 12000, currency: 'MXN', edition: '2/8', is_featured: false,
    technique: TECHNIQUES[1], collection: COLLECTIONS[1],
    medium: 'Aguafuerte sobre papel Fabriano',
    dimensions: { width_cm: 40, height_cm: 50, depth_cm: null, label: '40 × 50 cm', aspect_ratio: 1.25 },
    description: 'Primera de la serie Red. Líneas de grabado construyen una malla orgánica.',
    primary_image: img('geometric-lines'),
    seo: { title: 'Red I — Janus', description: 'Aguafuerte, 40 × 50 cm, edición 2/8' },
  },
  {
    id: 7, slug: 'obra-test-07', name: 'Red II',
    year: 2021, availability: 'available', availability_label: 'Disponible',
    price: 12000, currency: 'MXN', edition: '5/8', is_featured: false,
    technique: TECHNIQUES[1], collection: COLLECTIONS[1],
    medium: 'Aguafuerte sobre papel Fabriano',
    dimensions: { width_cm: 40, height_cm: 50, depth_cm: null, label: '40 × 50 cm', aspect_ratio: 1.25 },
    description: 'Segunda de la serie Red. La densidad de líneas cambia el ritmo visual.',
    primary_image: img('architecture-abstract'),
    seo: { title: 'Red II — Janus', description: 'Aguafuerte, 40 × 50 cm, edición 5/8' },
  },
  {
    id: 8, slug: 'obra-test-08', name: 'Fractura',
    year: 2020, availability: 'sold', availability_label: 'Vendida',
    price: 9500, currency: 'MXN', edition: '1/5', is_featured: false,
    technique: TECHNIQUES[1], collection: COLLECTIONS[1],
    medium: 'Xilografía',
    dimensions: { width_cm: 35, height_cm: 45, depth_cm: null, label: '35 × 45 cm', aspect_ratio: 1.28 },
    description: 'Xilografía sobre papel japonés. La madera deja su veta en la impresión.',
    primary_image: img('wood-grain-texture'),
    seo: { title: 'Fractura — Janus', description: 'Xilografía, 35 × 45 cm, edición 1/5' },
  },
  {
    id: 9, slug: 'obra-test-09', name: 'Módulo Verde',
    year: 2022, availability: 'available', availability_label: 'Disponible',
    price: 14500, currency: 'MXN', is_featured: true,
    technique: TECHNIQUES[1], collection: COLLECTIONS[1],
    medium: 'Litografía',
    dimensions: { width_cm: 50, height_cm: 60, depth_cm: null, label: '50 × 60 cm', aspect_ratio: 1.2 },
    description: 'Litografía de gran tiraje. Verde vivo sobre fondo negro.',
    primary_image: img('green-abstract'),
    seo: { title: 'Módulo Verde — Janus', description: 'Litografía, 50 × 60 cm' },
  },
  // ── Colección 3: Transiciones (Acrílico) ───────────────────────────────
  {
    id: 10, slug: 'obra-test-10', name: 'Disolución',
    year: 2023, availability: 'available', availability_label: 'Disponible',
    price: 18000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[2], collection: COLLECTIONS[2],
    medium: 'Acrílico sobre papel de algodón',
    dimensions: { width_cm: 76, height_cm: 56, depth_cm: null, label: '76 × 56 cm', aspect_ratio: 0.74 },
    description: 'Acrílico diluido al máximo. Los bordes se pierden en el soporte.',
    primary_image: img('watercolor-wash'),
    seo: { title: 'Disolución — Janus', description: 'Acrílico sobre papel, 76 × 56 cm' },
  },
  {
    id: 11, slug: 'obra-test-11', name: 'Acumulación I',
    year: 2023, availability: 'available', availability_label: 'Disponible',
    price: 21000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[2], collection: COLLECTIONS[2],
    medium: 'Acrílico con pigmento puro',
    dimensions: { width_cm: 80, height_cm: 100, depth_cm: 3, label: '80 × 100 cm', aspect_ratio: 1.25 },
    description: 'Capas densas de acrílico construyen una superficie casi táctil.',
    primary_image: img('blue-abstract-art'),
    seo: { title: 'Acumulación I — Janus', description: 'Acrílico sobre tela, 80 × 100 cm' },
  },
  {
    id: 12, slug: 'obra-test-12', name: 'Acumulación II',
    year: 2024, availability: 'reserved', availability_label: 'Reservada',
    price: 24000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[2], collection: COLLECTIONS[2],
    medium: 'Acrílico y barniz',
    dimensions: { width_cm: 80, height_cm: 120, depth_cm: 3, label: '80 × 120 cm', aspect_ratio: 1.5 },
    description: 'Continuación del diálogo entre capas.',
    primary_image: img('orange-yellow-abstract'),
    seo: { title: 'Acumulación II — Janus', description: 'Acrílico y barniz, 80 × 120 cm' },
  },
  // ── Colección 4: Umbral (Técnica mixta) ────────────────────────────────
  {
    id: 13, slug: 'obra-test-13', name: 'Passaggio',
    year: 2024, availability: 'available', availability_label: 'Disponible',
    price: 38000, currency: 'MXN', is_featured: true,
    technique: TECHNIQUES[3], collection: COLLECTIONS[3],
    medium: 'Óleo, grafito y hoja de oro',
    dimensions: { width_cm: 120, height_cm: 150, depth_cm: 5, label: '120 × 150 cm', aspect_ratio: 1.25 },
    description: 'El oro actúa como interrupción de la narrativa matérica del óleo.',
    primary_image: img('gold-texture-art'),
    seo: { title: 'Passaggio — Janus', description: 'Técnica mixta, 120 × 150 cm' },
  },
  {
    id: 14, slug: 'obra-test-14', name: 'Latencia',
    year: 2024, availability: 'available', availability_label: 'Disponible',
    price: 29000, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[3], collection: COLLECTIONS[3],
    medium: 'Encáustica sobre madera',
    dimensions: { width_cm: 60, height_cm: 90, depth_cm: 2, label: '60 × 90 cm', aspect_ratio: 1.5 },
    description: 'Encáustica: cera de abeja con pigmentos, fijada con calor.',
    primary_image: img('wax-encaustic'),
    seo: { title: 'Latencia — Janus', description: 'Encáustica sobre madera, 60 × 90 cm' },
  },
  // ── Obras adicionales sin colección específica ──────────────────────────
  {
    id: 15, slug: 'obra-test-15', name: 'Sin título (Negro)',
    year: 2021, availability: 'nfs', availability_label: 'No en venta',
    price: null, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[0], collection: COLLECTIONS[0],
    medium: 'Óleo negro sobre negro',
    dimensions: { width_cm: 50, height_cm: 50, depth_cm: 4, label: '50 × 50 cm', aspect_ratio: 1 },
    description: 'Superficie negra, materia negra. Solo visible con luz rasante.',
    primary_image: img('black-monochrome'),
    seo: { title: 'Sin título (Negro) — Janus', description: 'Óleo, 50 × 50 cm' },
  },
  {
    id: 16, slug: 'obra-test-16', name: 'Meridiano',
    year: 2022, availability: 'available', availability_label: 'Disponible',
    price: 16500, currency: 'MXN', is_featured: false,
    technique: TECHNIQUES[2], collection: COLLECTIONS[2],
    medium: 'Acrílico y tinta',
    dimensions: { width_cm: 56, height_cm: 76, depth_cm: null, label: '56 × 76 cm', aspect_ratio: 1.36 },
    description: 'Una línea vertical divide el soporte en dos atmósferas cromáticas.',
    primary_image: img('vertical-line-art'),
    seo: { title: 'Meridiano — Janus', description: 'Acrílico y tinta, 56 × 76 cm' },
  },
  {
    id: 17, slug: 'obra-test-17', name: 'Huella I',
    year: 2020, availability: 'sold', availability_label: 'Vendida',
    price: 8500, currency: 'MXN', edition: '3/6', is_featured: false,
    technique: TECHNIQUES[1], collection: COLLECTIONS[1],
    medium: 'Monotipia',
    dimensions: { width_cm: 30, height_cm: 40, depth_cm: null, label: '30 × 40 cm', aspect_ratio: 1.33 },
    description: 'Monotipia única: impresión directa de la plancha pintada.',
    primary_image: img('monoprint-texture'),
    seo: { title: 'Huella I — Janus', description: 'Monotipia, 30 × 40 cm, edición 3/6' },
  },
  {
    id: 18, slug: 'obra-test-18', name: 'Cuerpo de Agua',
    year: 2024, availability: 'available', availability_label: 'Disponible',
    price: 52000, currency: 'MXN', is_featured: true,
    technique: TECHNIQUES[3], collection: COLLECTIONS[3],
    medium: 'Óleo, resina y pigmento azul de Prusia',
    dimensions: { width_cm: 160, height_cm: 120, depth_cm: 5, label: '160 × 120 cm', aspect_ratio: 0.75 },
    description: 'La mayor obra del año. Azul de Prusia y resina crean una superficie de profundidad óptica.',
    primary_image: img('deep-blue-ocean'),
    seo: { title: 'Cuerpo de Agua — Janus', description: 'Técnica mixta, 160 × 120 cm' },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getMockArtworksList(opts: {
  techniqueSlug?: string
  collectionSlug?: string
  availability?: string
  page?: number
  perPage?: number
}): ListResponse<Artwork> {
  let filtered = [...MOCK_ARTWORKS]

  if (opts.techniqueSlug) {
    filtered = filtered.filter(a => a.technique.slug === opts.techniqueSlug)
  }
  if (opts.collectionSlug) {
    filtered = filtered.filter(a => a.collection.slug === opts.collectionSlug)
  }
  if (opts.availability) {
    filtered = filtered.filter(a => a.availability === opts.availability)
  }

  const perPage = opts.perPage ?? 24
  const page = opts.page ?? 1
  const offset = (page - 1) * perPage
  const data = filtered.slice(offset, offset + perPage)

  return {
    data,
    total: filtered.length,
    page,
    per_page: perPage,
    pages: Math.ceil(filtered.length / perPage),
  }
}

export function getMockArtworkDetail(slug: string): ArtworkDetail | null {
  const base = MOCK_ARTWORKS.find(a => a.slug === slug)
  if (!base) return null

  return {
    ...base,
    images: [
      {
        cf_id: `${base.primary_image.cf_id}-detail-a`,
        url: null, url_thumb: null, url_medium: null, url_large: null,
        alt_text: `${base.name} — vista detalle`,
        sequence: 1,
      },
      {
        cf_id: `${base.primary_image.cf_id}-detail-b`,
        url: null, url_thumb: null, url_medium: null, url_large: null,
        alt_text: `${base.name} — vista lateral`,
        sequence: 2,
      },
    ],
    prints: MOCK_PRINTS,
  }
}
