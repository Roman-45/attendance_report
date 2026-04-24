import React, { useState, useEffect } from "react";
import {
  BookOpen, Users, CheckCircle2, XCircle,
  Clock, ChevronRight, Plus, Award, BarChart2,
  AlertTriangle,
} from "lucide-react";
import { Badge, ModuleBadge } from "../ui/Badge";
import type { ModuleStatus } from "../ui/Badge";
import { Button } from "../ui/Button";

// ─── Mock data ────────────────────────────────────────────────────────────────

type AssessmentStatus = "submitted" | "open" | "not-started";

interface Assessment {
  label: string;
  maxContribution: number;  // component weight in final mark (20 or 40)
  status: AssessmentStatus;
  avgRaw?: number;           // class average raw score /100
}

// Derived: avgScaled = avgRaw * maxContribution / 100
function scaledAvg(a: Assessment): number | null {
  if (a.avgRaw === undefined) return null;
  return Math.round(a.avgRaw * a.maxContribution) / 100;
}

interface Module {
  code: string;
  name: string;
  status: ModuleStatus;
  students: number;
  sessions: number;
  totalSessions: number;
  avgAttendance: number;
  dnsRisk: number;
  assessments: Assessment[];
}

const MY_MODULES: Module[] = [
  {
    code: "CS101",
    name: "Introduction to Programming",
    status: "active",
    students: 98,
    sessions: 14,
    totalSessions: 16,
    avgAttendance: 88,
    dnsRisk: 4,
    assessments: [
      { label: "CAT 1",   maxContribution: 20, status: "submitted",   avgRaw: 72 },
      { label: "CAT 2",   maxContribution: 20, status: "open",        avgRaw: undefined },
      { label: "Project", maxContribution: 20, status: "not-started", avgRaw: undefined },
      { label: "Exam",    maxContribution: 40, status: "not-started", avgRaw: undefined },
    ],
  },
  {
    code: "CS202",
    name: "Data Structures & Algorithms",
    status: "active",
    students: 76,
    sessions: 12,
    totalSessions: 16,
    avgAttendance: 91,
    dnsRisk: 2,
    assessments: [
      { label: "CAT 1",   maxContribution: 20, status: "submitted",   avgRaw: 68 },
      { label: "CAT 2",   maxContribution: 20, status: "submitted",   avgRaw: 74 },
      { label: "Project", maxContribution: 20, status: "open",        avgRaw: undefined },
      { label: "Exam",    maxContribution: 40, status: "not-started", avgRaw: undefined },
    ],
  },
  {
    code: "CS606",
    name: "Operating Systems",
    status: "draft",
    students: 0,
    sessions: 0,
    totalSessions: 16,
    avgAttendance: 0,
    dnsRisk: 0,
    assessments: [
      { label: "CAT 1",   maxContribution: 20, status: "not-started", avgRaw: undefined },
      { label: "CAT 2",   maxContribution: 20, status: "not-started", avgRaw: undefined },
      { label: "Project", maxContribution: 20, status: "not-started", avgRaw: undefined },
      { label: "Exam",    maxContribution: 40, status: "not-started", avgRaw: undefined },
    ],
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Sk className="h-6 w-32" /><Sk className="h-4 w-48" /></div>
        <Sk className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-4">
            <div className="flex justify-between items-start"><Sk className="h-4 w-16" /><Sk className="h-5 w-14 rounded-full" /></div>
            <Sk className="h-5 w-40" />
            <div className="grid grid-cols-4 gap-1">{[0,1,2,3].map(j => <Sk key={j} className="h-6 rounded" />)}</div>
            <Sk className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Assessment pill ──────────────────────────────────────────────────────────

function AssessmentPill({ a }: { a: Assessment }) {
  const styles = {
    submitted:     { icon: CheckCircle2, color: "text-status-present", bg: "bg-status-present-bg", border: "border-status-present-border" },
    open:          { icon: Clock,        color: "text-status-late",    bg: "bg-status-late-bg",    border: "border-status-late-border"    },
    "not-started": { icon: XCircle,      color: "text-muted-foreground", bg: "bg-background",      border: "border-border"                },
  }[a.status];
  const Icon = styles.icon;
  const scaled = scaledAvg(a);

  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${styles.bg} ${styles.border}`}>
      <Icon size={13} strokeWidth={2} className={styles.color} />
      <span className={`text-[10px] font-semibold ${styles.color} text-center leading-tight`}>{a.label}</span>
      {scaled !== null ? (
        /* Submitted: show raw avg → scaled avg */
        <div className="text-center">
          <p className="text-[11px] font-bold text-foreground tabular-nums leading-none">
            {a.avgRaw}<span className="text-[9px] text-muted-foreground font-normal">/100</span>
          </p>
          <p className="text-[10px] text-status-present font-semibold tabular-nums">
            {scaled.toFixed(1)}<span className="text-[9px] text-muted-foreground font-normal">/{a.maxContribution}</span>
          </p>
        </div>
      ) : (
        /* Not yet graded: show max contribution slot */
        <span className="text-[10px] text-subtle-foreground tabular-nums">
          /{a.maxContribution}
        </span>
      )}
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: Module }) {
  const sessionPct = mod.totalSessions > 0 ? Math.round((mod.sessions / mod.totalSessions) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-bold font-mono text-brand">{mod.code}</span>
            <ModuleBadge status={mod.status} size="sm" />
          </div>
          <p className="text-[14px] font-semibold text-foreground leading-tight">{mod.name}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} strokeWidth={1.75} className="text-brand" />
        </div>
      </div>

      {/* Stats */}
      {mod.status !== "draft" && (
        <div className="px-5 pb-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[20px] font-bold text-foreground tabular-nums">{mod.students}</p>
            <p className="text-[10px] text-muted-foreground">Students</p>
          </div>
          <div className="text-center">
            <p className={`text-[20px] font-bold tabular-nums ${mod.avgAttendance >= 85 ? "text-status-present" : mod.avgAttendance >= 75 ? "text-status-late" : "text-status-absent"}`}>
              {mod.avgAttendance}%
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Attend.</p>
          </div>
          <div className="text-center">
            <p className={`text-[20px] font-bold tabular-nums ${mod.dnsRisk > 0 ? "text-status-absent" : "text-status-present"}`}>
              {mod.dnsRisk}
            </p>
            <p className="text-[10px] text-muted-foreground">DNS Risk</p>
          </div>
        </div>
      )}

      {/* Session progress */}
      {mod.status !== "draft" && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground">Sessions {mod.sessions} / {mod.totalSessions}</span>
            <span className="text-[11px] font-semibold text-foreground">{sessionPct}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${sessionPct}%` }} />
          </div>
        </div>
      )}

      {/* Draft notice */}
      {mod.status === "draft" && (
        <div className="px-5 pb-4">
          <p className="text-[12px] text-muted-foreground bg-background rounded-lg px-3 py-2 text-center">
            Module not yet activated. Students will be enrolled once live.
          </p>
        </div>
      )}

      {/* Assessments */}
      <div className="px-5 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground mb-2">Assessments</p>
        <div className="grid grid-cols-4 gap-1.5">
          {mod.assessments.map(a => <AssessmentPill key={a.label} a={a} />)}
        </div>
      </div>

      {/* DNS risk alert */}
      {mod.dnsRisk > 0 && (
        <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2 bg-status-absent-bg border border-status-absent-border rounded-lg">
          <AlertTriangle size={13} strokeWidth={2} className="text-status-absent flex-shrink-0" />
          <p className="text-[11px] text-status-absent font-medium">{mod.dnsRisk} student{mod.dnsRisk > 1 ? "s" : ""} at DNS risk</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto px-5 py-4 border-t border-border flex gap-2">
        {mod.status === "draft" ? (
          <Button variant="primary" size="sm" className="flex-1">Activate module</Button>
        ) : (
          <>
            <Button variant="outline" size="sm" icon={Award} className="flex-1">Marks</Button>
            <Button variant="primary" size="sm" icon={ChevronRight} iconPosition="right" className="flex-1">
              Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InstructorDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  const activeCount  = MY_MODULES.filter(m => m.status === "active").length;
  const totalStudents = MY_MODULES.reduce((a, m) => a + m.students, 0);
  const totalDns      = MY_MODULES.reduce((a, m) => a + m.dnsRisk, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>My Modules</h1>
          <p className="text-muted-foreground mt-0.5">
            {activeCount} active · {totalStudents} total students · Trimester 2
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" icon={BarChart2}>Reports</Button>
          <Button variant="primary" size="md" icon={Plus}>Request module</Button>
        </div>
      </div>

      {/* ── Summary KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Modules",  value: activeCount,    icon: BookOpen, color: "text-brand",          bg: "bg-brand-light" },
          { label: "Total Students",  value: totalStudents,  icon: Users,    color: "text-status-present", bg: "bg-status-present-bg" },
          { label: "DNS Risk Students", value: totalDns,     icon: AlertTriangle, color: "text-status-absent", bg: "bg-status-absent-bg" },
        ].map(c => {
          const CIcon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-[20px] border border-[#EAEFF7] shadow-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                <CIcon size={18} strokeWidth={1.75} className={c.color} />
              </div>
              <div>
                <p className="text-[24px] font-bold text-foreground tabular-nums">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Module cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MY_MODULES.map(m => <ModuleCard key={m.code} mod={m} />)}
      </div>

    </div>
  );
}