// nextjs/lib/schemas.ts
import { z } from 'zod'

export const TechniqueSchema = z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    collection_count: z.number(),
    artwork_count: z.number(),
    sequence: z.number(),
})

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
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    year: z.number().int(),
    availability: z.enum(['available', 'sold', 'reserved', 'nfs']),
    availability_label: z.string(),
    price: z.number().nullable(),
    currency: z.string(),

    artist: z.object({
        id: z.number(),
        name: z.string(),
        is_main_artist: z.boolean().optional()
    }).optional(),

    technique: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string()
    }),

    collection: z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string()
    }),

    medium: z.string().nullable(),

    dimensions: z.object({
        width_cm: z.number(),
        height_cm: z.number(),
        depth_cm: z.number().nullable(),
        label: z.string(),
        aspect_ratio: z.number()
    }),

    description: z.string().nullable(),
    edition: z.string().nullable().optional(),
    is_featured: z.boolean(),

    primary_image: z.object({
        cf_id: z.string().optional(),
        url: z.string().nullable().optional(),
        url_thumb: z.string().nullable().optional(),
        url_medium: z.string().nullable().optional(),
        url_large: z.string().nullable().optional(),
    }),

    seo: z.object({
        title: z.string(),
        description: z.string()
    }),

    images: z.array(z.any()).default([]),
})

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
    id: z.number(),
    name: z.string(),
    slug: z.string().optional(),
    state: z.enum(['upcoming', 'active', 'past']),
    date_start: z.string().nullable().optional(),
    date_end: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    cover_image: z.string().nullable().optional(),
    main_artist: z.object({
        id: z.number(),
        name: z.string(),
    }).nullable().optional(),
    guest_artists: z.array(z.any()).default([]),
    artwork_count: z.number(),
})

export const CommissionResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
}).passthrough()

// Helper genérico para respuestas de listas paginadas de Odoo
export function createListResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        data: z.array(itemSchema),
        total: z.number(),
        page: z.number().optional(),
        per_page: z.number().optional(),
        pages: z.number().optional()
    })
}