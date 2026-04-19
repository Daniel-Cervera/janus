import styles from './AvailabilityBadge.module.css'

type AvailabilityState = 'available' | 'reserved' | 'sold' | 'nfs'

interface AvailabilityBadgeProps {
  state: AvailabilityState | string
  showDot?: boolean
}

const CONFIG: Record<AvailabilityState, { label: string; dotColor: string; cls: string }> = {
  available: { label: 'Disponible',  dotColor: '#22c55e', cls: styles.available },
  reserved:  { label: 'Reservada',   dotColor: '#f59e0b', cls: styles.reserved  },
  sold:      { label: 'Vendida',     dotColor: '#ef4444', cls: styles.sold      },
  nfs:       { label: 'No en venta', dotColor: '#6b7280', cls: styles.nfs       },
}

export default function AvailabilityBadge({ state, showDot = true }: AvailabilityBadgeProps) {
  const cfg = CONFIG[state as AvailabilityState] ?? CONFIG.nfs

  return (
    <span className={`${styles.badge} ${cfg.cls}`}>
      {showDot && (
        <span
          className={styles.dot}
          style={{ background: cfg.dotColor }}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  )
}
