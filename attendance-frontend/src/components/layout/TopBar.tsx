// Topbar shell adapted from frontend-design-reference.
// - Search trigger opens a Cmd/Ctrl+K dialog; the search logic itself is
//   preserved from the previous TopBar (pages + students + modules via API).
// - Notification bell shows unread count from /notifications/unread-count
//   (admin only — backend restricts the endpoint). Hidden for non-admin roles.
// - Avatar opens a dropdown with My Profile + Sign out.
// - Breadcrumbs derived from the current pathname via `useBreadcrumbs`.
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Menu,
  Bell,
  Search,
  X,
  ChevronRight,
  LogOut,
  UserCircle,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import client from "@/api/client"
import { InitialsAvatar, getInitials } from "@/components/ui/InitialsAvatar"
import { Breadcrumbs } from "./Breadcrumbs"
import { useBreadcrumbs, getPageTitle, ROLE_META } from "./navConfig"
import type { BreadcrumbItem } from "./navConfig"

interface TopBarProps {
  onMenuClick?: () => void
  /** Optional explicit breadcrumb override (pages can pass their own). */
  breadcrumbs?: BreadcrumbItem[]
}

interface SearchResult {
  type: "student" | "module" | "page"
  label: string
  description: string
  route: string
}

const PAGE_RESULTS: SearchResult[] = [
  { type: "page", label: "Dashboard",          description: "Overview & statistics",           route: "/dashboard" },
  { type: "page", label: "Students",           description: "Manage students",                 route: "/students" },
  { type: "page", label: "Modules",            description: "Manage modules",                  route: "/modules" },
  { type: "page", label: "Attendance",         description: "Record & view attendance",        route: "/attendance" },
  { type: "page", label: "Marks & Grades",     description: "Manage marks & compute grades",   route: "/marks" },
  { type: "page", label: "Reports",            description: "Download reports (Excel/PDF)",    route: "/reports" },
  { type: "page", label: "Notifications",      description: "View notifications",              route: "/notifications" },
  { type: "page", label: "User Management",    description: "Manage roles and account status", route: "/users" },
  { type: "page", label: "Audit Log",          description: "View audit trail",                route: "/audit-log" },
  { type: "page", label: "My Portal",          description: "Student self-service",            route: "/portal" },
  { type: "page", label: "Profile & Settings", description: "Manage your profile",             route: "/profile" },
]

// ─── Search modal ─────────────────────────────────────────────────────────────

