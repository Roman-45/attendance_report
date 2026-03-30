import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5] dark:border-[#4F46E5]/30 dark:bg-[#4F46E5]/15 dark:text-[#A5B4FC]",
        secondary:
          "border-[#E2E8F0] bg-[#F1F5F9] text-[#334155] dark:border-[#1E3A5F] dark:bg-[#1E293B] dark:text-[#CBD5E1]",
        destructive:
          "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] dark:border-[#DC2626]/30 dark:bg-[#DC2626]/15 dark:text-[#FCA5A5]",
        outline:
          "border-[#E2E8F0] bg-transparent text-[#334155] dark:border-[#1E3A5F] dark:text-[#CBD5E1]",
        success:
          "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] dark:border-[#059669]/30 dark:bg-[#059669]/15 dark:text-[#6EE7B7]",
        warning:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706] dark:border-[#D97706]/30 dark:bg-[#D97706]/15 dark:text-[#FCD34D]",
        info:
          "border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7] dark:border-[#0284C7]/30 dark:bg-[#0284C7]/15 dark:text-[#7DD3FC]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
