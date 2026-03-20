import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, AlertTriangle, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  CONSECUTIVE_ABSENCE: {
    label: 'Consecutive Absence',
    icon: AlertTriangle,
    cls: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  THRESHOLD_ALERT: {
    label: 'Threshold Alert',
    icon: TrendingDown,
    cls: 'bg-red-100 text-red-700 border-red-200',
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-muted w-2/3" />
                  <div className="h-3 rounded bg-muted w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">Absence alerts will appear here automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: Notification) => {
            const config = TYPE_CONFIG[n.type] ?? {
              label: n.type,
              icon: Bell,
              cls: 'bg-secondary text-secondary-foreground',
            }
            const Icon = config.icon

            return (
              <Card
                key={n.id}
                className={`transition-opacity ${n.isRead ? 'opacity-60' : 'border-primary/20 shadow-sm'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="mt-1.5 shrink-0">
                      {n.isRead
                        ? <div className="h-2 w-2 rounded-full bg-transparent" />
                        : <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      }
                    </div>

                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title ?? n.type}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 break-words">{n.message}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(n.createdAt), 'MMM d, yyyy · HH:mm')}
                        </p>
                        <Badge className={`text-xs ${config.cls}`}>{config.label}</Badge>
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => markReadMutation.mutate(n.id)}
                            disabled={markReadMutation.isPending}
                          >
                            Mark read
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
    </div>
  )
}
