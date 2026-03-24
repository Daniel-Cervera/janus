/**
 * store/selectionStore.ts
 *
 * Estado global para la selección múltiple de obras.
 *
 * Permite al usuario marcar obras como favoritas o seleccionarlas
 * para solicitar información conjunta. Persiste en localStorage
 * con TTL de 7 días.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Artwork } from '@/lib/types'

export interface SelectedArtwork {
  id:         number
  slug:       string
  name:       string
  year:       number
  technique:  string
  price:      number
  currency:   string
  imageUrl:   string | null
  addedAt:    number
}

interface SelectionState {
  items:       SelectedArtwork[]
  isDrawerOpen: boolean
  _persistedAt: number

  // Acciones
  toggleItem:  (artwork: Artwork) => void
  removeItem:  (id: number) => void
  clearAll:    () => void
  openDrawer:  () => void
  closeDrawer: () => void

  // Derivados
  isSelected:  (id: number) => boolean
  totalItems:  () => number
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      items:        [],
      isDrawerOpen: false,
      _persistedAt: Date.now(),

      toggleItem: (artwork) => {
        const exists = get().items.find(i => i.id === artwork.id)
        if (exists) {
          set(s => ({ items: s.items.filter(i => i.id !== artwork.id) }))
        } else {
          const item: SelectedArtwork = {
            id:        artwork.id,
            slug:      artwork.slug,
            name:      artwork.name,
            year:      artwork.year,
            technique: artwork.technique?.name ?? '',
            price:     artwork.price,
            currency:  artwork.currency ?? 'USD',
            imageUrl:  artwork.primary_image?.url_thumb ?? null,
            addedAt:   Date.now(),
          }
          set(s => ({ items: [...s.items, item], isDrawerOpen: true }))
        }
      },

      removeItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.id !== id) })),

      clearAll: () => set({ items: [], isDrawerOpen: false }),

      openDrawer:  () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      isSelected: (id) => !!get().items.find(i => i.id === id),
      totalItems: () => get().items.length,
    }),
    {
      name:    'casa-janus-selection',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, _persistedAt: s._persistedAt }),
      onRehydrateStorage: () => (s) => {
        if (!s) return
        if (Date.now() - (s._persistedAt ?? 0) > TTL_MS) s.clearAll()
      },
    }
  )
)
