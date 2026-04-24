import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  HelpCircle,
  ChevronsUpDown,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import {
  type Role,
  type NavSection,
  NAV_CONFIG,
  ROLE_META,
  ROLE_USERS,
} from "./navConfig";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  activePath: string;
  onNavigate: (path: string) => void;
  onCollapse: () => void;
  onMobileClose: () => void;
  onRoleChange: (role: Role) => void;
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItemButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavSection["items"][number];
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
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
  );
}

// ─── Role switcher row ─────────────────────────────────────────────────────────

const ALL_ROLES: Role[] = [
  "ADMIN",
  "FACILITATOR",
  "INSTRUCTOR",
  "TEAM_LEADER",
  "STUDENT",
];

function RoleSwitcher({
  role,
  collapsed,
  onRoleChange,
}: {
  role: Role;
  collapsed: boolean;
  onRoleChange: (r: Role) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const meta = ROLE_META[role];
  const user = ROLE_USERS[role];
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
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
        <Avatar initials={user.initials} color="brand" size="sm" />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-foreground truncate">
                {user.name.split(" ")[0]}
              </p>
              <p
                className={`text-[11px] font-semibold truncate ${meta.textColor}`}
              >
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

      {/* Dropdown */}
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
              {ROLE_USERS[role].name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {ROLE_USERS[role].email}
            </p>
          </div>

          {/* Switch role section */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
            Demo: switch role
          </p>
          {ALL_ROLES.map((r) => {
            const m = ROLE_META[r];
            const u = ROLE_USERS[r];
            const isActive = r === role;
            return (
              <button
                key={r}
                onClick={() => {
                  onRoleChange(r);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors",
                  isActive
                    ? "bg-brand-light text-brand font-semibold"
                    : "text-foreground hover:bg-background",
                ].join(" ")}
              >
                <Avatar initials={u.initials} color="brand" size="xs" />
                <span className="flex-1 text-left">{m.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                )}
              </button>
            );
          })}

          {/* Divider + actions */}
          <div className="border-t border-border mt-1 pt-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-background hover:text-foreground transition-colors">
              <HelpCircle size={13} strokeWidth={1.75} />
              Help & docs
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-status-absent hover:bg-status-absent-bg transition-colors">
              <LogOut size={13} strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({
  role,
  collapsed,
  mobileOpen,
  activePath,
  onNavigate,
  onCollapse,
  onMobileClose,
  onRoleChange,
}: SidebarProps) {
  const sections = NAV_CONFIG[role];

  return (
    <aside
      className={[
        // Layout
        "fixed md:relative z-50 md:z-auto",
        "h-screen flex-shrink-0 flex flex-col",
        "bg-white border-r border-border",
        "transition-all duration-200 ease-out",
        // Desktop width
        collapsed ? "md:w-16" : "md:w-[240px]",
        // Mobile slide
        "w-[240px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Don't clip the role-switcher dropdown — let the outer shell clip
      ].join(" ")}
      aria-label="Primary navigation"
    >

      {/* ── Logo bar ────────────────────────────────────────────────────────── */}
      <div
        className={[
          "flex items-center h-12 border-b border-border flex-shrink-0 px-3",
          collapsed ? "justify-center" : "justify-between",
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo mark */}
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
          onClick={onCollapse}
          className="hidden md:flex flex-shrink-0 w-6 h-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={2} />
          ) : (
            <ChevronLeft size={14} strokeWidth={2} />
          )}
        </button>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="flex md:hidden flex-shrink-0 w-6 h-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label="Close sidebar"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Navigation sections ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            {!collapsed && section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                {section.label}
              </p>
            )}
            {collapsed && section.label && si > 0 && (
              <div className="my-1 mx-auto w-4 h-px bg-border" />
            )}
            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemButton
                  key={item.path}
                  item={item}
                  isActive={activePath === item.path}
                  collapsed={collapsed}
                  onClick={() => {
                    onNavigate(item.path);
                    onMobileClose();
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom: user / role switcher ─────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border px-2 py-2">
        <RoleSwitcher
          role={role}
          collapsed={collapsed}
          onRoleChange={onRoleChange}
        />
      </div>
    </aside>
  );
}