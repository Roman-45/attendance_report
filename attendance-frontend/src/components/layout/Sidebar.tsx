// Sidebar shell adapted from frontend-design-reference.
// - Role + user come from AuthContext (no demo role-switcher).
// - Active path comes from useLocation().
// - Notification badge fed by react-query (admin-only).
// - Bottom user button opens an account menu (Profile / Sign out) — no role switching.
import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  UserCircle,
  ChevronsUpDown,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"
import client from "@/api/client"
import { InitialsAvatar, getInitials } from "@/components/ui/InitialsAvatar"
import {
  type NavItem as NavItemType,
  NAV_CONFIG,
  ROLE_META,
} from "./navConfig"

interface SidebarProps {
  /** Whether the mobile drawer is open (controls slide-in transform). */
  mobileOpen?: boolean
  /** Called when an item in the mobile drawer is clicked, or the close X. */
  onMobileClose?: () => void
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItemButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItemType
  isActive: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={[
        "relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
        "transition-all duration-150 group",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
        isActive
          ? "bg-brand-light text-brand before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-r before:bg-brand"
          : "text-muted-foreground hover:bg-background hover:text-foreground",
        collapsed ? "justify-center px-0" : "",
      ].join(" ")}
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 2.25 : 1.75}
        className="flex-shrink-0"
        aria-hidden="true"
      />
      {!collapsed && (
        <span className="flex-1 truncate text-left">{item.label}</span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-status-absent text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-status-absent border-2 border-white" />
      )}
    </button>
  )
}

// ─── Bottom user / account menu ───────────────────────────────────────────────

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!user) return null

  const meta = ROLE_META[user.role]
  const initials = getInitials(user.name)
  const firstName = user.name?.split(" ")[0] ?? user.email

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? `${user.name} (${meta.label})` : undefined}
        className={[
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg",
          "hover:bg-background transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
          collapsed ? "justify-center px-0" : "",
        ].join(" ")}
      >
        <InitialsAvatar initials={initials} color="brand" size="sm" />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-foreground truncate">
                {firstName}
              </p>
              <p className={`text-[11px] font-semibold truncate ${meta.textColor}`}>
                {meta.label}
              </p>
            </div>
            <ChevronsUpDown
              size={13}
              strokeWidth={2}
              className="flex-shrink-0 text-muted-foreground"
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={[
            "absolute bottom-full mb-2 z-50",
            "bg-white border border-border rounded-xl shadow-popover",
            "w-52 py-1.5 overflow-hidden",
            collapsed ? "left-0" : "left-0 right-0",
          ].join(" ")}
        >
          {/* User info header */}
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-[12px] font-semibold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          <button
            onClick={() => {
              navigate("/profile")
              setOpen(false)
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-foreground hover:bg-background transition-colors"
          >
            <UserCircle size={13} strokeWidth={1.75} />
            My Profile
          </button>

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-status-absent hover:bg-status-absent-bg transition-colors"
            >
              <LogOut size={13} strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, hasRole } = useAuth()
  const { collapsed, toggle } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = location.pathname

  // Notifications unread count — admin only (backend restricts /notifications)
  const isAdmin = hasRole("ADMIN")
  const { data: unread = 0 } = useQuery<number>({
    queryKey: ["unread-notification-count"],
    queryFn: () =>
      client
        .get("/notifications/unread-count")
        .then((r) => r.data.data ?? 0),
    enabled: isAdmin,
    refetchInterval: 60_000,
  })

  if (!user) return null

  // Pull role-based config and inject the dynamic notification badge
  const sections = NAV_CONFIG[user.role].map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.path === "/notifications" && isAdmin && unread > 0
        ? { ...item, badge: unread }
        : item,
    ),
  }))

  function isItemActive(item: NavItemType): boolean {
    if (item.end) return activePath === item.path
    return activePath === item.path || activePath.startsWith(item.path + "/")
  }

  function handleNav(path: string) {
    navigate(path)
    onMobileClose?.()
  }

  return (
    <aside
      className={[
        "fixed md:relative z-50 md:z-auto",
        "h-screen flex-shrink-0 flex flex-col",
        "bg-white border-r border-border",
        "transition-all duration-200 ease-out",
        // Desktop width
        collapsed ? "md:w-16" : "md:w-[240px]",
        // Mobile width + slide
        "w-[240px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
      aria-label="Primary navigation"
    >
      {/* ── Logo bar ──────────────────────────────────────────────── */}
      <div
        className={[
          "flex items-center h-12 border-b border-border flex-shrink-0 px-3",
          collapsed ? "justify-center" : "justify-between",
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-wide select-none">
              A
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-foreground truncate leading-none">
                AUCA
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                Academic Portal
              </p>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggle}
          className="hidden md:flex flex-shrink-0 w-6 h-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={2} />
          ) : (
            <ChevronLeft size={14} strokeWidth={2} />
          )}
        </button>

        {/* Mobile close */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="flex md:hidden flex-shrink-0 w-6 h-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {!collapsed && section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                {section.label}
              </p>
            )}
            {collapsed && section.label && si > 0 && (
              <div className="my-1 mx-auto w-4 h-px bg-border" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemButton
                  key={item.path + item.label}
                  item={item}
                  isActive={isItemActive(item)}
                  collapsed={collapsed}
                  onClick={() => handleNav(item.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom: user menu ────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border px-2 py-2">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  )
}
