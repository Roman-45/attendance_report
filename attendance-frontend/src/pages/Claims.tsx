import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Claim, ClaimStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MessageSquareWarning, CheckCircle2, XCircle, Clock, AlertTriangle, BookOpen, GraduationCap, Grid3X3 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  { key: 'ALL', label: 'All', icon: MessageSquareWarning },
]

const statusConfig: Record<ClaimStatus, { badge: string; icon: typeof Clock; stripeColor: string }> = {
  PENDING: {
    badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] dark:bg-[#D97706]/20 dark:text-[#D97706] dark:border-[#D97706]/40',
    icon: Clock,
    stripeColor: 'bg-[#D97706]',
  },
  APPROVED: {
    badge: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] dark:bg-[#059669]/20 dark:text-[#059669] dark:border-[#059669]/40',
    icon: CheckCircle2,
    stripeColor: 'bg-[#059669]',
  },
  REJECTED: {
    badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] dark:bg-[#DC2626]/20 dark:text-[#DC2626] dark:border-[#DC2626]/40',
    icon: XCircle,
    stripeColor: 'bg-[#DC2626]',
  },
}

const typeConfig: Record<string, { icon: typeof BookOpen; color: string; label: string }> = {
  ATTENDANCE: { icon: BookOpen, color: 'text-[#4F46E5] dark:text-[#818CF8] bg-[#EEF2FF] dark:bg-[#4F46E5]/20', label: 'Attendance' },
  MARK: { icon: GraduationCap, color: 'text-[#7C3AED] dark:text-[#A78BFA] bg-[#F5F3FF] dark:bg-[#7C3AED]/20', label: 'Mark / Grade' },
  SEAT: { icon: Grid3X3, color: 'text-[#0D9488] dark:text-[#2DD4BF] bg-[#F0FDFA] dark:bg-[#0D9488]/20', label: 'Seating' },
}

export default function Claims() {
  const [filter, setFilter] = useState('PENDING')
  const [page, setPage] = useState(0)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [resolution, setResolution] = useState({ status: '' as '' | ClaimStatus, note: '' })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-claims', filter, page],
    queryFn: () =>
      client.get('/claims/pending', { params: { page, size: 20 } })
        .then(r => r.data.data),
  })

  const claims: Claim[] = data?.content ?? []
  const totalPages: number = data?.totalPages ?? 1

  const resolveMutation = useMutation({
    mutationFn: () => client.put(`/claims/${selectedClaim!.id}/resolve`, {
      status: resolution.status,
      resolutionNote: resolution.note || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] })
      setResolveOpen(false)
      toast({ title: 'Claim resolved' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const openResolve = (claim: Claim) => {
    setSelectedClaim(claim)
    setResolution({ status: '', note: '' })
    setResolveOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Claims</h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Review and resolve student dispute requests</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_FILTERS.map(f => {
          const count = f.key === 'ALL' ? claims.length : claims.filter(c => c.status === f.key).length
          const FilterIcon = f.icon
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(0) }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                isActive
                  ? "border-[#4F46E5] bg-[#EEF2FF] dark:bg-[#4F46E5]/10 shadow-sm"
                  : "border-transparent bg-[#F1F5F9]/60 dark:bg-[#1E293B]/60 hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] hover:border-[#E2E8F0] dark:hover:border-[#1E3A5F]",
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                isActive
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]",
              )}>
                <FilterIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{count}</p>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium uppercase tracking-wider">{f.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Claims list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                  <div className="h-3 w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No claims found</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              {filter === 'PENDING' ? 'All caught up! No pending claims to review.' : `No ${filter.toLowerCase()} claims.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const status = statusConfig[claim.status]
            const type = typeConfig[claim.claimType] || typeConfig.ATTENDANCE
            const StatusIcon = status.icon
            const TypeIcon = type.icon

            return (
              <Card
                key={claim.id}
                className="group hover:shadow-md transition-all overflow-hidden border-[#E2E8F0] dark:border-[#1E3A5F]"
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Status indicator stripe */}
                    <div className={cn("w-1 shrink-0", status.stripeColor)} />

                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", type.color)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm text-[#0F172A] dark:text-[#F1F5F9]">{claim.studentName}</span>
                            <span className="text-xs text-[#94A3B8]">&middot;</span>
                            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{claim.moduleName}</span>
                          </div>

                          <p className="text-sm text-[#334155] dark:text-[#94A3B8] line-clamp-2 mb-2">
                            {claim.description}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("text-[10px] gap-1", status.badge)}>
                              <StatusIcon className="h-3 w-3" />
                              {claim.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8]">{type.label}</Badge>
                            <span className="text-[10px] text-[#94A3B8]">
                              {format(new Date(claim.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>

                          {/* Resolution note */}
                          {claim.resolutionNote && (
                            <div className="mt-2 px-3 py-2 rounded-md bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#1E3A5F] text-xs text-[#64748B] dark:text-[#94A3B8]">
                              <span className="font-medium text-[#334155] dark:text-[#F1F5F9]">Resolution:</span> {claim.resolutionNote}
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        {claim.status === 'PENDING' && (
                          <Button
                            variant="outline" size="sm"
                            className="shrink-0 shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
                            onClick={() => openResolve(claim)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F46E5]/20 flex items-center justify-center">
                <MessageSquareWarning className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Resolve Claim
            </DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              {/* Claim summary */}
              <div className="rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#1E3A5F] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8]">{typeConfig[selectedClaim.claimType]?.label || selectedClaim.claimType}</Badge>
                  <span className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">{selectedClaim.studentName}</span>
                  <span className="text-xs text-[#94A3B8]">&middot; {selectedClaim.moduleName}</span>
                </div>
                <p className="text-sm leading-relaxed text-[#334155] dark:text-[#94A3B8]">{selectedClaim.description}</p>
              </div>

              {/* Decision */}
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Decision</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolution(r => ({ ...r, status: 'APPROVED' }))}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium text-sm",
                      resolution.status === 'APPROVED'
                        ? "border-[#059669] bg-[#ECFDF5] dark:bg-[#059669]/20 text-[#059669]"
                        : "border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#A7F3D0] text-[#64748B] dark:text-[#94A3B8] hover:text-[#059669]",
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => setResolution(r => ({ ...r, status: 'REJECTED' }))}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium text-sm",
                      resolution.status === 'REJECTED'
                        ? "border-[#DC2626] bg-[#FEF2F2] dark:bg-[#DC2626]/20 text-[#DC2626]"
                        : "border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#FECACA] text-[#64748B] dark:text-[#94A3B8] hover:text-[#DC2626]",
                    )}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Resolution Note (optional)</Label>
                <Textarea
                  value={resolution.note}
                  onChange={(e) => setResolution(r => ({ ...r, note: e.target.value }))}
                  placeholder="Explain your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => resolveMutation.mutate()}
              disabled={!resolution.status || resolveMutation.isPending}
              className={cn(
                resolution.status === 'APPROVED' && "bg-[#059669] hover:bg-[#047857] text-white border-transparent",
                resolution.status === 'REJECTED' && "bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent",
                !resolution.status && "bg-[#4F46E5] hover:bg-[#4338CA] text-white border-transparent",
              )}
            >
              {resolveMutation.isPending
                ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Resolving...
                  </span>
                )
                : resolution.status === 'APPROVED'
                  ? 'Approve Claim'
                  : resolution.status === 'REJECTED'
                    ? 'Reject Claim'
                    : 'Submit Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
