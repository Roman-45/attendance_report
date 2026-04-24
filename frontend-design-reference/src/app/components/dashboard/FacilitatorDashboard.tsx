import React, { useState, useEffect } from "react";
import {
  Calendar, ClipboardCheck, CheckCircle2, Clock, AlertCircle,
  Users, ChevronRight, BarChart2, Zap,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar, getInitials } from "../ui/Avatar";

// ─── Mock data ────────────────────────────────────────────────────────────────

type SessionStatus = "submitted" | "in-progress" | "upcoming" | "missed";

const TODAY_SESSIONS = [
  {
    id: "s1",
    code: "CS101",
    name: "Introduction to Programming",
    time: "08:00 – 10:00",
    room: "Room A1",
    students: 40,
    marked: 40,
    status: "submitted" as SessionStatus,
  },
  {
    id: "s2",
    code: "CS202",
    name: "Data Structures",
    time: "14:00 – 16:00",
    room: "Room B3",
    students: 38,
    marked: 31,
    status: "in-progress" as SessionStatus,
  },
  {
    id: "s3",
    code: "CS303",
    name: "Algorithms & Complexity",
    time: "16:30 – 18:00",
    room: "Room A2",
    students: 35,
    marked: 0,
    status: "upcoming" as SessionStatus,
  },
];

const RECENT_SESSIONS = [
  { date: "Mon 14 Apr", code: "CS101", room: "Room A1", students: 40, present: 38, status: "submitted" as SessionStatus },
  { date: "Mon 14 Apr", code: "CS202", room: "Room B3", students: 38, present: 35, status: "submitted" as SessionStatus },
  { date: "Fri 11 Apr", code: "CS101", room: "Room A1", students: 40, present: 39, status: "submitted" as SessionStatus },
  { date: "Fri 11 Apr", code: "CS303", room: "Room A2", students: 35, present: 30, status: "submitted" as SessionStatus },
  { date: "Thu 10 Apr", code: "CS202", room: "Room B3", students: 38, present: 36, status: "submitted" as SessionStatus },
];

// ─── Status configs ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; icon: React.ElementType; textColor: string; bgColor: string; borderColor: string; badgeVariant: "success" | "warning" | "info" | "neutral" }> = {
  "submitted":   { label: "Submitted",   icon: CheckCircle2, textColor: "text-status-present", bgColor: "bg-status-present-bg", borderColor: "border-status-present-border", badgeVariant: "success" },
  "in-progress": { label: "In Progress", icon: Clock,        textColor: "text-status-late",    bgColor: "bg-status-late-bg",    borderColor: "border-status-late-border",    badgeVariant: "warning" },
  "upcoming":    { label: "Upcoming",    icon: Calendar,     textColor: "text-status-excused", bgColor: "bg-status-excused-bg", borderColor: "border-status-excused-border", badgeVariant: "info"    },
  "missed":      { label: "Missed",      icon: AlertCircle,  textColor: "text-status-absent",  bgColor: "bg-status-absent-bg",  borderColor: "border-status-absent-border",  badgeVariant: "neutral" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Sk className="h-6 w-36" /><Sk className="h-4 w-52" /></div>
        <Sk className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="bg-white rounded-[20px] border border-border p-5 space-y-3"><Sk className="h-3 w-24" /><Sk className="h-9 w-12" /><Sk className="h-3 w-28" /></div>)}
      </div>
      <div className="space-y-3">
        {[0,1,2].map(i => <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3"><Sk className="h-4 w-32" /><Sk className="h-3 w-48" /><Sk className="h-2 w-full rounded-full" /></div>)}
      </div>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: typeof TODAY_SESSIONS[number] }) {
  const cfg = STATUS_CONFIG[session.status];
  const Icon = cfg.icon;
  const pct = session.students > 0 ? Math.round((session.marked / session.students) * 100) : 0;

  return (
    <div className={`bg-white rounded-xl border shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden ${cfg.borderColor}`}>
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${cfg.bgColor}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-bold font-mono text-foreground">{session.code}</span>
          <span className="text-[11px] text-muted-foreground">{session.time}</span>
        </div>
        <Badge variant={cfg.badgeVariant} size="sm" icon={Icon}>
          {cfg.label}
        </Badge>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground truncate">{session.name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Users size={12} strokeWidth={2} />
              {session.students} students
            </span>
            <span className="text-[12px] text-muted-foreground">{session.room}</span>
          </div>

          {/* Progress bar */}
          {session.status !== "upcoming" && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">Marked {session.marked} / {session.students}</span>
                <span className={`text-[11px] font-semibold ${cfg.textColor}`}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    session.status === "submitted" ? "bg-status-present" : "bg-status-late"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          {session.status === "in-progress" && (
            <Button variant="primary" size="sm" icon={Zap}>
              Continue
            </Button>
          )}
          {session.status === "upcoming" && (
            <Button variant="outline" size="sm" icon={ClipboardCheck}>
              Start
            </Button>
          )}
          {session.status === "submitted" && (
            <Button variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FacilitatorDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  const submitted   = TODAY_SESSIONS.filter(s => s.status === "submitted").length;
  const pending     = TODAY_SESSIONS.filter(s => s.status === "in-progress" || s.status === "upcoming").length;
  const totalMarked = TODAY_SESSIONS.reduce((a, s) => a + s.marked, 0);
  const totalStudents = TODAY_SESSIONS.reduce((a, s) => a + s.students, 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Sessions</h1>
          <p className="text-muted-foreground mt-0.5">
            Today — Tuesday, 15 April 2026
          </p>
        </div>
        <Button variant="primary" size="md" icon={ClipboardCheck}>
          Take attendance
        </Button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Sessions", value: TODAY_SESSIONS.length, icon: Calendar,      color: "text-brand",          bg: "bg-brand-light",        sub: "Scheduled"         },
          { label: "Submitted",        value: submitted,             icon: CheckCircle2,   color: "text-status-present", bg: "bg-status-present-bg",  sub: "Attendance locked" },
          { label: "Pending",          value: pending,               icon: Clock,          color: "text-status-late",    bg: "bg-status-late-bg",     sub: "Action needed"     },
          { label: "Students Marked",  value: totalMarked,           icon: Users,          color: "text-status-excused", bg: "bg-status-excused-bg",  sub: `of ${totalStudents} total` },
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

      {/* ── Today's sessions ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Today's Schedule
        </p>
        <div className="space-y-3">
          {TODAY_SESSIONS.map(s => <SessionCard key={s.id} session={s} />)}
        </div>
      </div>

      {/* ── Recent sessions table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[13px] font-semibold text-foreground">Session History</p>
          <Button variant="ghost" size="sm" icon={BarChart2} iconPosition="right">Full report</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Date", "Module", "Room", "Present / Total", "Rate", "Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_SESSIONS.map((s, i) => {
                const rate = Math.round((s.present / s.students) * 100);
                const cfg = STATUS_CONFIG[s.status];
                const Icon = cfg.icon;
                return (
                  <tr key={i} className={`border-b border-border last:border-0 hover:bg-background transition-colors ${i % 2 !== 0 ? "bg-[#FAFBFD]" : ""}`}>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-brand text-[12px]">{s.code}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{s.room}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className="text-status-present font-semibold">{s.present}</span>
                      <span className="text-muted-foreground"> / {s.students}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`tabular-nums font-semibold text-[12px] ${rate >= 90 ? "text-status-present" : rate >= 75 ? "text-status-late" : "text-status-absent"}`}>
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={cfg.badgeVariant} size="sm" icon={Icon}>{cfg.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
