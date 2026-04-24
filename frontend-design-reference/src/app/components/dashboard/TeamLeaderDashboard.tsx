import React, { useState, useEffect } from "react";
import {
  Users, AlertTriangle, MessageSquare, CheckCircle2,
  Clock, XCircle, ChevronRight, Plus, Filter,
} from "lucide-react";
import { Badge, AttendanceBadge, DnsRiskBadge } from "../ui/Badge";
import type { AttendanceStatus } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar, getInitials } from "../ui/Avatar";
import { Pagination } from "../ui/Pagination";

// ─── Mock data ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: "S22001", name: "Alice Uwimana",    attendance: 94, absences: 1, status: "present" as AttendanceStatus, risk: false },
  { id: "S22002", name: "Bruno Niyonzima",  attendance: 70, absences: 5, status: "absent"  as AttendanceStatus, risk: true  },
  { id: "S22003", name: "Claire Mukamana",  attendance: 88, absences: 2, status: "present" as AttendanceStatus, risk: false },
  { id: "S22004", name: "David Habimana",   attendance: 76, absences: 3, status: "late"    as AttendanceStatus, risk: false },
  { id: "S22005", name: "Esther Ingabire",  attendance: 100,absences: 0, status: "present" as AttendanceStatus, risk: false },
  { id: "S22006", name: "Fabrice Nkusi",    attendance: 65, absences: 6, status: "absent"  as AttendanceStatus, risk: true  },
  { id: "S22007", name: "Grace Uwera",      attendance: 82, absences: 3, status: "excused" as AttendanceStatus, risk: false },
  { id: "S22008", name: "Hervé Bizimana",   attendance: 91, absences: 1, status: "present" as AttendanceStatus, risk: false },
];

type ClaimStatus = "open" | "resolved" | "rejected";

