// nextjs/lib/schemas.ts
import { z } from 'zod'

export const TechniqueSchema = z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    collection_count: z.number().optional(),
    artwork_count: z.number().optional(),
    sequence: z.number().optional(),
}).passthrough()

export const CollectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    technique: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
    }).optional(),
    description: z.string().nullable().optional(),
    cover_image: z.string().nullable().optional(),
    cover_cf_id: z.string().nullable().optional(),
    year_start: z.number().nullable().optional(),
    year_end: z.number().nullable().optional(),
    artwork_count: z.number().optional(),
    sequence: z.number().optional(),
}).passthrough()

export const ArtworkSchema = z.object({
    id: z.number().optional(),
    slug: z.string(),
    name: z.string(),
    year: z.number().int().optional(),
    availability: z.enum(['available', 'sold', 'reserved', 'nfs']).optional(),
    availability_label: z.string().optional(),
    price: z.number().nullable().optional(),
    currency: z.string().optional(),

    artist: z.object({
        id: z.number(),
        name: z.string(),
        is_main_artist: z.boolean().optional()
    }).optional(),

    technique: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string()
    }).optional(),

    collection: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string()
    }).optional(),

    medium: z.string().nullable().optional(),

    dimensions: z.object({
        width_cm: z.number(),
        height_cm: z.number(),
        depth_cm: z.number().nullable().optional(),
        label: z.string(),
        aspect_ratio: z.number()
    }).optional(),

    description: z.string().nullable().optional(),
    edition: z.string().nullable().optional(),
    is_featured: z.boolean().optional(),

    primary_image: z.object({
        cf_id: z.string().optional(),
        url: z.string().nullable().optional(),
        url_thumb: z.string().nullable().optional(),
        url_medium: z.string().nullable().optional(),
        url_large: z.string().nullable().optional(),
    }).optional(),

    seo: z.object({
        title: z.string().optional(),
        description: z.string().optional()
    }).optional(),

    images: z.array(z.any()).default([]),
}).passthrough()

export const ArtistSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    slug: z.string().optional(),
    role: z.string().optional(),
    is_main_artist: z.boolean().optional(),
    nationality: z.string().nullable().optional(),
    birth_year: z.number().nullable().optional(),
    website: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    artist_statement: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    photo_cf_id: z.string().nullable().optional(),
    cv_items: z.array(z.any()).default([]),
    exhibition_count: z.number().optional(),
    artwork_ids: z.array(z.number()).default([]),
}).passthrough()

export const ExhibitionSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    slug: z.string().optional(),
    state: z.string().optional(),
    date_start: z.string().nullable().optional(),
    date_end: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    cover_image: z.string().nullable().optional(),
    main_artist: z.object({
        id: z.number(),
        name: z.string()
    }).nullable().optional(),
    guest_artists: z.array(z.any()).default([]),
    artwork_count: z.number().optional()
}).passthrough()

export const CommissionResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
}).passthrough()

// Helper genérico para respuestas de listas paginadas de Odoo
export function createListResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        data: z.array(itemSchema),
        total: z.number().optional(),
        page: z.number().optional(),
        per_page: z.number().optional(),
        pages: z.number().optional()
    }).passthrough()
}