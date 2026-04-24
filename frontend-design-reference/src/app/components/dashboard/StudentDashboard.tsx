import React, { useState, useEffect } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle,
  Calendar, ChevronRight, BookOpen,
  TrendingUp, TrendingDown, Star,
  MapPin, Clock, ArrowRight,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

// ─── AUCA Grading scheme ──────────────────────────────────────────────────────
//
//  Each assessment is entered as a raw mark out of 100.
//  It then scales to its component weight:
//
//   CAT 1    → /100  scaled to  /20  (20% of module)
//   CAT 2    → /100  scaled to  /20  (20% of module)
//   Project  → /100  scaled to  /20  (20% of module)
//   Exam     → /100  scaled to  /40  (40% of module)
//   ─────────────────────────────────
//   Total possible course mark: 100
//

const DNS_THRESHOLD = 75; // student must attend ≥ 75% of sessions

const STUDENT_NAME = "Esther Ingabire";
const STUDENT_ID   = "S22005";

const OVERALL_ATTENDANCE = 91;
const SESSIONS_ATTENDED  = 41;
const SESSIONS_TOTAL     = 45;

interface AssessmentRecord {
  label: string;
  maxContribution: number;  // max marks for this component (20 or 40)
  rawScore: number | null;  // entered as /100; null = not yet graded
  scaledScore: number | null; // rawScore * maxContribution / 100
}

interface ModuleRecord {
  code: string;
  name: string;
  instructor: string;
  attendance: number;
  sessionsAttended: number;
  sessionsTotal: number;
  assessments: AssessmentRecord[];
  trend: "up" | "down" | "neutral";
}

// scaledScore = rawScore * maxContribution / 100
function mkAssessment(
  label: string,
  maxContribution: number,
  rawScore: number | null
): AssessmentRecord {
  return {
    label,
    maxContribution,
    rawScore,
    scaledScore: rawScore !== null
      ? Math.round(rawScore * maxContribution) / 100
      : null,
  };
}

const MY_MODULES: ModuleRecord[] = [
  {
    code: "CS101", name: "Introduction to Programming",
    instructor: "C. Mukamana",
    attendance: 93, sessionsAttended: 13, sessionsTotal: 14,
    trend: "up",
    assessments: [
      mkAssessment("CAT 1",   20, 84),
      mkAssessment("CAT 2",   20, null),
      mkAssessment("Project", 20, null),
      mkAssessment("Exam",    40, null),
    ],
  },
  {
    code: "CS202", name: "Data Structures & Algorithms",
    instructor: "B. Nkusi",
    attendance: 88, sessionsAttended: 11, sessionsTotal: 12,
    trend: "up",
    assessments: [
      mkAssessment("CAT 1",   20, 78),
      mkAssessment("CAT 2",   20, 81),
      mkAssessment("Project", 20, null),
      mkAssessment("Exam",    40, null),
    ],
  },
  {
    code: "CS303", name: "Algorithms & Complexity",
    instructor: "A. Uwimana",
    attendance: 79, sessionsAttended: 8, sessionsTotal: 10,
    trend: "down",
    assessments: [
      mkAssessment("CAT 1",   20, 70),
      mkAssessment("CAT 2",   20, null),
      mkAssessment("Project", 20, null),
      mkAssessment("Exam",    40, null),
    ],
  },
  {
    code: "CS606", name: "Operating Systems",
    instructor: "D. Habimana",
    attendance: 100, sessionsAttended: 3, sessionsTotal: 3,
    trend: "neutral",
    assessments: [
      mkAssessment("CAT 1",   20, null),
      mkAssessment("CAT 2",   20, null),
      mkAssessment("Project", 20, null),
      mkAssessment("Exam",    40, null),
    ],
  },
];

const UPCOMING_SESSIONS = [
  { day: "Today",     time: "14:00",  code: "CS202", name: "Data Structures",       room: "Room B3", urgent: true  },
  { day: "Today",     time: "16:30",  code: "CS303", name: "Algorithms",             room: "Room A2", urgent: false },
  { day: "Tomorrow",  time: "08:00",  code: "CS101", name: "Intro to Programming",   room: "Room A1", urgent: false },
  { day: "Wednesday", time: "10:00",  code: "CS606", name: "Operating Systems",      room: "Room C1", urgent: false },
];

// ─── DNS status (presence-focused) ───────────────────────────────────────────
//
//  Language rule: always call the student TO CLASS, never punish for absence.
//  Celebrate what they HAVE done; make the next step obvious.
//

