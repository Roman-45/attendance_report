import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm ring-offset-background transition-all duration-150",
          "placeholder:text-[#94A3B8]",
          "hover:border-[#CBD5E1]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/20 focus-visible:ring-offset-0 focus-visible:border-[#4F46E5]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-[#1E3A5F] dark:bg-[#111827] dark:placeholder:text-[#64748B] dark:hover:border-[#334155] dark:focus-visible:border-[#4F46E5] dark:focus-visible:ring-[#4F46E5]/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
