import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-[#4F46E5] text-white shadow-[0_1px_2px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] hover:shadow-[0_2px_6px_rgba(79,70,229,0.3)]",
        destructive:
          "rounded-full bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C]",
        outline:
          "rounded-full border border-[#E2E8F0] bg-transparent text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]",
        secondary:
          "rounded-full bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:bg-[#334155]",
        ghost:
          "rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]",
        link:
          "rounded-full text-[#4F46E5] underline-offset-4 hover:underline dark:text-[#818CF8]",
        success:
          "rounded-full bg-[#059669] text-white shadow-sm hover:bg-[#047857]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
        xs: "h-7 px-3 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