function getAttendanceStatus(pct: number, attended: number, total: number) {
  // How many more sessions can be missed and still stay ≥ DNS_THRESHOLD
  const buffer = Math.floor(attended - total * (DNS_THRESHOLD / 100));

  if (pct >= 90) {
    return {
      level: "excellent" as const,
      icon: Star,
      iconColor: "text-status-present",
      bg: "bg-status-present-bg",
      border: "border-status-present-border",
      headline: `Outstanding — ${attended} sessions attended!`,
      body: `You've been present in ${pct}% of classes this term. Maintain this and you'll have no issues sitting your final exams.`,
      cta: null,
      bufferLabel: `${buffer} session${buffer !== 1 ? "s" : ""} of buffer`,
    };
  }
  if (pct >= 80) {
    return {
      level: "good" as const,
      icon: CheckCircle2,
      iconColor: "text-status-present",
      bg: "bg-status-present-bg",
      border: "border-status-present-border",
      headline: `Good attendance — ${attended} sessions attended`,
      body: `You're present in ${pct}% of classes and exam-eligible. Keep your momentum going — every session you attend counts toward your final grade too.`,
      cta: null,
      bufferLabel: `${buffer} session${buffer !== 1 ? "s" : ""} of buffer`,
    };
  }
  if (pct >= DNS_THRESHOLD) {
    return {
      level: "watch" as const,
      icon: CheckCircle2,
      iconColor: "text-status-late",
      bg: "bg-status-late-bg",
      border: "border-status-late-border",
      headline: `Attend your next classes to stay on track`,
      body: `You've attended ${attended} of ${total} sessions (${pct}%). You have a buffer of ${buffer} session${buffer !== 1 ? "s" : ""} — don't spend it all. Show up.`,
      cta: "View my upcoming schedule",
      bufferLabel: `${buffer} session${buffer !== 1 ? "s" : ""} remaining`,
    };
  }
  return {
    level: "critical" as const,
    icon: AlertTriangle,
    iconColor: "text-status-absent",
    bg: "bg-status-absent-bg",
    border: "border-status-absent-border",
    headline: `Come to every session from now on`,
    body: `You've attended ${attended} of ${total} sessions (${pct}%). To sit your final exams you need ≥ 75% attendance. Contact your team leader today and commit to every remaining class.`,
    cta: "Contact your team leader",
    bufferLabel: "DNS risk",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="space-y-2"><Sk className="h-6 w-48" /><Sk className="h-4 w-32" /></div>
      <Sk className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 space-y-3">
              <div className="flex gap-4"><div className="flex-1 space-y-2"><Sk className="h-4 w-16" /><Sk className="h-3 w-40" /></div></div>
              <Sk className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-4 gap-1.5">{[0,1,2,3].map(j => <Sk key={j} className="h-12 rounded-lg" />)}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Sk className="h-40 w-full rounded-xl" />
          <Sk className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Assessment tile ──────────────────────────────────────────────────────────

function AssessmentTile({ a }: { a: AssessmentRecord }) {
  const hasScore = a.rawScore !== null && a.scaledScore !== null;

  return (
    <div className={`flex flex-col items-center text-center gap-1 p-2 rounded-lg border transition-colors ${
      hasScore
        ? "bg-status-present-bg border-status-present-border"
        : "bg-background border-border"
    }`}>
      <p className="text-[10px] font-semibold text-muted-foreground">{a.label}</p>
      {hasScore ? (
        <>
          <p className="text-[13px] font-bold text-foreground tabular-nums leading-none">
            {a.rawScore}<span className="text-[10px] text-muted-foreground font-normal">/100</span>
          </p>
          <p className="text-[10px] text-status-present font-semibold tabular-nums">
            {a.scaledScore!.toFixed(1)}<span className="text-muted-foreground font-normal">/{a.maxContribution}</span>
          </p>
        </>
      ) : (
        <p className="text-[11px] text-subtle-foreground mt-0.5">
          —/{a.maxContribution}
        </p>
      )}
    </div>
  );
}

// ─── Module row ───────────────────────────────────────────────────────────────

function ModuleRow({ mod }: { mod: ModuleRecord }) {
  const TrendIcon = mod.trend === "up" ? TrendingUp : mod.trend === "down" ? TrendingDown : null;
  const trendColor = mod.trend === "up" ? "text-status-present" : mod.trend === "down" ? "text-status-absent" : "";

  // Running total of marks earned vs marks possible from graded assessments
  const gradedAssessments = mod.assessments.filter(a => a.scaledScore !== null);
  const earned   = gradedAssessments.reduce((s, a) => s + (a.scaledScore ?? 0), 0);
  const possible = gradedAssessments.reduce((s, a) => s + a.maxContribution, 0);
  const remaining = mod.assessments.filter(a => a.scaledScore === null)
    .reduce((s, a) => s + a.maxContribution, 0);

  return (
    <div className="bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold font-mono text-brand">{mod.code}</span>
            {TrendIcon && <TrendIcon size={11} strokeWidth={2.5} className={trendColor} />}
          </div>
          <p className="text-[13px] font-semibold text-foreground truncate">{mod.name}</p>
          <p className="text-[11px] text-muted-foreground">{mod.instructor}</p>
        </div>
        {/* Current marks summary */}
        {possible > 0 && (
          <div className="flex-shrink-0 text-right">
            <p className="text-[18px] font-bold text-foreground tabular-nums leading-none">
              {earned.toFixed(1)}<span className="text-[12px] text-muted-foreground font-normal">/{possible}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">pts earned</p>
            {remaining > 0 && (
              <p className="text-[10px] text-subtle-foreground">{remaining} pts pending</p>
            )}
          </div>
        )}
      </div>

      {/* Attendance bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">
            Attendance · {mod.sessionsAttended}/{mod.sessionsTotal} sessions present
          </span>
          <span className={`text-[11px] font-semibold ${
            mod.attendance >= 85 ? "text-status-present"
            : mod.attendance >= DNS_THRESHOLD ? "text-status-late"
            : "text-status-absent"
          }`}>
            {mod.attendance}%
          </span>
        </div>
        <div className="relative h-1.5 bg-border rounded-full overflow-visible">
          <div
            className="absolute top-0 w-px h-1.5 bg-status-late/50 z-10"
            style={{ left: `${DNS_THRESHOLD}%` }}
            title="75% minimum"
          />
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              mod.attendance >= 85 ? "bg-status-present"
              : mod.attendance >= DNS_THRESHOLD ? "bg-status-late"
              : "bg-status-absent"
            }`}
            style={{ width: `${mod.attendance}%` }}
          />
        </div>
      </div>

      {/* Assessment tiles — 4-column AUCA scheme */}
      <div className="grid grid-cols-4 gap-1.5">
        {mod.assessments.map(a => <AssessmentTile key={a.label} a={a} />)}
      </div>

      {/* Running total bar (only when some graded) */}
      {possible > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${(earned / 100) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground flex-shrink-0 tabular-nums">
            <span className="font-semibold text-foreground">{earned.toFixed(1)}</span> / 100 so far
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonDashboard />;

  const att = getAttendanceStatus(OVERALL_ATTENDANCE, SESSIONS_ATTENDED, SESSIONS_TOTAL);
  const AttIcon = att.icon;

  // Aggregate marks across all modules (graded assessments only)
  const allGraded = MY_MODULES.flatMap(m => m.assessments.filter(a => a.scaledScore !== null));
  const totalEarned   = allGraded.reduce((s, a) => s + (a.scaledScore ?? 0), 0);
  const totalPossible = allGraded.reduce((s, a) => s + a.maxContribution, 0);

  const nextSession = UPCOMING_SESSIONS[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1>Welcome back, {STUDENT_NAME.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-0.5">
            Trimester 2 · 2025/26 · <span className="font-mono">{STUDENT_ID}</span>
          </p>
        </div>
        {/* Next session callout */}
        {nextSession && (
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[12px] font-medium ${
            nextSession.urgent
              ? "bg-status-late-bg border-status-late-border text-status-late"
              : "bg-brand-light border-brand/20 text-brand"
          }`}>
            <Clock size={13} strokeWidth={2} />
            <span>
              Next: <span className="font-mono font-bold">{nextSession.code}</span>
              {" "}today at {nextSession.time} · {nextSession.room}
            </span>
          </div>
        )}
      </div>

      {/* ── ATTENDANCE CARD — presence-focused, visible in < 1 second ─────── */}
      <div className={`rounded-xl border-2 ${att.border} ${att.bg} p-5`}>
        <div className="flex items-start gap-4 flex-wrap">

          {/* Icon + text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${att.bg} border ${att.border}`}>
              <AttIcon size={18} strokeWidth={2} className={att.iconColor} />
            </div>
            <div className="min-w-0">
              <p className={`text-[15px] font-bold ${att.iconColor}`}>{att.headline}</p>
              <p className="text-[13px] text-foreground mt-0.5 leading-relaxed">{att.body}</p>
              {att.cta && (
                <button className={`mt-2 flex items-center gap-1 text-[12px] font-semibold ${att.iconColor} hover:opacity-80 transition-opacity`}>
                  {att.cta} <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Big number */}
          <div className="flex-shrink-0 text-right">
            <p className={`text-[40px] font-bold tabular-nums leading-none ${att.iconColor}`}>
              {OVERALL_ATTENDANCE}%
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {SESSIONS_ATTENDED} / {SESSIONS_TOTAL} sessions
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${att.iconColor}`}>{att.bufferLabel}</p>
          </div>
        </div>

        {/* Progress bar — framed as "sessions present" filling toward 100% */}
        <div className="mt-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Sessions attended →</span>
            <span className="text-[11px] text-muted-foreground">75% exam minimum</span>
          </div>
          <div className="relative h-3 bg-white/60 rounded-full overflow-visible border border-white/40">
            {/* DNS minimum marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-status-late z-10"
              style={{ left: `${DNS_THRESHOLD}%` }}
            />
            {/* Progress fill = attended sessions */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                att.level === "excellent" || att.level === "good"
                  ? "bg-status-present"
                  : att.level === "watch" ? "bg-status-late"
                  : "bg-status-absent"
              }`}
              style={{ width: `${OVERALL_ATTENDANCE}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-subtle-foreground">0 sessions</span>
            <span className="text-[10px] text-status-late font-medium">{DNS_THRESHOLD}%</span>
            <span className="text-[10px] text-subtle-foreground">{SESSIONS_TOTAL} sessions</span>
          </div>
        </div>
      </div>

      {/* ── Content grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Module list */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Modules ({MY_MODULES.length})
            </p>
            {totalPossible > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] bg-background border border-border rounded-md px-2 py-1 tabular-nums">
                <span className="text-muted-foreground">Total earned</span>
                <span className="font-bold text-foreground">{totalEarned.toFixed(1)}</span>
                <span className="text-subtle-foreground">/ {totalPossible} assessed</span>
              </div>
            )}
          </div>
          {MY_MODULES.map(m => <ModuleRow key={m.code} mod={m} />)}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Quick stats — module count + marks earned */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Modules",
                value: MY_MODULES.length.toString(),
                icon: BookOpen,
                color: "text-brand",
                bg: "bg-brand-light",
              },
              {
                label: totalPossible > 0 ? `${totalPossible} pts graded` : "Marks pending",
                value: totalPossible > 0 ? totalEarned.toFixed(1) : "—",
                icon: Star,
                color: "text-status-present",
                bg: "bg-status-present-bg",
              },
            ].map(c => {
              const CIcon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-xl border border-border shadow-card p-4 flex flex-col gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <CIcon size={14} strokeWidth={2} className={c.color} />
                  </div>
                  <p className="text-[22px] font-bold text-foreground tabular-nums leading-none">{c.value}</p>
                  <p className="text-[11px] text-muted-foreground">{c.label}</p>
                </div>
              );
            })}
          </div>

          {/* Upcoming sessions */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Upcoming Classes</p>
              <Calendar size={14} strokeWidth={1.75} className="text-muted-foreground" />
            </div>
            <div className="divide-y divide-border">
              {UPCOMING_SESSIONS.map((s, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-background ${
                    s.urgent ? "bg-status-late-bg/30" : ""
                  }`}
                >
                  {/* Time column */}
                  <div className="flex-shrink-0 text-center min-w-[44px]">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none">{s.day.slice(0, 3)}</p>
                    <p className="text-[12px] font-bold text-foreground mt-0.5">{s.time}</p>
                  </div>
                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-brand">{s.code}</span>
                      {s.urgent && (
                        <Badge variant="warning" size="sm" dot>Up next</Badge>
                      )}
                    </div>
                    <p className="text-[12px] font-medium text-foreground truncate">{s.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <MapPin size={10} strokeWidth={2} className="flex-shrink-0" />
                      {s.room}
                    </p>
                  </div>
                  <ChevronRight size={13} strokeWidth={2} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <button className="text-[12px] text-brand hover:text-brand-hover font-medium transition-colors">
                View full schedule →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
