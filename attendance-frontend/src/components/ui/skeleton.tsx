import { cn } from '@/lib/utils'
import { TableRow, TableCell } from '@/components/ui/table'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-muted w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded bg-muted w-1/3" />
          <div className="h-7 rounded bg-muted w-1/4" />
        </div>
        <div className="h-10 w-10 rounded-full bg-muted" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonRow, SkeletonCard }
