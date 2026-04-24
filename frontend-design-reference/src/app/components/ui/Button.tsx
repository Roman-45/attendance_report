import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ElementType;
  iconPosition?: "left" | "right";
  loading?: boolean;
  children?: React.ReactNode;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover active:scale-[0.97] focus-visible:outline-brand",
  secondary:
    "bg-brand-light text-brand hover:bg-[#dde6f5] active:scale-[0.97] focus-visible:outline-brand",
  outline:
    "border border-border bg-white text-foreground hover:bg-background hover:border-border-strong active:scale-[0.97] focus-visible:outline-brand",
  ghost:
    "text-foreground hover:bg-background active:scale-[0.97] focus-visible:outline-brand",
  destructive:
    "bg-destructive text-white hover:bg-[#b91c1c] active:scale-[0.97] focus-visible:outline-destructive",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5 rounded-md",
  md: "h-8 px-3.5 text-[13px] gap-2 rounded-md",
  lg: "h-10 px-5 text-[14px] gap-2 rounded-lg",
};

const iconSizes: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 15 };

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
        opacity="0.4"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-150 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap";

  const isDisabled = disabled || loading;
  const IconComponent = loading ? undefined : Icon;
  const iconEl = IconComponent ? (
    <IconComponent
      size={iconSizes[size]}
      strokeWidth={2}
      aria-hidden="true"
      className="flex-shrink-0"
    />
  ) : null;

  return (
    <button
      disabled={isDisabled}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size={iconSizes[size]} />}
      {!loading && iconEl && iconPosition === "left" && iconEl}
      {children && <span>{children}</span>}
      {!loading && iconEl && iconPosition === "right" && iconEl}
    </button>
  );
}