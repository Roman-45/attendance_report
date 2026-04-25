// KPI tile — ported from frontend-design-reference/src/app/components/ui/KPICard.tsx
// Used across role dashboards (Admin, Facilitator, Instructor, TeamLeader).
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type KPIVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'
export type TrendDirection = 'up' | 'down' | 'neutral'

export interface KPICardProps {
  /** Short uppercase label above the value */
  title: string
  /** The primary metric — displayed large */
  value: string | number
  /** Descriptive trend line, e.g. "8 enrolled this week" */
  trend?: string
  /** Arrow direction that colours the trend line */
  trendDirection?: TrendDirection
  /** Lucide icon rendered in the top-right icon box */
  icon?: React.ElementType
  /** Colour variant — affects icon box tint and value colour for danger/warning. */
  variant?: KPIVariant
  /** Optional badge / element overlaid in the top-right corner (replaces icon) */
  badge?: React.ReactNode
  /** Override card width / margin etc. */
  className?: string
}

const iconBoxStyles: Record<KPIVariant, string> = {
  default: 'bg-brand-light text-brand',
  success: 'bg-status-present-bg text-status-present',
  warning: 'bg-status-late-bg text-status-late',
  danger:  'bg-status-absent-bg text-status-absent',
  info:    'bg-status-excused-bg text-status-excused',
}

const valueStyles: Record<KPIVariant, string> = {
  default: 'text-foreground',
  success: 'text-foreground',
  warning: 'text-status-late',
  danger:  'text-status-absent',
  info:    'text-foreground',
}

const trendStyles: Record<TrendDirection, string> = {
  up:      'text-status-present',
  down:    'text-status-absent',
  neutral: 'text-muted-foreground',
}

const TrendIcon: Record<TrendDirection, React.ElementType> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
}

export function KPICard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  variant = 'default',
  badge,
  className = '',
}: KPICardProps) {
  const TIcon = TrendIcon[trendDirection]

  return (
    <div
      className={[
        'relative bg-white rounded-xl border border-border shadow-card',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        'transition-all duration-200 ease-out',
        'p-5 flex flex-col gap-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mt-0.5">
          {title}
        </span>
        {badge ? (
          <div className="flex-shrink-0">{badge}</div>
        ) : Icon ? (
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconBoxStyles[variant]}`}>
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="leading-none">
        <span className={`text-[32px] font-bold tabular-nums tracking-tight ${valueStyles[variant]}`}>
          {value}
        </span>
      </div>

      {trend && (
        <div className={`flex items-center gap-1.5 text-[12px] font-medium ${trendStyles[trendDirection]}`}>
          <TIcon size={13} strokeWidth={2.5} aria-hidden="true" className="flex-shrink-0" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}
