import React, { useState, useEffect } from "react";
import {
  Users, BookOpen, BarChart2, ClipboardCheck,
  AlertTriangle, Clock, MoreHorizontal,
  Mail, RefreshCw, Plus, Download,
  ArrowUpRight, ChevronUp, ChevronDown,
} from "lucide-react";
import { KPICard } from "../ui/KPICard";
import { Badge, ModuleBadge, DnsRiskBadge, InvitationBadge } from "../ui/Badge";
import type { ModuleStatus } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar, getInitials } from "../ui/Avatar";
import { Pagination } from "../ui/Pagination";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MODULES = [
  { code: "CS101", name: "Intro to Programming",  status: "active" as ModuleStatus, students: 98,  sessions: 14, completion: 87 },
  { code: "CS202", name: "Data Structures",         status: "active" as ModuleStatus, students: 76,  sessions: 12, completion: 91 },
  { code: "CS303", name: "Algorithms",              status: "active" as ModuleStatus, students: 82,  sessions: 10, completion: 79 },
  { code: "CS404", name: "Database Systems",        status: "draft"  as ModuleStatus, students: 0,   sessions: 0,  completion: 0  },
  { code: "CS505", name: "Software Engineering",    status: "closed" as ModuleStatus, students: 68,  sessions: 16, completion: 100 },
  { code: "CS606", name: "Operating Systems",       status: "active" as ModuleStatus, students: 71,  sessions: 11, completion: 83 },
];

const AT_RISK = [
  { id: "S22011", name: "Jean Baptiste Ndayishimiye", module: "CS101", pct: 68, absences: 5, risk: "dns"     as const },
  { id: "S22034", name: "Immaculée Uwimana",           module: "CS202", pct: 71, absences: 4, risk: "dns"     as const },
  { id: "S22067", name: "Théodore Hakizimana",         module: "CS303", pct: 73, absences: 4, risk: "warning" as const },
  { id: "S22089", name: "Providence Nzeyimana",        module: "CS101", pct: 74, absences: 4, risk: "warning" as const },
  { id: "S22102", name: "Janvier Habimana",            module: "CS606", pct: 65, absences: 6, risk: "dns"     as const },
  { id: "S22115", name: "Claudine Mukamana",           module: "CS202", pct: 76, absences: 3, risk: "warning" as const },
];

const ACTIVITY = [
  { icon: ClipboardCheck, color: "text-status-present", bg: "bg-status-present-bg", text: "Attendance submitted — CS101 Session 14", time: "10 min ago" },
  { icon: AlertTriangle,  color: "text-status-absent",  bg: "bg-status-absent-bg",  text: "DNS risk flagged: 7 students in CS202",  time: "1 hr ago"   },
  { icon: Users,          color: "text-brand",          bg: "bg-brand-light",        text: "New user invited: Team Leader for Team Beta", time: "3 hr ago" },
  { icon: BookOpen,       color: "text-status-excused", bg: "bg-status-excused-bg", text: "Module CS303 activated by C. Mukamana",  time: "Yesterday"  },
  { icon: BarChart2,      color: "text-muted-foreground",bg: "bg-background",        text: "Monthly report exported by admin",       time: "2 days ago" },
];

