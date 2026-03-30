import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface YearPickerProps {
  value: number
  onChange: (year: number) => void
  minYear?: number
  maxYear?: number
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function YearPicker({
  value,
  onChange,
  minYear = 1990,
  maxYear = new Date().getFullYear() + 5,
  disabled = false,
  placeholder = "Select year",
  className,
}: YearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  const years = React.useMemo(() => {
    const arr: number[] = []
    for (let y = maxYear; y >= minYear; y--) arr.push(y)
    return arr
  }, [minYear, maxYear])

  // Auto-scroll the selected year into view when the picker opens
  React.useEffect(() => {
    if (open && selectedRef.current) {
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" })
      }, 30)
    }
  }, [open])

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm transition-all duration-150",
            "hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/20 focus-visible:border-[#4F46E5]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-[#1E3A5F] dark:bg-[#111827] dark:hover:border-[#334155]",
            !value && "text-[#94A3B8]",
            className
          )}
        >
          <span>{value || placeholder}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#94A3B8] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]",
            "dark:border-[#1E3A5F] dark:bg-[#111827]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          {/* Scrollable year list — max 5 items visible */}
          <div className="max-h-52 overflow-y-auto py-1">
            {years.map((year) => {
              const isSelected = year === value
              return (
                <button
                  key={year}
                  ref={isSelected ? selectedRef : undefined}
                  type="button"
                  onClick={() => {
                    onChange(year)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-100",
                    isSelected
                      ? "bg-[#4F46E5] text-white font-semibold"
                      : "text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]"
                  )}
                >
                  <span>{year}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
