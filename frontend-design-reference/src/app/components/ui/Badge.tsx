import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  CheckCheck,
  Circle,
  Lock,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type ModuleStatus = "draft" | "active" | "closed";
export type InvitationStatus = "pending" | "accepted";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  icon?: React.ElementType;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, string> = {
  success:
    "text-status-present bg-status-present-bg border-status-present-border",
  warning:
    "text-status-late bg-status-late-bg border-status-late-border",
  danger:
    "text-status-absent bg-status-absent-bg border-status-absent-border",
  info:
    "text-status-excused bg-status-excused-bg border-status-excused-border",
  neutral:
    "text-status-draft bg-status-draft-bg border-status-draft-border",
  brand:
    "text-brand bg-brand-light border-brand/20",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-[11px] gap-1 rounded",
  md: "px-2 py-0.5 text-[12px] gap-1.5 rounded-md",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-status-present",
  warning: "bg-status-late",
  danger:  "bg-status-absent",
  info:    "bg-status-excused",
  neutral: "bg-status-draft",
  brand:   "bg-brand",
};

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({
  variant = "neutral",
  size = "md",
  icon: Icon,
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  const iconSize = size === "sm" ? 10 : 12;
  return (
    <span
      className={`inline-flex items-center border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {!dot && Icon && (
        <Icon size={iconSize} strokeWidth={2.5} aria-hidden="true" className="flex-shrink-0" />
      )}
      {children}
    </span>
  );
}

// ─── Status badge presets ─────────────────────────────────────────────────────
// Convenience wrappers that map domain status strings to Badge variants.

const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  present:  { label: "Present",  icon: CheckCircle2, variant: "success" },
  absent:   { label: "Absent",   icon: XCircle,      variant: "danger"  },
  late:     { label: "Late",     icon: Clock,        variant: "warning" },
  excused:  { label: "Excused",  icon: BookOpen,     variant: "info"    },
};

const MODULE_CONFIG: Record<
  ModuleStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  draft:   { label: "Draft",   icon: Circle,   variant: "neutral" },
  active:  { label: "Active",  icon: CheckCircle2, variant: "success" },
  closed:  { label: "Closed",  icon: Lock,     variant: "neutral" },
};

const INVITATION_CONFIG: Record<
  InvitationStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  pending:  { label: "Pending",  icon: Clock,      variant: "warning" },
  accepted: { label: "Accepted", icon: CheckCheck, variant: "success" },
};

export function AttendanceBadge({
  status,
  size = "md",
}: {
  status: AttendanceStatus;
  size?: "sm" | "md";
}) {
  const cfg = ATTENDANCE_CONFIG[status];
  return (
    <Badge variant={cfg.variant} size={size} icon={cfg.icon}>
      {cfg.label}
    </Badge>
  );
}

export function ModuleBadge({
  status,
  size = "md",
}: {
  status: ModuleStatus;
  size?: "sm" | "md";
}) {
  const cfg = MODULE_CONFIG[status];
  return (
    <Badge variant={cfg.variant} size={size} icon={cfg.icon}>
      {cfg.label}
    </Badge>
  );
}

export function InvitationBadge({
  status,
  size = "md",
}: {
  status: InvitationStatus;
  size?: "sm" | "md";
}) {
  const cfg = INVITATION_CONFIG[status];
  return (
    <Badge variant={cfg.variant} size={size} icon={cfg.icon}>
      {cfg.label}
    </Badge>
  );
}

export function DnsRiskBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Badge variant="danger" size={size} icon={AlertTriangle}>
      DNS Risk
    </Badge>
  );
}
