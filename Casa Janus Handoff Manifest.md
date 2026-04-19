# Casa Janus — Design System Handoff Manifest
> Versión 2.0 · Abril 2025  
> Para uso exclusivo de Claude Code y equipos de desarrollo

---

## 1. SISTEMA DE DISEÑO

### 1.1 Paleta de Color

```css
/* ── Negros / Fondos ───────────────────────────────────────── */
--cj-black:       #090909;   /* Fondo base de toda la app */
--cj-black-soft:  #111111;   /* Superficie de modales, panels */
--cj-surface:     #181818;   /* Cards, items de lista */
--cj-surface-2:   #202020;   /* Hover state de cards */
--cj-border:      #2c2c2c;   /* Bordes principales */
--cj-border-2:    #3a3a3a;   /* Bordes en hover */

/* ── Rojo — identidad de marca ─────────────────────────────── */
--cj-red:         #c41e1e;   /* Acento principal, CTAs primarios */
--cj-red-bright:  #e02424;   /* Hover de botón primario */
--cj-red-dim:     #8b1a1a;   /* Estados activos, bordes activos */
--cj-red-ghost:   rgba(196,30,30,0.08); /* Fondos sutiles de acento */

/* ── Blancos / Texto ───────────────────────────────────────── */
--cj-white:       #f4efe9;   /* Texto principal, títulos */
--cj-white-dim:   #c6bdb3;   /* Texto secundario, descripción */
--cj-white-ghost: rgba(244,239,233,0.06); /* Hover states muy sutiles */

/* ── Grises ────────────────────────────────────────────────── */
--cj-gray:        #6a6560;   /* Texto terciario, labels inactivos */
--cj-gray-dim:    #3f3d3a;   /* Copyright, metadatos mínimos */
```

**Regla de uso de color:**
- Fondo global: `--cj-black`
- Texto sobre negro: `--cj-white`
- Texto secundario: `--cj-white-dim` o `--cj-gray`
- Acento / interacción: `--cj-red` ÚNICAMENTE
- NUNCA usar gradientes de color en fondos de sección principal

---

### 1.2 Tipografía — Montserrat

**Migración:** Reemplazar completamente `Cormorant Garamond` y `Archivo` por **Montserrat**. Una sola familia tipográfica para toda la interfaz.

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-primary: 'Montserrat', system-ui, sans-serif;

  /* Pesos */
  --fw-light:     300;   /* Cuerpo largo, descripciones */
  --fw-regular:   400;   /* Texto base, metadatos */
  --fw-medium:    500;   /* Labels, nav links, botones */
  --fw-semibold:  600;   /* Subtítulos, nombres de obra */
  --fw-bold:      700;   /* Títulos de sección h2, h3 */
  --fw-extrabold: 800;   /* Hero h1, títulos de página */
}
```

#### Escala tipográfica completa

| Token | Size | Weight | LS | Transform | Uso |
|-------|------|--------|----|-----------|-----|
| `--ts-hero` | `clamp(72px, 13vw, 150px)` | 800 | `-0.03em` | `uppercase` | Hero h1 |
| `--ts-page-title` | `clamp(40px, 6vw, 84px)` | 800 | `-0.03em` | `uppercase` | Títulos de página |
| `--ts-h2` | `clamp(28px, 4vw, 48px)` | 700 | `-0.02em` | — | Secciones |
| `--ts-h3` | `20–24px` | 600 | `-0.01em` | — | Subtítulos |
| `--ts-body-lg` | `15–16px` | 300 | `0` | — | Párrafos largos |
| `--ts-body` | `13–15px` | 300–400 | `0` | — | Texto de apoyo |
| `--ts-label` | `10–11px` | 500 | `0.2em` | `uppercase` | Labels de sección |
| `--ts-caption` | `10–12px` | 400 | `0.1em` | — | Metadatos, fechas |
| `--ts-micro` | `9–10px` | 500 | `0.2em` | `uppercase` | Badges, tags |

#### Jerarquía en práctica

```css
/* Hero — impacto máximo */
.hero-headline {
  font-family: var(--font-primary);
  font-weight: 800;
  font-size: clamp(72px, 13vw, 150px);
  letter-spacing: -0.03em;
  line-height: 0.9;
  text-transform: uppercase;
  color: var(--cj-white);
}