function SearchModal({
  onClose,
  onNavigate,
  hasRole,
}: {
  onClose: () => void
  onNavigate: (path: string) => void
  hasRole: (...roles: ("ADMIN" | "FACILITATOR" | "INSTRUCTOR" | "TEAM_LEADER" | "STUDENT")[]) => boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Debounced search across pages + students + modules
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()

    const pageMatches = PAGE_RESULTS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )

    const fetchResults = async () => {
      const merged: SearchResult[] = [...pageMatches]

      if (hasRole("ADMIN", "FACILITATOR", "INSTRUCTOR")) {
        try {
          const [studentsResp, modulesResp] = await Promise.all([
            hasRole("ADMIN")
              ? client
                  .get("/students", { params: { search: query, size: 5 } })
                  .catch(() => null)
              : null,
            client.get("/modules").catch(() => null),
          ])

          if (studentsResp?.data?.data) {
            const students =
              studentsResp.data.data.content ?? studentsResp.data.data ?? []
            students
              .slice(0, 5)
              .forEach(
                (s: { studentId: string; name: string; program: string }) => {
                  merged.push({
                    type: "student",
                    label: s.name,
                    description: `${s.studentId} — ${s.program}`,
                    route: "/students",
                  })
                },
              )
          }

          if (modulesResp?.data?.data) {
            const modules = modulesResp.data.data as Array<{
              id: number
              code: string
              name: string
            }>
            modules
              .filter(
                (m) =>
                  m.name.toLowerCase().includes(q) ||
                  m.code.toLowerCase().includes(q),
              )
              .slice(0, 5)
              .forEach((m) => {
                merged.push({
                  type: "module",
                  label: m.name,
                  description: m.code,
                  route: "/modules",
                })
              })
          }
        } catch {
          // ignore search errors
        }
      }

      setResults(merged.slice(0, 10))
    }

    const timer = setTimeout(fetchResults, 250)
    return () => clearTimeout(timer)
  }, [query, hasRole])

  const handleSelect = (r: SearchResult) => {
    onNavigate(r.route)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-border shadow-modal overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search
            size={16}
            strokeWidth={2}
            className="text-muted-foreground flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, modules, pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-[14px] text-foreground placeholder:text-subtle-foreground bg-transparent outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
              Esc
            </kbd>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close search"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {!query.trim() ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              Type to search pages, students, or modules.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              No results for "{query}"
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${i}`}
                className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-foreground hover:bg-background transition-colors text-left"
                onClick={() => handleSelect(r)}
              >
                <ChevronRight
                  size={13}
                  strokeWidth={2}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span className="inline-block w-16 flex-shrink-0 text-[10px] uppercase tracking-wider font-semibold text-subtle-foreground">
                  {r.type}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-foreground truncate">
                    {r.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {r.description}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] border border-border">
              ↵
            </kbd>{" "}
            open
          </span>
          <span className="text-[11px] text-muted-foreground">
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] border border-border">
              Esc
            </kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar dropdown ─────────────────────────────────────────────────────────

function AvatarMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!user) return null

  const initials = getInitials(user.name)
  const meta = ROLE_META[user.role]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="ml-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label={`${user.name} — account menu`}
      >
        <InitialsAvatar initials={initials} color="brand" size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-popover z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[12px] font-semibold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user.email}
            </p>
            <p className={`text-[11px] font-semibold mt-0.5 ${meta.textColor}`}>
              {meta.label}
            </p>
          </div>
          <button
            onClick={() => {
              navigate("/profile")
              setOpen(false)
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-foreground hover:bg-background transition-colors"
          >
            <UserCircle size={14} strokeWidth={1.75} />
            My Profile
          </button>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-status-absent hover:bg-status-absent-bg transition-colors border-t border-border"
          >
            <LogOut size={14} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function TopBar({ onMenuClick, breadcrumbs }: TopBarProps) {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

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

  // Auto-derived breadcrumbs from pathname (page-level overrides via prop)
  const autoCrumbs = useBreadcrumbs(location.pathname)
  const resolvedCrumbs = breadcrumbs ?? autoCrumbs

  // Global keyboard shortcut: Ctrl/Cmd + K → open search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 h-12 bg-white border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={16} strokeWidth={2} />
        </button>

        {/* Breadcrumbs / page title */}
        <div className="flex-1 min-w-0">
          {resolvedCrumbs.length > 0 ? (
            <Breadcrumbs items={resolvedCrumbs} />
          ) : (
            <p className="text-[13px] font-semibold text-foreground truncate">
              {getPageTitle(location.pathname)}
            </p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-7 px-2.5 border border-border rounded-md bg-background text-muted-foreground text-[12px] hover:border-border-strong hover:text-foreground transition-colors"
            aria-label="Search (Ctrl+K)"
          >
            <Search size={13} strokeWidth={2} />
            <span className="hidden md:inline">Search…</span>
            <kbd className="hidden md:inline text-[10px] font-mono bg-white px-1 py-0.5 rounded border border-border ml-1">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search size={15} strokeWidth={2} />
          </button>

          {/* Notification bell — admin only */}
          {isAdmin && (
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={15} strokeWidth={2} />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-status-absent border-2 border-white text-white text-[9px] font-semibold flex items-center justify-center tabular-nums">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}

          {/* Avatar + dropdown */}
          <AvatarMenu />
        </div>
      </header>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onNavigate={(p) => navigate(p)}
          hasRole={hasRole}
        />
      )}
    </>
  )
}
