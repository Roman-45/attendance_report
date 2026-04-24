import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import {
  type Role,
  type BreadcrumbItem,
  NAV_CONFIG,
  PAGE_META,
} from "./navConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppLayoutProps {
  /** The page content. Receives the active path so pages can adapt. */
  children?: React.ReactNode;
  /**
   * Override breadcrumbs — when omitted, they are auto-derived from activePath
   * via PAGE_META. Pass an empty array to suppress breadcrumbs.
   */
  breadcrumbs?: BreadcrumbItem[];
  /** For demo: initial role. Defaults to ADMIN. */
  defaultRole?: Role;
  /** For demo: initial path. Defaults to "/". */
  defaultPath?: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AppLayoutContextValue {
  role: Role;
  activePath: string;
  navigate: (path: string) => void;
  collapsed: boolean;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

export const AppLayoutContext = React.createContext<AppLayoutContextValue>({
  role: "ADMIN",
  activePath: "/",
  navigate: () => {},
  collapsed: false,
  setBreadcrumbs: () => {},
});

export function useAppLayout() {
  return React.useContext(AppLayoutContext);
}

// ─── AppLayout shell ──────────────────────────────────────────────────────────

export function AppLayout({
  children,
  breadcrumbs: breadcrumbsProp,
  defaultRole = "ADMIN",
  defaultPath = "/",
}: AppLayoutProps) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [activePath, setActivePath] = useState(defaultPath);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  // Derive breadcrumbs: explicit prop > custom (via context) > PAGE_META
  const resolvedBreadcrumbs =
    breadcrumbsProp ??
    customBreadcrumbs ??
    (PAGE_META[activePath]?.breadcrumbs ?? []);

  function navigate(path: string) {
    // Reset custom breadcrumbs when navigating (they're page-specific)
    setCustomBreadcrumbs(null);
    setActivePath(path);
    setMobileOpen(false);
  }

  // When role changes, navigate to the first path of that role's nav
  function handleRoleChange(newRole: Role) {
    setRole(newRole);
    const firstPath = NAV_CONFIG[newRole][0]?.items[0]?.path ?? "/";
    navigate(firstPath);
  }

  const ctx: AppLayoutContextValue = {
    role,
    activePath,
    navigate,
    collapsed,
    setBreadcrumbs: setCustomBreadcrumbs,
  };

  return (
    <AppLayoutContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <Sidebar
          role={role}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          activePath={activePath}
          onNavigate={navigate}
          onCollapse={() => setCollapsed(!collapsed)}
          onMobileClose={() => setMobileOpen(false)}
          onRoleChange={handleRoleChange}
        />

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Topbar */}
          <Topbar
            role={role}
            activePath={activePath}
            breadcrumbs={resolvedBreadcrumbs}
            onMenuClick={() => setMobileOpen(true)}
            onNavigate={navigate}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
}
