// Notification Center — ported from frontend-design-reference/src/app/components/shared/NotificationCenter.tsx
//
// Wires the live backend:
//   GET /notifications?page=&size=        paginated list
//   PATCH /notifications/:id/read         mark one read
//   PATCH /notifications/read-all         mark all read
//   GET /notifications/stream             SSE → invalidate queries (via useNotificationStream)
//
// Notification types observed in the backend (CONSECUTIVE_ABSENCE, THRESHOLD_ALERT,
// etc.) are mapped to the design-reference visual buckets (attendance / dns / marks
// / claim / invite / system).
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardCheck,
  AlertTriangle,
  Users,
  Bell,
  CheckCheck,
  MessageSquare,
  Settings,
  BarChart2,
} from 'lucide-react'
import { formatDistanceToNow, isToday, isYesterday, differenceInDays } from 'date-fns'
import client from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useNotificationStream } from '@/hooks/useNotificationStream'
import type { Notification as ApiNotification } from '@/types'

// ─── Visual buckets ───────────────────────────────────────────────────────
type NType = 'attendance' | 'marks' | 'dns' | 'system' | 'claim' | 'invite'

const TYPE_CONFIG: Record<
  NType,
  { icon: React.ElementType; color: string; bg: string; label: string; badge: 'success' | 'destructive' | 'warning' | 'info' | 'default' | 'secondary' }
> = {
  attendance: { icon: ClipboardCheck, color: 'text-status-present',  bg: 'bg-status-present-bg', label: 'Attendance', badge: 'success' },
  marks:      { icon: BarChart2,      color: 'text-status-excused',  bg: 'bg-status-excused-bg', label: 'Marks',      badge: 'info' },
  dns:        { icon: AlertTriangle,  color: 'text-status-absent',   bg: 'bg-status-absent-bg',  label: 'DNS Risk',   badge: 'destructive' },
  system:     { icon: Settings,       color: 'text-muted-foreground', bg: 'bg-background',        label: 'System',     badge: 'secondary' },
  claim:      { icon: MessageSquare,  color: 'text-status-late',     bg: 'bg-status-late-bg',    label: 'Claim',      badge: 'warning' },
  invite:     { icon: Users,          color: 'text-brand',           bg: 'bg-brand-light',       label: 'Invite',     badge: 'default' },
}

function classifyType(raw: string | undefined): NType {
  const t = (raw ?? '').toUpperCase()
  if (t.includes('ABSEN') || t.includes('CONSECUTIVE')) return 'attendance'
  if (t.includes('THRESHOLD') || t.includes('DNS') || t.includes('RISK')) return 'dns'
  if (t.includes('MARK') || t.includes('GRADE')) return 'marks'
  if (t.includes('CLAIM')) return 'claim'
  if (t.includes('INVIT')) return 'invite'
  return 'system'
}

function groupOf(date: Date): 'Today' | 'Yesterday' | 'This week' | 'Earlier' {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (differenceInDays(new Date(), date) < 7) return 'This week'
  return 'Earlier'
}

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />
}

type FilterKey = 'all' | NType

export default function Notifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)

  // SSE — reuse the existing hook so the bell + this list refresh in real time.
  useNotificationStream(user?.role === 'ADMIN')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () =>
      client.get('/notifications', { params: { page, size: 20 } }).then((r) => r.data.data),
  })

  const notifications: ApiNotification[] = useMemo(
    () => (data?.content as ApiNotification[] | undefined) ?? [],
    [data],
  )
  const totalPages: number = data?.totalPages ?? 1

  const markReadMutation = useMutation({
    mutationFn: (id: number) => client.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => client.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] })
    },
  })

  const enriched = useMemo(
    () =>
      notifications.map((n) => {
        const date = new Date(n.createdAt)
        return {
          ...n,
          ntype: classifyType(n.type),
          group: groupOf(date),
          relative: formatDistanceToNow(date, { addSuffix: true }),
        }
      }),
    [notifications],
  )

  const displayed = enriched.filter((n) => {
    const matchesType = filter === 'all' || n.ntype === filter
    const matchesUnread = !unreadOnly || !n.isRead
    return matchesType && matchesUnread
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const groups = displayed.reduce<Record<string, typeof displayed>>((acc, n) => {
    ;(acc[n.group] ??= []).push(n)
    return acc
  }, {})
  const groupOrder = ['Today', 'Yesterday', 'This week', 'Earlier']

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <div className="flex justify-between">
          <Sk className="h-6 w-40" />
          <Sk className="h-8 w-28" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 px-4 py-4 border-b border-border">
              <Sk className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Sk className="h-4 w-48" />
                <Sk className="h-3 w-full max-w-xs" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-xl border border-status-absent-border bg-status-absent-bg p-6 text-center">
          <p className="text-sm font-semibold text-status-absent">Could not load notifications.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 h-8 px-3 text-[12px] font-medium rounded-md border border-border bg-white hover:bg-background"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Stay updated on attendance, marks, and system events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-brand w-3.5 h-3.5"
            />
            Unread only
          </label>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', ...(Object.keys(TYPE_CONFIG) as NType[])] as FilterKey[]).map((f) => {
          const cfg = f === 'all' ? null : TYPE_CONFIG[f as NType]
          const Icon = cfg?.icon
          const count = f === 'all' ? notifications.length : enriched.filter((n) => n.ntype === f).length
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md border transition-colors ${
                active
                  ? 'bg-brand text-white border-brand'
                  : 'border-border text-muted-foreground hover:bg-background'
              }`}
            >
              {Icon && <Icon size={11} strokeWidth={2} />}
              <span className="capitalize">{f === 'all' ? 'All' : cfg?.label}</span>
              <span className={`text-[10px] ${active ? 'opacity-70' : 'opacity-60'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Notifications grouped */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4">
            <Bell size={20} strokeWidth={1.5} className="text-brand" />
          </div>
          <p className="text-[14px] font-semibold text-foreground mb-1">All caught up!</p>
          <p className="text-[13px] text-muted-foreground">
            {notifications.length === 0
              ? 'No notifications yet.'
              : 'No notifications match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupOrder
            .filter((g) => groups[g]?.length)
            .map((g) => (
              <div key={g}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {g}
                </p>
                <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden divide-y divide-border">
                  {groups[g].map((n) => {
                    const cfg = TYPE_CONFIG[n.ntype]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-4 py-3.5 hover:bg-background transition-colors cursor-pointer group ${
                          !n.isRead ? 'bg-brand-light/20' : ''
                        }`}
                        onClick={() => {
                          if (!n.isRead) markReadMutation.mutate(n.id)
                        }}
                      >
                        <div
                          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}
                        >
                          <Icon size={15} strokeWidth={2} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[13px] ${
                                !n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                              }`}
                            >
                              {n.title ?? cfg.label}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {n.relative}
                              </span>
                              {!n.isRead && (
                                <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="mt-1.5">
                            <Badge variant={cfg.badge}>{cfg.label}</Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