const PENDING_INVITES = [
  { name: "Jean Paul Nkurunziza", role: "Team Leader", context: "Team Gamma", email: "j.nkurunziza@auca.ac.rw" },
  { name: "Marie Claire Uwera",   role: "Student",     context: "CS101",      email: "m.uwera@s.auca.ac.rw"   },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Sk className="h-6 w-40" /><Sk className="h-4 w-64" /></div>
        <div className="flex gap-2"><Sk className="h-8 w-24" /><Sk className="h-8 w-28" /></div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-[20px] border border-border p-5 flex flex-col gap-3">
            <div className="flex justify-between"><Sk className="h-3 w-24" /><Sk className="h-8 w-8 rounded-lg" /></div>
            <Sk className="h-9 w-20" />
            <Sk className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Modules */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><Sk className="h-4 w-32" /></div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[0,1,2,3,4,5].map(i => <Sk key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><Sk className="h-4 w-40" /></div>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
              <Sk className="h-4 w-4 rounded-full flex-shrink-0" />
              <Sk className="h-4 flex-1" /><Sk className="h-4 w-16" /><Sk className="h-4 w-16" /><Sk className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><Sk className="h-4 w-24" /></div>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b border-border last:border-0">
              <Sk className="h-7 w-7 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5"><Sk className="h-3 w-full" /><Sk className="h-3 w-16" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleChip({ mod }: { mod: typeof MODULES[number] }) {
  const dotColor = mod.status === "active" ? "bg-status-present" : mod.status === "draft" ? "bg-status-draft" : "bg-status-closed";
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:border-border-strong hover:bg-background transition-all duration-150 cursor-pointer group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-brand font-mono">{mod.code}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      </div>
      <p className="text-[11px] text-foreground leading-tight line-clamp-2">{mod.name}</p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-muted-foreground tabular-nums">{mod.students} students</span>
        {mod.status === "active" && (
          <span className="text-[10px] text-status-present font-medium">{mod.completion}%</span>
        )}
      </div>
      {mod.status === "active" && (
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-status-present rounded-full transition-all" style={{ width: `${mod.completion}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey = "name" | "pct" | "absences";
type SortDir = "asc" | "desc";

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("pct");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...AT_RISK].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name")     return a.name.localeCompare(b.name) * dir;
    if (sortKey === "pct")      return (a.pct - b.pct) * dir;
    if (sortKey === "absences") return (a.absences - b.absences) * dir;
    return 0;
  });

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button onClick={() => toggleSort(col)} className="flex items-center gap-1 group">
        {label}
        <span className="flex flex-col -space-y-0.5">
          <ChevronUp   size={9} className={active && sortDir === "asc"  ? "text-brand" : "text-border-strong"} />
          <ChevronDown size={9} className={active && sortDir === "desc" ? "text-brand" : "text-border-strong"} />
        </span>
      </button>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">
            Academic year 2025/26 · Trimester 2 ·{" "}
            <span className="text-subtle-foreground">Last synced 2 min ago</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="md" icon={Download}>Export</Button>
          <Button variant="outline" size="md" icon={BarChart2}>Reports</Button>
          <Button variant="primary" size="md" icon={Plus}>Invite user</Button>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Students" value="324" trend="↑ 12 enrolled this week"    trendDirection="up"      icon={Users}          variant="default" />
        <KPICard title="Avg Attendance" value="91%" trend="↑ 3% vs last week"          trendDirection="up"      icon={ClipboardCheck} variant="default" />
        <KPICard title="Active Modules" value="8"   trend="3 opened this term"          trendDirection="neutral" icon={BookOpen}        variant="success" />
        <KPICard title="DNS Risk"        value="7"   trend="↓ 2 since last week"         trendDirection="down"    variant="danger"      badge={<DnsRiskBadge size="sm" />} />
      </div>

      {/* ── Module overview ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">Modules</p>
            <Badge variant="neutral" size="sm">{MODULES.length} total</Badge>
          </div>
          <Button variant="ghost" size="sm" icon={ArrowUpRight} iconPosition="right">
            Manage modules
          </Button>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULES.map(m => <ModuleChip key={m.code} mod={m} />)}
        </div>
      </div>

      {/* ── Bottom grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* At-risk student table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">At-Risk Students</p>
              <Badge variant="danger" size="sm" icon={AlertTriangle}>
                {AT_RISK.filter(s => s.risk === "dns").length} DNS
              </Badge>
            </div>
            <Button variant="ghost" size="sm" icon={ArrowUpRight} iconPosition="right">View all</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <SortBtn col="name" label="Student" />
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Module</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <SortBtn col="pct" label="Attendance" />
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <SortBtn col="absences" label="Absences" />
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i % 2 !== 0 ? "bg-[#FAFBFD]" : ""}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={getInitials(s.name)} autoColor size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[160px]">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[12px] font-mono font-semibold text-brand">{s.module}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full rounded-full ${s.pct < 70 ? "bg-status-absent" : s.pct < 75 ? "bg-status-late" : "bg-status-present"}`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                        <span className={`tabular-nums font-semibold ${s.pct < 70 ? "text-status-absent" : s.pct < 75 ? "text-status-late" : "text-status-present"}`}>
                          {s.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{s.absences}</td>
                    <td className="px-4 py-2.5">
                      {s.risk === "dns"
                        ? <DnsRiskBadge size="sm" />
                        : <Badge variant="warning" size="sm" icon={AlertTriangle}>Warning</Badge>
                      }
                    </td>
                    <td className="px-2 py-2.5">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors">
                        <MoreHorizontal size={13} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <Pagination currentPage={page} totalPages={8} onPageChange={setPage} siblingCount={1} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Activity</p>
              <Clock size={14} strokeWidth={1.75} className="text-muted-foreground" />
            </div>
            <div className="divide-y divide-border">
              {ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex gap-3 px-4 py-3 hover:bg-background transition-colors cursor-pointer">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${a.bg}`}>
                      <Icon size={13} strokeWidth={2} className={a.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-foreground line-clamp-2">{a.text}</p>
                      <p className="text-[11px] text-subtle-foreground mt-0.5">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <button className="text-[12px] text-brand hover:text-brand-hover font-medium transition-colors">
                View full log →
              </button>
            </div>
          </div>

          {/* Pending invitations */}
          {PENDING_INVITES.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-foreground">Pending Invitations</p>
                  <Badge variant="warning" size="sm" dot>{PENDING_INVITES.length}</Badge>
                </div>
              </div>
              <div className="divide-y divide-border">
                {PENDING_INVITES.map((inv, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <Avatar initials={getInitials(inv.name)} autoColor size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{inv.name}</p>
                      <p className="text-[11px] text-muted-foreground">{inv.role} · {inv.context}</p>
                      <div className="mt-1.5 flex gap-1.5">
                        <InvitationBadge status="pending" size="sm" />
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors">
                          <RefreshCw size={10} strokeWidth={2} />Resend
                        </button>
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors">
                          <Mail size={10} strokeWidth={2} />Copy link
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
