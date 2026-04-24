import React from "react";
import { TrendingUp, TrendingDown, Minus, Users, BarChart2, BookOpen } from "lucide-react";
import { DnsRiskBadge } from "./Badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KPIVariant = "default" | "success" | "warning" | "danger" | "info";
export type TrendDirection = "up" | "down" | "neutral";

export interface KPICardProps {
  /** Short uppercase label above the value */
  title: string;
  /** The primary metric — displayed large */
  value: string | number;
  /** Descriptive trend line, e.g. "8 enrolled this week" */
  trend?: string;
  /** Arrow direction that colours the trend line */
  trendDirection?: TrendDirection;
  /** Lucide icon rendered in the top-right icon box */
  icon?: React.ElementType;
  /**
   * Colour variant — affects icon box tint and value colour for danger/warning.
   * `default` = brand navy tint.
   */
  variant?: KPIVariant;
  /** Optional badge overlaid in the top-right corner (replaces icon) */
  badge?: React.ReactNode;
  /** Override card width / margin etc. */
  className?: string;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const iconBoxStyles: Record<KPIVariant, string> = {
  default: "bg-brand-light text-brand",
  success: "bg-status-present-bg text-status-present",
  warning: "bg-status-late-bg text-status-late",
  danger:  "bg-status-absent-bg text-status-absent",
  info:    "bg-status-excused-bg text-status-excused",
};

// Value colour — danger/warning get tinted for urgency; others stay foreground
const valueStyles: Record<KPIVariant, string> = {
  default: "text-foreground",
  success: "text-foreground",
  warning: "text-status-late",
  danger:  "text-status-absent",
  info:    "text-foreground",
};

const trendStyles: Record<TrendDirection, string> = {
  up:      "text-status-present",
  down:    "text-status-absent",
  neutral: "text-muted-foreground",
};

const TrendIcon: Record<TrendDirection, React.ElementType> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KPICard({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon: Icon,
  variant = "default",
  badge,
  className = "",
}: KPICardProps) {
  const TIcon = TrendIcon[trendDirection];

  return (
    <div
      className={[
        // Shape & surface
        "relative bg-white rounded-[20px] border border-[#EAEFF7]",
        // Shadow — low elevation, subtle blur
        "shadow-card",
        // Hover — slight lift + deeper shadow
        "hover:shadow-card-hover hover:-translate-y-0.5",
        // Transition
        "transition-all duration-200 ease-out",
        // Spacing
        "p-5",
        // Allow content to stack
        "flex flex-col gap-3",
        className,
      ].join(" ")}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mt-0.5">
          {title}
        </span>

        {/* Right slot: badge overrides icon */}
        {badge ? (
          <div className="flex-shrink-0">{badge}</div>
        ) : Icon ? (
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconBoxStyles[variant]}`}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
          </div>
        ) : null}
      </div>

      {/* ── Value ── */}
      <div className="leading-none">
        <span
          className={`text-[32px] font-bold tabular-nums tracking-tight ${valueStyles[variant]}`}
        >
          {value}
        </span>
      </div>

      {/* ── Trend ── */}
      {trend && (
        <div
          className={`flex items-center gap-1.5 text-[12px] font-medium ${trendStyles[trendDirection]}`}
        >
          <TIcon size={13} strokeWidth={2.5} aria-hidden="true" className="flex-shrink-0" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ─── Pre-built AUCA KPI cards ────────────────────────────────────────────────
// Convenience exports so screens can drop them in without wiring props manually.

export function TotalStudentsCard({
  value = "312",
  trend = "8 enrolled this week",
}: {
  value?: string;
  trend?: string;
}) {
  return (
    <KPICard
      title="Total Students"
      value={value}
      trend={trend}
      trendDirection="up"
      icon={Users}
      variant="default"
    />
  );
}

export function AvgAttendanceCard({
  value = "87%",
  trend = "2.4% vs last month",
}: {
  value?: string;
  trend?: string;
}) {
  return (
    <KPICard
      title="Avg Attendance"
      value={value}
      trend={trend}
      trendDirection="down"
      icon={BarChart2}
      variant="default"
    />
  );
}

export function ActiveModulesCard({
  value = "14",
  trend = "3 opened this term",
}: {
  value?: string;
  trend?: string;
}) {
  return (
    <KPICard
      title="Active Modules"
      value={value}
      trend={trend}
      trendDirection="up"
      icon={BookOpen}
      variant="success"
    />
  );
}

export function DnsRiskCard({
  value = "7",
  trend = "students ≥ 25% absent",
}: {
  value?: string;
  trend?: string;
}) {
  return (
    <KPICard
      title="DNS Risk"
      value={value}
      trend={trend}
      trendDirection="down"
      variant="danger"
      badge={<DnsRiskBadge size="sm" />}
    />
  );
}