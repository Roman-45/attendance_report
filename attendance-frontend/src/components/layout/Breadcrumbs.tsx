// Breadcrumb trail rendered inside the Topbar. Adapted from
// frontend-design-reference; uses react-router-dom's `useNavigate` instead of
// a prop callback.
import React from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import type { BreadcrumbItem } from "./navConfig"

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Path to navigate to when the home icon is clicked. Defaults to "/". */
  homePath?: string
  className?: string
}

export function Breadcrumbs({
  items,
  homePath = "/",
  className = "",
}: BreadcrumbsProps): React.ReactElement | null {
  const navigate = useNavigate()
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-[12px] min-w-0 ${className}`}
    >
      {/* Home anchor */}
      <button
        onClick={() => navigate(homePath)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home size={13} strokeWidth={2} />
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <React.Fragment key={idx}>
            <ChevronRight
              size={12}
              strokeWidth={2}
              className="flex-shrink-0 text-border-strong"
              aria-hidden="true"
            />
            {isLast || !item.path ? (
              <span
                className={`truncate max-w-[160px] ${
                  isLast ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(item.path!)}
                className="truncate max-w-[160px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