/* Eyebrow label — siempre sobre un título */
.eyebrow-label {
  font-family: var(--font-primary);
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cj-red);
}

/* Título de sección h2 */
.section-title {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: clamp(28px, 4vw, 48px);
  letter-spacing: -0.02em;
  color: var(--cj-white);
}

/* Cuerpo largo */
.body-text {
  font-family: var(--font-primary);
  font-weight: 300;
  font-size: 15px;
  line-height: 2;
  color: var(--cj-white-dim);
}

/* Nav link */
.nav-link {
  font-family: var(--font-primary);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

---

### 1.3 Espaciado

```css
:root {
  --sp-2:  2px;
  --sp-4:  4px;
  --sp-8:  8px;
  --sp-12: 12px;
  --sp-16: 16px;
  --sp-20: 20px;
  --sp-24: 24px;
  --sp-32: 32px;
  --sp-40: 40px;
  --sp-48: 48px;
  --sp-64: 64px;
  --sp-80: 80px;
  --sp-100: 100px;
  --sp-120: 120px;
}
```

**Reglas de espaciado:**
- Padding de sección principal: `100px 32px` (desktop) / `60px 20px` (mobile)
- Gap entre cards en grid: `2px` (gap visual mínimo, no espacio blanco)
- Gap entre elementos de formulario: `20px`
- Altura del header: `60px` fija
- `max-width` del contenedor global: `1400px` centrado

---

### 1.4 Bordes y Shape

```css
/* REGLA ESTRICTA: sin border-radius en elementos principales */
border-radius: 0;     /* Botones, cards, inputs, modales, badges */
border-radius: 2px;   /* ÚNICA excepción: badges de disponibilidad */
border-radius: 50%;   /* ÚNICA excepción: dot de estado (6px × 6px) */
```

**Estética sharp:** La identidad visual de Casa Janus se basa en ángulos rectos. Los bordes redondeados no forman parte del sistema de diseño excepto en las excepciones descritas.

---

### 1.5 Elevación y Sombras

```css
/* No se usan box-shadow para elevación — la profundidad se comunica
   mediante color de superficie, bordes y contraste */

/* Excepción: panel flotante de Tweaks / drawers */
--shadow-panel: 0 8px 32px rgba(0,0,0,0.6);

/* Sombra de texto en Hero (únicamente) */
--shadow-text-hero:
  0 2px 40px rgba(0,0,0,0.5),
  0 0  80px rgba(0,0,0,0.3);
```

---

### 1.6 Transiciones y Movimiento

```css
/* Ease estándar para hover states */
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:  cubic-bezier(0.45, 0, 0.55, 1);

/* Duraciones */
--dur-fast:   0.15s;   /* Color, opacidad de border */
--dur-base:   0.2s;    /* Hover states de botones, colores */
--dur-smooth: 0.35s;   /* Aparición de overlays en cards */
--dur-enter:  0.55s;   /* Reveal de componentes al entrar */
```

**Regla de animación:**  
- **Header y Hero:** CERO animaciones, CERO transiciones de entrada. Estrictamente estático.
- Hover states: SÍ (transición de color, transform mínimo)
- Cards: overlay de info en hover (opacity transition)
- Modal: entrada con `scale(0.96) → scale(1)` + `opacity`
- Drawers: slide desde el borde (`translateX`)

---

## 2. REGLAS DE UI

### 2.1 Header — Regla Estricta

```
⚠️ REGLA CRÍTICA: El header debe ser completamente estático.
```

**PROHIBIDO en el header:**
- `backdrop-filter` o `blur` de ningún tipo
- Animaciones de entrada o scroll
- Cambio de fondo al hacer scroll (no scroll-aware header)
- Elementos animados, loaders, indicadores de carga

**REQUERIDO:**
```css
header {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);  /* 100 */
  background: var(--cj-black);          /* Sólido, sin transparencia */
  border-bottom: 1px solid var(--cj-border);
  /* Sin backdrop-filter, sin blur, sin transición de background */
}

nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;                         /* Altura fija siempre */
  padding: 0 32px;
  max-width: 1400px;
  margin: 0 auto;
}
```

**Logo:**
- `font-weight: 600–700` (Montserrat SemiBold/Bold)
- `font-size: 14–16px`
- `letter-spacing: 0.2em`
- `text-transform: uppercase`
- "Casa" en `--cj-white`, "Janus" en `--cj-red`

**Nav links:**
- `font-weight: 500` · `font-size: 11px` · `letter-spacing: 0.15em` · `uppercase`
- Color base: `--cj-gray`
- Color activo/hover: `--cj-red`
- Indicador activo: `border-bottom: 1px solid var(--cj-red)` (NO subrayado de texto)

---

### 2.2 Hero — Regla Estricta

```
⚠️ REGLA CRÍTICA: El hero debe ser estático. Sin video. Sin iframe. Sin blur animado.
```

**Implementación correcta:**
```css
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cj-black);   /* Color sólido puro */
  overflow: hidden;
}

/* Textura opcional: grid CSS, no imagen */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(44,44,44,0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(44,44,44,0.25) 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.4;
  pointer-events: none;
}

/* Acento de línea — borde rojo izquierdo */
.hero::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 1px; height: 40%;
  background: var(--cj-red);
  opacity: 0.6;
}
```

**Contenido del hero:**
1. Eyebrow label (`--ts-label`, color `--cj-red`)
2. Headline `h1` (`--ts-hero`, weight 800, `--cj-white`)
3. Tagline (`10–13px`, weight 300, letter-spacing 0.3em, color rgba(244,239,233,0.45))
4. CTA group (botón primario + botón secundario)
5. Sin tagline animada, sin contadores, sin partículas

---

### 2.3 Botones

```css
/* Base común */
.btn {
  font-family: var(--font-primary);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 14px 36px;
  border-radius: 0;
  cursor: pointer;
  transition: background var(--dur-base), border-color var(--dur-base), color var(--dur-base);
  display: inline-block;
}

/* Primario */
.btn-primary {
  background: var(--cj-red);
  color: var(--cj-white);
  border: none;
}
.btn-primary:hover { background: var(--cj-red-bright); }

/* Secundario */
.btn-secondary {
  background: transparent;
  color: rgba(244, 239, 233, 0.85);
  border: 1px solid rgba(244, 239, 233, 0.3);
}
.btn-secondary:hover { border-color: rgba(244, 239, 233, 0.7); color: var(--cj-white); }

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--cj-gray);
  border: 1px solid var(--cj-border);
}
.btn-ghost:hover { border-color: var(--cj-border-2); color: var(--cj-white-dim); }
```

**Botón de ancho completo (formularios y modales):**
```css
.btn-full { width: 100%; text-align: center; padding: 14px; }
```

---

### 2.4 Cards de Obra

```css
.artwork-card {
  position: relative;
  background: var(--cj-surface);
  overflow: hidden;
  cursor: pointer;
  /* Sin border-radius */
}

/* Imagen: scale en hover */
.artwork-card:hover img { transform: scale(1.04); }
img { transition: transform 0.55s var(--ease-out); }

/* Overlay gradiente: visible solo en hover */
.card-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.92) 100%);
  opacity: 0;
  transition: opacity var(--dur-smooth);
}
.artwork-card:hover .card-overlay { opacity: 1; }

/* Info panel: entra desde abajo en hover */
.card-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 14px 12px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s, transform var(--dur-smooth) var(--ease-out);
}
.artwork-card:hover .card-info { opacity: 1; transform: translateY(0); }

/* Título en card */
.card-title {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
  color: var(--cj-white);
  margin-bottom: 4px;
}

/* Badge de disponibilidad */
.avail-badge {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 2px 7px;
  /* background y color dinámicos según disponibilidad */
}
```

**Estados de disponibilidad:**
```js
const AVAIL_COLORS = {
  available: { bg: '#22c55e20', color: '#22c55e', label: 'Disponible' },
  reserved:  { bg: '#f59e0b20', color: '#f59e0b', label: 'Reservada'  },
  sold:      { bg: '#ef444420', color: '#ef4444', label: 'Vendida'    },
  nfs:       { bg: '#6b728020', color: '#6b7280', label: 'No en venta'},
};
```

---

### 2.5 Modal de Obra

```css
.modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(2px);  /* permitido aquí — es UI, no hero */
}

.modal-container {
  background: var(--cj-black-soft);
  border: 1px solid var(--cj-border);
  max-width: 960px;
  max-height: 90vh;
  display: grid;
  grid-template-columns: 1fr 1fr;  /* imagen | info */
  /* Sin border-radius */
  animation: modalIn 0.35s var(--ease-out) both;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}
```

---

### 2.6 Formularios

```css
/* Input / Textarea / Select */
.form-field {
  width: 100%;
  background: var(--cj-surface);
  border: 1px solid var(--cj-border);
  color: var(--cj-white);
  font-family: var(--font-primary);
  font-weight: 300;
  font-size: 14px;
  padding: 14px 16px;
  border-radius: 0;
  outline: none;
  transition: border-color var(--dur-fast);
}

.form-field:focus { border-color: var(--cj-red); }

.form-label {
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cj-gray);
  display: block;
  margin-bottom: 8px;
}
```

**Honeypot anti-spam (siempre presente en el form de encargos):**
```html
<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
```

---

### 2.7 Footer

```css
footer {
  border-top: 1px solid var(--cj-border);
  padding: 48px 32px;
  margin-top: 100px;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-logo {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cj-white);
}

.footer-link {
  font-weight: 400;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--cj-gray);
  transition: color var(--dur-fast);
}
.footer-link:hover { color: var(--cj-red); }

.footer-copy {
  font-size: 11px;
  color: var(--cj-gray-dim);
}
```

---

## 3. ÁRBOL DE RUTAS

```
/                           → pages/index.tsx
/galeria                    → pages/galeria/index.tsx
/artista                    → pages/artista/index.tsx
/biography                  → pages/biography/index.tsx
/exposiciones               → pages/exposiciones/index.tsx
/encargos                   → pages/encargos/index.tsx
/tienda                     → pages/tienda/index.tsx (pendiente)
/tienda/checkout            → pages/tienda/checkout.tsx
/tienda/confirmacion        → pages/tienda/confirmacion.tsx
/api/gallery                → pages/api/gallery/index.ts
/api/artwork/[slug]         → pages/api/artwork/[slug].ts
/api/commission             → pages/api/commission/index.ts
/api/cart/checkout          → pages/api/cart/checkout.ts
/api/odoo/lead              → pages/api/odoo/lead.ts
```

---

## 4. DESGLOSE RUTA POR RUTA

### 4.1 `/` — Home

**Secciones (en orden):**
1. `<HeroSection>` — Hero estático
2. `<FeaturedGrid>` — Grid 3–4 cols de obras destacadas
3. `<TechniquesGrid>` — Grid de técnicas con descripción
4. `<ArtistVision>` — 2 cols: retrato + bio corta + cita
5. `<ExhibitionsPreview>` — Lista de 3 exposiciones con `<ExhibitionRow>`
6. `<ContactCTA>` — Sección de contacto centrada

**Componentes requeridos:**
- `Layout` (header + footer)
- `HeroSection` — estático
- `ArtworkCard` (versión home, sin drawer de selección)
- `EventsSection`

**Especificaciones clave:**
```
Hero h1: Montserrat 800, clamp(72px,13vw,150px), uppercase, ls -0.03em
Hero eyebrow: Montserrat 500, 10px, ls 0.22em, uppercase, color --cj-red
Section padding: 100px 32px
Featured grid gap: 2px
Technique cards: background --cj-surface, hover --cj-surface-2
```

---

### 4.2 `/galeria` — Galería

**Layout:**
```
[Page Header Strip]    ← label + h1
[Technique Tabs]       ← barra horizontal, border-bottom
[Secondary Bar]        ← pills de colección + filtros de disponibilidad + contador
[Masonry Grid]         ← 3 columnas desktop, 2 tablet, 1 mobile
[FAB Selección]        ← fijo, solo visible si selectionCount > 0
[ArtworkModal]         ← fixed overlay
[SelectionDrawer]      ← panel lateral
```

**Filtros (query params):**
- `?tecnica={slug}` — técnica activa
- `?col={slug}` — colección activa
- `?availability=available|nfs` — disponibilidad

**Especificaciones:**
```
Technique tabs: Montserrat 500, 11px, ls 0.15em, uppercase
Tab activa: color --cj-red + border-bottom 2px solid --cj-red
Grid gap: 2px
Masonry: CSS columns: 3 (desktop) / 2 (768px) / 1 (480px)
Card skeleton: background #1a1a1a, shimmer animation
```

---

### 4.3 `/artista` — Artista

**Layout:**
```
[Page Header]          ← eyebrow "Artista" + h1 nombre
[2-Col Section]        ← retrato (3:4) | bio texto
[CV List]              ← año | título | tipo, separados por border-bottom
```

**Especificaciones:**
```
H1: Montserrat 800, clamp(48px,7vw,84px), uppercase, ls -0.03em
CV row: grid 80px 1fr auto, padding 20px 0, border-bottom
CV año: Montserrat 400, 12px, ls 0.1em, color --cj-red
Retrato placeholder: background --cj-surface, border-left 1px solid --cj-red
```

---

### 4.4 `/exposiciones` — Exposiciones

**Layout:**
```
[Page Header]          ← eyebrow "Agenda" + h1
[Filter Row]           ← Todas | Próximas | En curso | Pasadas
[Exhibition List]      ← <ExhibitionCard> × n
```

**`ExhibitionCard` layout:**
```
[Imagen 300px]  |  [Info: estado-badge | nombre h3 | venue | fechas]
```

**Estado badges:**
```
upcoming → color --cj-red, border rgba(--cj-red, 0.3)
active   → color #22c55e, border rgba(#22c55e, 0.3)
past     → color --cj-gray, border rgba(--cj-gray, 0.2)
```

---

### 4.5 `/encargos` — Encargos

**Layout:**
```
[2-Col Section]
  Left:  eyebrow | h1 | descripción | proceso (4 pasos numerados)
  Right: <CommissionForm>
```

**Campos del formulario (en orden):**
```
Row 1: nombre* | email*
Row 2: teléfono | presupuesto (select)
Row 3: técnica preferida (select) | dimensiones
Row 4: descripción del encargo* (textarea, height 140px)
Honeypot: input[name="website"] display:none
Submit: btn-primary full-width
```

**Validación requerida:**
- Zod en `pages/api/commission/index.ts`
- Rate limiting: máximo 3 requests/hora por IP
- Honeypot: rechazar si `website` field no está vacío

---

### 4.6 `/tienda` — Tienda (en progreso)

**Estructura pendiente de completar.**  
Flujo esperado: Listado de prints → Checkout → Confirmación

**Componentes existentes:**
- `CartDrawer.tsx` — drawer global con items del carrito
- `store/cartStore.ts` — Zustand, persiste en localStorage (TTL 24h)

---

## 5. COMPONENTES — ÁRBOL

```
components/
├── layout/
│   ├── Layout.tsx              Header global + Footer
│   └── Layout.module.css
├── hero/
│   ├── HeroSection.tsx         REFACTORIZAR: eliminar video iframe
│   └── HeroSection.module.css
├── gallery/
│   ├── ArtworkCard.tsx         ✓ Mantener lógica, actualizar estilos
│   ├── ArtworkCard.module.css
│   ├── GalleryMural.tsx        ✓ Mantener
│   └── GalleryMural.module.css
├── modal/
│   ├── ArtworkModal.tsx        ✓ Mantener lógica
│   └── ArtworkModal.module.css
├── commission/
│   ├── CommissionForm.tsx      ✓ Mantener lógica
│   └── CommissionForm.module.css
├── exhibition/
│   ├── EventsSection.tsx       ✓ Mantener
│   └── EventsSection.module.css
├── cart/
│   ├── CartDrawer.tsx          ✓ Mantener
│   └── CartDrawer.module.css
├── selection/
│   ├── SelectionDrawer.tsx     ✓ Mantener
│   └── SelectionDrawer.module.css
└── forms/
    ├── LeadForm.tsx            ✓ Mantener
    └── LeadForm.module.css
```

---

## 6. CAMBIOS PRIORITARIOS PARA CLAUDE CODE

### Prioridad Alta (P0)

1. **`HeroSection.tsx`** — Eliminar el iframe de YouTube completo. Reemplazar con hero estático. Ver sección 2.2 de este documento.

2. **`globals.css`** — Cambiar imports de fuentes:
   ```css
   /* ELIMINAR: */
   @import url('...Cormorant+Garamond...');
   
   /* REEMPLAZAR CON: */
   @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
   ```
   Cambiar variables:
   ```css
   /* ELIMINAR: */
   --font-display: 'Cormorant Garamond', Georgia, serif;
   --font-body:    'Archivo', system-ui, sans-serif;
   
   /* REEMPLAZAR CON: */
   --font-primary: 'Montserrat', system-ui, sans-serif;
   ```

3. **`Layout.module.css`** — Eliminar `backdrop-filter: blur(8px)` del header. Cambiar `background: rgba(9,9,9,0.95)` por `background: var(--cj-black)`.

### Prioridad Media (P1)

4. **Todos los `.module.css`** — Buscar y reemplazar:
   - `'Cormorant Garamond'` → `var(--font-primary)`
   - `'Archivo'` → `var(--font-primary)`
   - `font-style: italic` en Cormorant → `font-weight: 300` en Montserrat (el italic no aplica en el mismo contexto)

5. **`ArtworkCard.module.css`** — Actualizar `.title`:
   ```css
   /* ANTES: */
   .title { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 15px; }
   
   /* DESPUÉS: */
   .title { font-family: var(--font-primary); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; }
   ```

6. **`ArtworkModal.module.css`** — Actualizar `.title`:
   ```css
   /* ANTES: */
   .title { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 30px; }
   
   /* DESPUÉS: */
   .title { font-family: var(--font-primary); font-weight: 700; font-size: 26px; letter-spacing: -0.02em; }
   ```

### Prioridad Baja (P2)

7. **`Layout.tsx`** — Actualizar logo:
   ```tsx
   /* ANTES: */
   <Link className={styles.logo}>Casa <span className={styles.logoAccent}>Janus</span></Link>
   /* Estilos con Cormorant Garamond font-size: 20px */
   
   /* DESPUÉS: Montserrat 600–700, 14–15px, ls 0.2em, uppercase */
   ```

8. **Formularios** — Verificar que todos los `<input>`, `<textarea>`, `<select>` usen `var(--font-primary)` y peso 300.

---

## 7. Z-INDEX GLOBAL

```css
:root {
  --z-nav:       100;   /* Header sticky */
  --z-fab:       150;   /* FAB de selección */
  --z-modal-bg:  200;   /* Backdrop de modal */
  --z-modal:     210;   /* Modal container */
  --z-drawer:    220;   /* Drawers laterales */
  --z-toast:     300;   /* Notificaciones */
  --z-tweaks:    400;   /* Panel de Tweaks (dev only) */
}
```

---

## 8. RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
@media (min-width: 480px)  { /* Móvil grande */ }
@media (min-width: 640px)  { /* Tablet pequeño: nav visible */ }
@media (min-width: 768px)  { /* Tablet: 2 cols galería */ }
@media (min-width: 1024px) { /* Desktop: layout completo */ }
@media (min-width: 1400px) { /* Wide: max-width contenedor */ }

/* Mobile: nav links ocultos */
@media (max-width: 640px) {
  .nav-links { display: none; }
  /* Implementar hamburger menu o bottom nav */
}
```

---

## 9. CHECKLIST DE HANDOFF

- [ ] Fuente Montserrat importada con pesos 300/400/500/600/700/800
- [ ] Variables `--font-display` y `--font-body` eliminadas del CSS global
- [ ] HeroSection.tsx sin iframe, sin YouTube, sin blur animado
- [ ] Header sin `backdrop-filter`, background sólido `#090909`
- [ ] Todas las instancias de `Cormorant Garamond` reemplazadas
- [ ] Todas las instancias de `Archivo` reemplazadas
- [ ] `border-radius: 0` en botones, cards e inputs
- [ ] Botón primario usa `--cj-red` (#c41e1e)
- [ ] Focus visible: `outline: 1px solid var(--cj-red)`
- [ ] `prefers-reduced-motion` respetado en todas las animaciones
- [ ] Touch targets mínimos de 44×44px en botones interactivos
- [ ] Honeypot presente en CommissionForm
- [ ] `max-width: 1400px` en todos los contenedores de sección

---

*Generado para Claude Code · Casa Janus v2.0 · Casa-Janus project*
