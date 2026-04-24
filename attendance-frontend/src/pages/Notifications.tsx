import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, AlertTriangle, TrendingDown } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  CONSECUTIVE_ABSENCE: {
    label: 'Consecutive Absence',
    icon: AlertTriangle,
    color: 'text-[#D97706] dark:text-[#D97706]',
    bg: 'bg-[#FFFBEB] dark:bg-[#FFFBEB]/10',
  },
  THRESHOLD_ALERT: {
    label: 'Threshold Alert',
    icon: TrendingDown,
    color: 'text-[#DC2626] dark:text-[#DC2626]',
    bg: 'bg-[#FEF2F2] dark:bg-[#FEF2F2]/10',
  },
}

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => client.get('/notifications').then(r => r.data.data),
  })

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

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Notifications</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {unreadCount > 0
              ? <span>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</span>
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
          >
            <Check className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Unread count badge bar */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EEF2FF] dark:bg-[#4F46E5]/10 border border-[#4F46E5]/20 dark:border-[#4F46E5]/20">
          <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center">
            <Bell className="h-4 w-4 text-[#FFFFFF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{unreadCount} new alert{unreadCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Action may be required for some items</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-[#E2E8F0] dark:border-[#1E3A5F]">
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
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No notifications yet</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Absence alerts will appear here automatically</p>
          </CardContent>
        </Card>
      )}

      {/* Notification timeline */}
      {notifications.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-[#E2E8F0] dark:bg-[#1E3A5F]" />

          <div className="space-y-3">
            {notifications.map((n: Notification) => {
              const config = TYPE_CONFIG[n.type] ?? {
                label: n.type,
                icon: Bell,
                color: 'text-[#64748B] dark:text-[#94A3B8]',
                bg: 'bg-[#F1F5F9] dark:bg-[#1E293B]',
              }
              const Icon = config.icon

              return (
                <div key={n.id} className="relative flex gap-4 pl-1">
                  {/* Timeline dot */}
                  <div className="relative z-10 shrink-0">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                      n.isRead ? "bg-[#F1F5F9] dark:bg-[#1E293B]" : config.bg,
                    )}>
                      <Icon className={cn("h-5 w-5", n.isRead ? "text-[#94A3B8]" : config.color)} />
                    </div>
                  </div>

                  {/* Content card */}
                  <Card className={cn(
                    "flex-1 transition-all border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]",
                    n.isRead ? "opacity-60" : "shadow-sm border-[#4F46E5]/20",
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{n.title ?? config.label}</p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-[#334155] dark:text-[#94A3B8] leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] border-[#E2E8F0] dark:border-[#1E3A5F]",
                                !n.isRead && config.color
                              )}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              {format(new Date(n.createdAt), 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </div>

                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 shrink-0 text-[#4F46E5] hover:text-[#4338CA] hover:bg-[#EEF2FF] dark:hover:bg-[#4F46E5]/10"
                            onClick={() => markReadMutation.mutate(n.id)}
                            disabled={markReadMutation.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" /> Read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
