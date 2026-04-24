import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  Bell,
  Settings,
  Calendar,
  ClipboardCheck,
  FileEdit,
  Award,
  AlertCircle,
  Grid2X2,
} from "lucide-react";

// ─── Role type ────────────────────────────────────────────────────────────────

export type Role =
  | "ADMIN"
  | "FACILITATOR"
  | "INSTRUCTOR"
  | "TEAM_LEADER"
  | "STUDENT";

// ─── Nav item / section types ─────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  /** Numeric badge (e.g., unread notifications) */
  badge?: number;
}

export interface NavSection {
  /** Optional section header */
  label?: string;
  items: NavItem[];
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  path?: string;
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
};

// ─── Mock users per role ──────────────────────────────────────────────────────

export const ROLE_USERS: Record<Role, { name: string; email: string; initials: string }> = {
  ADMIN:       { name: "Alice Uwimana",   email: "a.uwimana@auca.ac.rw",   initials: "AU" },
  FACILITATOR: { name: "Bruno Niyonzima",email: "b.niyonzima@auca.ac.rw",  initials: "BN" },
  INSTRUCTOR:  { name: "Claire Mukamana",email: "c.mukamana@auca.ac.rw",   initials: "CM" },
  TEAM_LEADER: { name: "David Habimana", email: "d.habimana@auca.ac.rw",   initials: "DH" },
  STUDENT:     { name: "Esther Ingabire",email: "e.ingabire@s.auca.ac.rw", initials: "EI" },
};

// ─── Page titles & breadcrumbs per path ──────────────────────────────────────

export const PAGE_META: Record<string, { title: string; breadcrumbs: BreadcrumbItem[] }> = {
  "/":              { title: "Dashboard",          breadcrumbs: [] },
  "/users":         { title: "User Management",    breadcrumbs: [{ label: "User Management" }] },
  "/modules":       { title: "Modules",            breadcrumbs: [{ label: "Modules" }] },
  "/reports":       { title: "Reports",            breadcrumbs: [{ label: "Reports" }] },
  "/notifications": { title: "Notifications",      breadcrumbs: [{ label: "Notifications" }] },
  "/settings":      { title: "Settings",           breadcrumbs: [{ label: "Settings" }] },
  "/sessions":      { title: "Sessions",           breadcrumbs: [{ label: "Sessions" }] },
  "/attendance":    { title: "Take Attendance",    breadcrumbs: [{ label: "Attendance" }] },
  "/marks":         { title: "Marks Entry",        breadcrumbs: [{ label: "Marks Entry" }] },
  "/grades":        { title: "Grades",             breadcrumbs: [{ label: "Grades" }] },
  "/seating":       { title: "Seating Chart",      breadcrumbs: [{ label: "Seating" }] },
  "/team":          { title: "Team Roster",        breadcrumbs: [{ label: "Team Roster" }] },
  "/claims":        { title: "Claims",             breadcrumbs: [{ label: "Claims" }] },
  "/schedule":      { title: "My Schedule",        breadcrumbs: [{ label: "Schedule" }] },
};

// ─── Navigation config ────────────────────────────────────────────────────────

export const NAV_CONFIG: Record<Role, NavSection[]> = {
  ADMIN: [
    {
      items: [
        { label: "Dashboard",       icon: LayoutDashboard, path: "/" },
        { label: "User Management", icon: Users,            path: "/users" },
        { label: "Modules",         icon: BookOpen,         path: "/modules" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports" },
        { label: "Notifications", icon: Bell,       path: "/notifications", badge: 3 },
        { label: "Settings",      icon: Settings,   path: "/settings" },
      ],
    },
  ],

  FACILITATOR: [
    {
      items: [
        { label: "Sessions",        icon: Calendar,       path: "/sessions"    },
        { label: "Take Attendance", icon: ClipboardCheck, path: "/attendance"  },
        { label: "Seating Chart",   icon: Grid2X2,        path: "/seating"     },
        { label: "Reports",         icon: BarChart2,      path: "/reports"     },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Notifications", icon: Bell,     path: "/notifications", badge: 2 },
        { label: "Settings",      icon: Settings, path: "/settings" },
      ],
    },
  ],

  INSTRUCTOR: [
    {
      items: [
        { label: "My Modules",       icon: BookOpen,        path: "/" },
        { label: "Module Dashboard", icon: LayoutDashboard, path: "/modules" },
      ],
    },
    {
      label: "Grading",
      items: [
        { label: "Marks Entry", icon: FileEdit,  path: "/marks" },
        { label: "Grades",      icon: Award,     path: "/grades" },
        { label: "Seating",     icon: Grid2X2,   path: "/seating" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports" },
        { label: "Notifications", icon: Bell,      path: "/notifications", badge: 1 },
        { label: "Settings",      icon: Settings,  path: "/settings" },
      ],
    },
  ],

  TEAM_LEADER: [
    {
      items: [
        { label: "Dashboard",     icon: LayoutDashboard, path: "/"        },
        { label: "Team Roster",   icon: Users,           path: "/team"    },
        { label: "Assign Seats",  icon: Grid2X2,         path: "/seating" },
        { label: "Claims",        icon: AlertCircle,     path: "/claims",  badge: 2 },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Reports",       icon: BarChart2, path: "/reports"       },
        { label: "Notifications", icon: Bell,      path: "/notifications", badge: 1 },
        { label: "Settings",      icon: Settings,  path: "/settings"      },
      ],
    },
  ],

  STUDENT: [
    {
      items: [
        { label: "My Portal",   icon: LayoutDashboard, path: "/" },
        { label: "Attendance",  icon: ClipboardCheck,  path: "/attendance" },
        { label: "Grades",      icon: Award,           path: "/grades" },
        { label: "Schedule",    icon: Calendar,        path: "/schedule" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Notifications", icon: Bell,     path: "/notifications" },
        { label: "Settings",      icon: Settings, path: "/settings" },
      ],
    },
  ],
};