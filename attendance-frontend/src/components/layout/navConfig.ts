// Role-keyed navigation config + breadcrumb resolution for the AppLayout shell.
// Adapted from frontend-design-reference; paths are mapped to real routes that
// exist in `src/App.tsx`.
import {
  LayoutDashboard,
  Users,
  Users2,
  BookOpen,
  BarChart2,
  Bell,
  Settings,
  ClipboardCheck,
  FileEdit,
  Award,
  AlertCircle,
  Grid2X2,
  Crown,
  Shield,
  UserCog,
  MessageSquareWarning,
} from "lucide-react"
import type { Role } from "@/types"

// ─── Nav item / section types ─────────────────────────────────────────────────

export interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  /** Numeric badge (e.g., unread notifications). Undefined = no badge. */
  badge?: number
  /** End-match for NavLink (only exact path matches) */
  end?: boolean
}

export interface NavSection {
  /** Optional section header */
  label?: string
  items: NavItem[]
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string
  path?: string
}

// ─── Role metadata ────────────────────────────────────────────────────────────

export const ROLE_META: Record<
  Role,
  { label: string; textColor: string; bgColor: string; borderColor: string }
> = {
  ADMIN: {
    label: "Administrator",
    textColor: "text-brand",
    bgColor: "bg-brand-light",
    borderColor: "border-brand/20",
  },
  FACILITATOR: {
    label: "Facilitator",
    textColor: "text-status-present",
    bgColor: "bg-status-present-bg",
    borderColor: "border-status-present-border",
  },
  INSTRUCTOR: {
    label: "Instructor",
    textColor: "text-status-excused",
    bgColor: "bg-status-excused-bg",
    borderColor: "border-status-excused-border",
  },
  TEAM_LEADER: {
    label: "Team Leader",
    textColor: "text-status-late",
    bgColor: "bg-status-late-bg",
    borderColor: "border-status-late-border",
  },
  STUDENT: {
    label: "Student",
    textColor: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
}

// ─── Navigation config ────────────────────────────────────────────────────────

export const NAV_CONFIG: Record<Role, NavSection[]> = {
  ADMIN: [
    {
      items: [
        { label: "Dashboard",       icon: LayoutDashboard, path: "/dashboard" },
        { label: "Students",        icon: Users,           path: "/students" },
        { label: "Modules",         icon: BookOpen,        path: "/modules" },
        { label: "User Management", icon: UserCog,         path: "/users" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports" },
        { label: "Notifications", icon: Bell,      path: "/notifications" },
        { label: "Audit Log",     icon: Shield,    path: "/audit-log" },
        { label: "Settings",      icon: Settings,  path: "/profile" },
      ],
    },
  ],

  FACILITATOR: [
    {
      items: [
        { label: "Attendance",    icon: ClipboardCheck, path: "/attendance" },
        { label: "Modules",       icon: BookOpen,       path: "/modules" },
        { label: "Seating Chart", icon: Grid2X2,        path: "/seating" },
        { label: "Reports",       icon: BarChart2,      path: "/reports" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Notifications", icon: Bell,     path: "/notifications" },
        { label: "Settings",      icon: Settings, path: "/profile" },
      ],
    },
  ],

  INSTRUCTOR: [
    {
      items: [
        { label: "Module Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "My Modules",       icon: BookOpen,        path: "/modules" },
      ],
    },
    {
      label: "Grading",
      items: [
        { label: "Marks & Grades", icon: FileEdit, path: "/marks" },
        { label: "Seating",        icon: Grid2X2,  path: "/seating" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports" },
        { label: "Notifications", icon: Bell,      path: "/notifications" },
        { label: "Settings",      icon: Settings,  path: "/profile" },
      ],
    },
  ],

  TEAM_LEADER: [
    {
      items: [
        { label: "Dashboard",     icon: Crown,     path: "/leader" },
        { label: "Team Roster",   icon: Users2,    path: "/teams" },
        { label: "Assign Seats",  icon: Grid2X2,   path: "/seating" },
        { label: "Claims",        icon: AlertCircle, path: "/claims" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports" },
        { label: "Notifications", icon: Bell,      path: "/notifications" },
        { label: "Settings",      icon: Settings,  path: "/profile" },
      ],
    },
  ],

  STUDENT: [
    {
      items: [
        { label: "My Portal",  icon: LayoutDashboard,      path: "/portal", end: true },
        { label: "Attendance", icon: ClipboardCheck,       path: "/portal/attendance" },
        { label: "Marks",      icon: Award,                path: "/portal/marks" },
        { label: "Modules",    icon: BookOpen,             path: "/portal/modules" },
      ],
    },
    {
      label: "Classroom",
      items: [
        { label: "Seat",   icon: Grid2X2,              path: "/portal/seating" },
        { label: "Claims", icon: MessageSquareWarning, path: "/portal/claims" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", icon: Settings, path: "/profile" },
      ],
    },
  ],
}

// ─── Breadcrumb resolution (real routes) ─────────────────────────────────────
// Pages can override via a `<Breadcrumbs items={[...]} />` slot — this hook just
// produces a sensible default from the current pathname.

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":         "Dashboard",
  "/students":          "Students",
  "/modules":           "Modules",
  "/attendance":        "Attendance",
  "/marks":             "Marks & Grades",
  "/reports":           "Reports",
  "/notifications":     "Notifications",
  "/audit-log":         "Audit Log",
  "/users":             "User Management",
  "/teams":             "Teams",
  "/seating":           "Seating",
  "/claims":            "Claims",
  "/leader":            "Team Leader Dashboard",
  "/profile":           "Profile & Settings",
  "/portal":            "My Portal",
  "/portal/attendance": "My Attendance",
  "/portal/marks":      "My Marks",
  "/portal/modules":    "My Modules",
  "/portal/seating":    "My Seat",
  "/portal/claims":     "My Claims",
}

/** Resolve a breadcrumb chain from a real pathname. */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Exact match
  const exact = PAGE_TITLES[pathname]
  if (exact !== undefined) {
    // Multi-segment portal paths get a "My Portal" prefix
    if (pathname.startsWith("/portal/")) {
      return [
        { label: "My Portal", path: "/portal" },
        { label: exact },
      ]
    }
    return [{ label: exact }]
  }

  // Fallback: split path and humanise each segment
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return []
  return segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/")
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return i === segments.length - 1 ? { label } : { label, path }
  })
}

/** Lookup the page title for a path (Topbar fallback when breadcrumbs are empty) */
export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "Page"
}
