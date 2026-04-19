/**
 * store/cartStore.ts
 *
 * Estado global del carrito de prints/reproducciones.
 *
 * Decisión de arquitectura: Zustand sobre Context + useReducer porque:
 *  - Cero boilerplate: no requiere Provider wrapping
 *  - Actualizaciones atómicas sin re-renders en cascada
 *  - Persistencia en localStorage con un middleware nativo (persist)
 *  - DevTools de Redux compatibles para debug
 *  - Bundle size: ~1KB minificado y comprimido
 *
 * El carrito vive en localStorage para sobrevivir recargas,
 * pero se limpia automáticamente después de 24h (TTL).
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CartPrint {
    // Identificadores
    printId: number
    artworkId: number
    artworkSlug: string

    // Datos de display
    artworkName: string
    artworkImage: string | null  // URL de la imagen (thumb)
    sizeLabel: string
    paperLabel: string

    // Comercial
    price: number
    currency: string

    // Cantidad (≥1)
    quantity: number

    // Para vincular con Odoo e-commerce
    productId: number | null
}

interface CartState {
    items: CartPrint[]
    isOpen: boolean
    _persistedAt: number  // timestamp para TTL de 24h

    // Acciones
    addItem: (item: Omit<CartPrint, 'quantity'>) => void
    removeItem: (printId: number) => void
    updateQty: (printId: number, quantity: number) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
    toggleCart: () => void

    // Derivados (computed — no almacenados)
    totalItems: () => number
    totalPrice: () => number
    getItem: (printId: number) => CartPrint | undefined
}

// ── TTL de persistencia ───────────────────────────────────────────────────────
const CART_TTL_MS = 24 * 60 * 60 * 1000  // 24 horas

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            _persistedAt: Date.now(),

            // ── Añadir print ────────────────────────────────────────────────────────
            addItem: (newItem) => {
                set(state => {
                    const existing = state.items.find(i => i.printId === newItem.printId)

                    if (existing) {
                        // Si ya está en el carrito, incrementar cantidad
                        return {
                            items: state.items.map(i =>
                                i.printId === newItem.printId
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                            ),
                            isOpen: true,  // Abrir el drawer al añadir
                        }
                    }

                    return {
                        items: [...state.items, { ...newItem, quantity: 1 }],
                        isOpen: true,
                    }
                })
            },

            // ── Eliminar print ──────────────────────────────────────────────────────
            removeItem: (printId) =>
                set(state => ({
                    items: state.items.filter(i => i.printId !== printId),
                })),

            // ── Actualizar cantidad ─────────────────────────────────────────────────
            updateQty: (printId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(printId)
                    return
                }
                set(state => ({
                    items: state.items.map(i =>
                        i.printId === printId ? { ...i, quantity } : i
                    ),
                }))
            },

            // ── Limpiar carrito ─────────────────────────────────────────────────────
            clearCart: () => set({ items: [], isOpen: false }),

            // ── Drawer ──────────────────────────────────────────────────────────────
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

            // ── Derivados ───────────────────────────────────────────────────────────
            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            getItem: (printId) => get().items.find(i => i.printId === printId),
        }),
        {
            name: 'casa-janus-cart',
            storage: createJSONStorage(() => localStorage),

            // Solo persistir items y timestamp, no el estado del drawer
            partialize: (state) => ({
                items: state.items,
                _persistedAt: state._persistedAt,
            }),

            // Rehidratar — limpiar si el carrito tiene más de 24h
            onRehydrateStorage: () => (state) => {
                if (!state) return
                const age = Date.now() - (state._persistedAt ?? 0)
                if (age > CART_TTL_MS) {
                    state.items = []
                    state.isOpen = false
                }
            },
        }
    )
)