import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  Bell,
  Search,
  X,
  Check,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Users,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Breadcrumbs } from "./Breadcrumbs";
import { type Role, type BreadcrumbItem, ROLE_USERS, PAGE_META } from "./navConfig";

// ─── Mock notifications ───────────────────────────────────────────────────────

const MOCK_NOTIFS = [
  {
    id: 1,
    icon: AlertCircle,
    color: "text-status-absent",
    bg: "bg-status-absent-bg",
    title: "DNS Risk alert",
    body: "7 students are ≥ 25% absent in CS101.",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    icon: BookOpen,
    color: "text-brand",
    bg: "bg-brand-light",
    title: "Module CS202 opened",
    body: "Instructor Mukamana activated CS202.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: 3,
    icon: Users,
    color: "text-status-present",
    bg: "bg-status-present-bg",
    title: "New team leader accepted",
    body: "David Habimana joined Team Alpha.",
    time: "3 hr ago",
    read: true,
  },
];

// ─── Search modal ─────────────────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const suggestions = [
    { group: "Students", items: ["Alice Uwimana (S22001)", "Bruno Niyonzima (S22002)"] },
    { group: "Modules", items: ["CS101 — Intro to Programming", "CS202 — Data Structures"] },
    { group: "Actions", items: ["Take attendance for today", "Export attendance report"] },
  ];

  const filtered = query
    ? suggestions.map((g) => ({
        ...g,
        items: g.items.filter((i) =>
          i.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter((g) => g.items.length > 0)
    : suggestions;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-border shadow-modal overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, modules, actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-[14px] text-foreground placeholder:text-subtle-foreground bg-transparent outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">Esc</kbd>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              No results for "{query}"
            </p>
          ) : (
            filtered.map((group) => (
              <div key={group.group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  {group.group}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-foreground hover:bg-background transition-colors text-left"
                    onClick={onClose}
                  >
                    <ChevronRight size={13} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: query
                          ? item.replace(
                              new RegExp(`(${query})`, "gi"),
                              '<strong class="text-brand font-semibold">$1</strong>'
                            )
                          : item,
                      }}
                    />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] border border-border">↑↓</kbd> navigate
          </span>
          <span className="text-[11px] text-muted-foreground">
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] border border-border">↵</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Notification panel ───────────────────────────────────────────────────────

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const unreadCount = notifs.filter((n) => !n.read).length;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-popover z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Badge variant="danger" size="sm">{unreadCount} new</Badge>
          )}
        </div>
        <button
          onClick={() => setNotifs((n) => n.map((x) => ({ ...x, read: true })))}
          className="text-[11px] text-brand hover:text-brand-hover font-medium transition-colors"
        >
          Mark all read
        </button>
      </div>

      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {notifs.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 transition-colors hover:bg-background cursor-pointer ${
                n.read ? "opacity-60" : ""
              }`}
              onClick={() =>
                setNotifs((prev) =>
                  prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                )
              }
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${n.bg}`}>
                <Icon size={15} strokeWidth={2} className={n.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold text-foreground truncate">{n.title}</p>
                  {!n.read && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-subtle-foreground mt-0.5">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-center">
        <button className="text-[12px] text-brand hover:text-brand-hover font-medium transition-colors">
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  role: Role;
  activePath: string;
  breadcrumbs: BreadcrumbItem[];
  onMenuClick: () => void;
  onNavigate: (path: string) => void;
  notificationCount?: number;
}

export function Topbar({
  role,
  activePath,
  breadcrumbs,
  onMenuClick,
  onNavigate,
  notificationCount = 2,
}: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  const user = ROLE_USERS[role];
  const pageMeta = PAGE_META[activePath] ?? { title: "Page", breadcrumbs: [] };

  // Global keyboard shortcut: Ctrl/Cmd + K → open search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
          {breadcrumbs.length > 0 ? (
            <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
          ) : (
            <p className="text-[13px] font-semibold text-foreground truncate">
              {pageMeta.title}
            </p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-7 px-2.5 border border-border rounded-md bg-background text-muted-foreground text-[12px] hover:border-border-strong hover:text-foreground transition-colors"
            aria-label="Search (Ctrl+K)"
          >
            <Search size={13} strokeWidth={2} />
            <span className="hidden md:inline">Search…</span>
            <kbd className="hidden md:inline text-[10px] font-mono bg-white px-1 py-0.5 rounded border border-border ml-1">⌘K</kbd>
          </button>

          {/* Mobile search icon only */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search size={15} strokeWidth={2} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifsOpen(!notifsOpen)}
              className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
              aria-label={`${notificationCount} unread notifications`}
            >
              <Bell size={15} strokeWidth={2} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-absent border-2 border-white" />
              )}
            </button>
            {notifsOpen && (
              <NotificationPanel onClose={() => setNotifsOpen(false)} />
            )}
          </div>

          {/* Avatar */}
          <button
            className="ml-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={`${user.name} — account menu`}
          >
            <Avatar initials={user.initials} color="brand" size="sm" />
          </button>
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
