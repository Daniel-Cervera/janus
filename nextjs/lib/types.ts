/**
 * lib/types.ts
 * Tipos TypeScript que reflejan el esquema de Odoo de Casa Janus.
 * Usados en todo el proyecto Next.js.
 */

// ── Primitivos ────────────────────────────────────────────────────────────────

export type Availability = 'available' | 'reserved' | 'sold' | 'nfs'
export type ExhibitionState = 'upcoming' | 'active' | 'past'
export type PaperType = 'fine_art' | 'photo_gloss' | 'photo_matte' | 'canvas'

export type BudgetRange =
  | 'lt500' | '500_1500' | '1500_5k' | '5k_15k' | 'gt15k'

// ── Imágenes Cloudflare ───────────────────────────────────────────────────────

export interface CFImage {
  cf_id?: string
  url?: string | null
  url_thumb?: string | null
  url_medium?: string | null
  url_large?: string | null
  is_primary?: boolean
  alt_text?: string
  sequence?: number
}

// ── Dimensiones de obra ───────────────────────────────────────────────────────

export interface ArtworkDimensions {
  width_cm: number
  height_cm: number
  depth_cm: number | null
  label: string
  /** Ratio height/width. Útil para calcular la altura en el mural masonry. */
  aspect_ratio: number
}

// ── Técnica ───────────────────────────────────────────────────────────────────

export interface TechniqueRef {
  id: number
  name: string
  slug: string
}

export interface Technique extends TechniqueRef {
  description?: string | null
  sequence: number
  collection_count: number
  artwork_count: number
  collections?: CollectionSummary[]  // solo si with_collections=true
}

// ── Colección ─────────────────────────────────────────────────────────────────

export interface CollectionRef {
  id: number
  name: string
  slug: string
}

export interface CollectionSummary extends CollectionRef {
  technique: TechniqueRef
  artwork_count: number
}

export interface Collection extends CollectionSummary {
  description: string
  cover_image: string | null
  cover_cf_id: string
  year_start: number | null
  year_end: number | null
  sequence: number
  artworks?: Artwork[]  // solo si with_artworks=true
}

// ── Obra ──────────────────────────────────────────────────────────────────────

export interface Artwork {
  id: number
  name: string
  slug: string
  year: number
  collection: CollectionRef
  technique: TechniqueRef
  medium: string | null
  dimensions: ArtworkDimensions
  description: string | null
  /** Edición grabado. Ej: "3/12". Null/undefined si no aplica. */
  edition?: string | null
  price: number | null
  currency: string
  availability: Availability
  availability_label: string
  is_featured: boolean
  primary_image: CFImage
  seo: {
    title: string
    description: string
  }
}

/** Obra con imágenes adicionales y prints. Devuelto por /artwork/:slug */
export interface ArtworkDetail extends Artwork {
  images: CFImage[]
  prints: PrintProduct[]
}

// ── Print / Reproducción ──────────────────────────────────────────────────────

export interface PrintProduct {
  id: number
  size_label: string
  paper_type: PaperType
  paper_label: string
  price: number
  currency: string
  stock_qty: number
  in_stock: boolean
  product_id: number | null
}

// ── Artista ───────────────────────────────────────────────────────────────────

export interface CVItem {
  year: number
  category: 'solo' | 'group' | 'award' | 'residency' | 'publication' | 'other'
  description: string
  location: string
}

export interface Artist {
  name: string
  biography: string   // HTML
  biography_html?: string
  photo_url?: string
  artist_statement: string
  photo: CFImage
  cv: CVItem[]
}

// ── Exposición ────────────────────────────────────────────────────────────────

export interface Exhibition {
  id: number
  name: string
  slug?: string
  date_start?: string | null  // ISO date
  date_end?: string | null
  location?: string | null
  city?: string | null
  description?: string | null  // HTML
  cover_image?: string | null
  state: ExhibitionState
  artwork_count: number
  main_artist?: { id: number; name: string } | null
  artworks?: Artwork[]         // solo si include_artworks=true
}

// ── Encargo personalizado ─────────────────────────────────────────────────────

export interface CommissionPayload {
  partner_name: string
  email: string
  phone?: string
  description: string
  budget_range?: BudgetRange
  technique_id?: number
  ref_artwork_id?: number
}

export interface CommissionResponse {
  success: boolean
  message: string
  id: number
}

// ── Respuestas de API ─────────────────────────────────────────────────────────

export interface ListResponse<T> {
  data: T[]
  total: number
  page?: number
  per_page?: number
  pages?: number
}

// ── Props de páginas ──────────────────────────────────────────────────────────

export interface GalleryPageProps {
  techniques: Technique[]
  initialArtworks: ListResponse<Artwork>
  activeTechniqueSlug?: string
  activeCollectionSlug?: string
}

export interface ArtworkPageProps {
  artwork: ArtworkDetail
  relatedArtworks: Artwork[]
}
