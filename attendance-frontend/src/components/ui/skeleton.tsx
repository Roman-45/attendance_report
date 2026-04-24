import { cn } from '@/lib/utils'
import { TableRow, TableCell } from '@/components/ui/table'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B]', className)}
      {...props}
    />
  )
}

function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] w-1/3" />
          <div className="h-7 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] w-1/4" />
        </div>
        <div className="h-10 w-10 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B]" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonRow, SkeletonCard }