const CLAIMS = [
  {
    id: "C001",
    student: "Bruno Niyonzima",
    studentId: "S22002",
    type: "Attendance Dispute",
    desc: "Session 12 — was present but marked absent",
    status: "open" as ClaimStatus,
    raised: "2 days ago",
    module: "CS101",
  },
  {
    id: "C002",
    student: "Fabrice Nkusi",
    studentId: "S22006",
    type: "Medical Excuse",
    desc: "Sessions 8–10, hospitalised with supporting doc",
    status: "open" as ClaimStatus,
    raised: "1 week ago",
    module: "CS202",
  },
  {
    id: "C003",
    student: "David Habimana",
    studentId: "S22004",
    type: "Attendance Dispute",
    desc: "Session 9 — late arrival recorded as absent",
    status: "resolved" as ClaimStatus,
    raised: "2 weeks ago",
    module: "CS303",
  },
];

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { icon: React.ElementType; variant: "warning" | "success" | "danger"; label: string }> = {
  open:     { icon: Clock,        variant: "warning", label: "Open"     },
  resolved: { icon: CheckCircle2, variant: "success", label: "Resolved" },
  rejected: { icon: XCircle,      variant: "danger",  label: "Rejected" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Sk className="h-6 w-40" /><Sk className="h-4 w-52" /></div>
        <Sk className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="bg-white rounded-[20px] border border-border p-5 space-y-3"><Sk className="h-3 w-24" /><Sk className="h-9 w-12" /><Sk className="h-3 w-20" /></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-border overflow-hidden">
          {[0,1,2,3,4].map(i => <div key={i} className="flex gap-3 px-4 py-3 border-b border-border"><Sk className="h-7 w-7 rounded-full" /><div className="flex-1 space-y-1.5"><Sk className="h-3 w-36" /><Sk className="h-3 w-24" /></div><Sk className="h-5 w-16 rounded-full" /></div>)}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          {[0,1,2].map(i => <div key={i} className="p-4 border-b border-border space-y-2"><Sk className="h-4 w-32" /><Sk className="h-3 w-48" /></div>)}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamLeaderDashboard() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "risk">("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 950);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  const teamSize  = TEAM_MEMBERS.length;
  const avgAtt    = Math.round(TEAM_MEMBERS.reduce((a, m) => a + m.attendance, 0) / teamSize);
  const dnsCount  = TEAM_MEMBERS.filter(m => m.risk).length;
  const openClaims = CLAIMS.filter(c => c.status === "open").length;

  const filtered = filter === "risk" ? TEAM_MEMBERS.filter(m => m.risk) : TEAM_MEMBERS;

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Team Alpha</h1>
          <p className="text-muted-foreground mt-0.5">
            {teamSize} members · Trimester 2, 2025/26 · CS101 · CS202 · CS303
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>Raise a claim</Button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Team Members",     value: teamSize,  icon: Users,         color: "text-brand",          bg: "bg-brand-light",        sub: "Enrolled"     },
          { label: "Team Attendance",  value: `${avgAtt}%`, icon: CheckCircle2, color: "text-status-present", bg: "bg-status-present-bg",  sub: "This term"    },
          { label: "DNS Risk",         value: dnsCount,  icon: AlertTriangle, color: "text-status-absent",  bg: "bg-status-absent-bg",   sub: "Students at risk" },
          { label: "Open Claims",      value: openClaims,icon: MessageSquare, color: "text-status-late",    bg: "bg-status-late-bg",     sub: "Awaiting review" },
        ].map(c => {
          const CIcon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-[20px] border border-[#EAEFF7] shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <CIcon size={16} strokeWidth={2} className={c.color} />
                </div>
              </div>
              <span className="text-[32px] font-bold text-foreground tabular-nums leading-none">{c.value}</span>
              <p className="text-[12px] text-muted-foreground">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Team roster */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Team Roster</p>
              <Badge variant="neutral" size="sm">{teamSize}</Badge>
            </div>
            <button
              onClick={() => setFilter(f => f === "all" ? "risk" : "all")}
              className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                filter === "risk"
                  ? "bg-status-absent-bg text-status-absent border border-status-absent-border"
                  : "text-muted-foreground hover:bg-background border border-border"
              }`}
            >
              <Filter size={12} strokeWidth={2} />
              {filter === "risk" ? "DNS only" : "Filter"}
            </button>
          </div>

          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Student", "Today", "Attendance", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i % 2 !== 0 ? "bg-[#FAFBFD]" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={getInitials(m.name)} autoColor size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{m.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <AttendanceBadge status={m.status} size="sm" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className={`h-full rounded-full ${m.attendance >= 85 ? "bg-status-present" : m.attendance >= 75 ? "bg-status-late" : "bg-status-absent"}`}
                          style={{ width: `${m.attendance}%` }}
                        />
                      </div>
                      <span className={`tabular-nums text-[12px] font-semibold ${m.attendance >= 85 ? "text-status-present" : m.attendance >= 75 ? "text-status-late" : "text-status-absent"}`}>
                        {m.attendance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {m.risk && <DnsRiskBadge size="sm" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">No students at DNS risk — team is doing great!</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border">
            <Pagination currentPage={page} totalPages={2} onPageChange={setPage} siblingCount={1} />
          </div>
        </div>

        {/* Claims panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Claims</p>
              {openClaims > 0 && <Badge variant="warning" size="sm" dot>{openClaims} open</Badge>}
            </div>
            <Button variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">All claims</Button>
          </div>

          <div className="divide-y divide-border flex-1">
            {CLAIMS.map(c => {
              const cfg = CLAIM_STATUS_CONFIG[c.status];
              const CIcon = cfg.icon;
              return (
                <div key={c.id} className="px-4 py-3.5 hover:bg-background transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{c.type}</p>
                      <p className="text-[11px] text-muted-foreground">{c.student} · <span className="font-mono">{c.module}</span></p>
                    </div>
                    <Badge variant={cfg.variant} size="sm" icon={CIcon}>{cfg.label}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{c.desc}</p>
                  <p className="text-[10px] text-subtle-foreground mt-1">{c.raised}</p>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-border flex-shrink-0">
            <Button variant="outline" size="sm" icon={Plus} className="w-full justify-center">
              Raise new claim
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
