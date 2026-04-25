// Initials-based Avatar primitive ported from frontend-design-reference.
// Distinct from `avatar.tsx` (shadcn + Radix; image fallback support). This one
// is a flat coloured tile with initials, used by the AppLayout shell.
// Named `InitialsAvatar` to avoid case-insensitive filename collision with
// `avatar.tsx` on Windows/macOS.
import React from "react"

export type InitialsAvatarColor =
  | "brand"
  | "green"
  | "amber"
  | "blue"
  | "red"
  | "neutral"

export type InitialsAvatarSize = "xs" | "sm" | "md" | "lg"

export interface InitialsAvatarProps {
  initials: string
  color?: InitialsAvatarColor
  size?: InitialsAvatarSize
  className?: string
  /** Auto-derive color from initials hash (overrides `color` when true) */
  autoColor?: boolean
}

const colorStyles: Record<InitialsAvatarColor, string> = {
  brand:   "bg-brand text-white",
  green:   "bg-status-present-bg text-status-present border border-status-present-border",
  amber:   "bg-status-late-bg text-status-late border border-status-late-border",
  blue:    "bg-status-excused-bg text-status-excused border border-status-excused-border",
  red:     "bg-status-absent-bg text-status-absent border border-status-absent-border",
  neutral: "bg-muted text-muted-foreground border border-border",
}

const sizeStyles: Record<InitialsAvatarSize, { box: string; text: string }> = {
  xs: { box: "w-6 h-6 rounded",      text: "text-[10px]" },
  sm: { box: "w-7 h-7 rounded-md",   text: "text-[11px]" },
  md: { box: "w-8 h-8 rounded-md",   text: "text-[12px]" },
  lg: { box: "w-10 h-10 rounded-lg", text: "text-[14px]" },
}

const AUTO_COLORS: InitialsAvatarColor[] = ["brand", "green", "amber", "blue"]

function hashColor(str: string): InitialsAvatarColor {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AUTO_COLORS[Math.abs(hash) % AUTO_COLORS.length]
}

/** Generate 1–2 initials from a full name string ("Alice Uwimana" → "AU") */
export function getInitials(name?: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function InitialsAvatar({
  initials,
  color = "brand",
  size = "md",
  autoColor = false,
  className = "",
}: InitialsAvatarProps): React.ReactElement {
  const resolvedColor = autoColor ? hashColor(initials) : color
  const { box, text } = sizeStyles[size]
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-semibold select-none ${box} ${text} ${colorStyles[resolvedColor]} ${className}`}
      aria-label={`Avatar for ${initials}`}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
