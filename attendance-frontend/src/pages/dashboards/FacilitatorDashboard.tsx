import { useQuery, useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Calendar, ClipboardCheck, CheckCircle2, Clock, Users,
  AlertCircle, BarChart2, AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

interface ModuleRow {
  id: number
  code: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
}

interface SessionRow {
  id: number
  moduleId: number
  moduleName: string
  sessionDate: string
  startTime: string
  endTime: string
  period: string
}

type SessionStatus = 'submitted' | 'in-progress' | 'upcoming' | 'missed'

interface EnrichedSession extends SessionRow {
  moduleCode?: string
  status: SessionStatus
}

const STATUS_CONFIG: Record<SessionStatus, {
  label: string
  icon: typeof CheckCircle2
  textColor: string
  bgColor: string
  borderColor: string
}> = {
  'submitted':   { label: 'Submitted',   icon: CheckCircle2, textColor: 'text-status-present', bgColor: 'bg-status-present-bg', borderColor: 'border-status-present-border' },
  'in-progress': { label: 'In progress', icon: Clock,        textColor: 'text-status-late',    bgColor: 'bg-status-late-bg',    borderColor: 'border-status-late-border'    },
  'upcoming':    { label: 'Upcoming',    icon: Calendar,     textColor: 'text-status-excused', bgColor: 'bg-status-excused-bg', borderColor: 'border-status-excused-border' },
  'missed':      { label: 'Missed',      icon: AlertCircle,  textColor: 'text-status-absent',  bgColor: 'bg-status-absent-bg',  borderColor: 'border-status-absent-border'  },
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-status-absent-bg border border-status-absent-border rounded-lg">
      <AlertTriangle size={16} className="text-status-absent flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[13px] text-status-absent font-medium">Couldn't load data</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-[12px] font-medium text-brand hover:text-brand-hover">Try again</button>
        )}
      </div>
    </div>
  )
}

function classifySession(s: SessionRow, today: string, now: string): SessionStatus {
  if (s.sessionDate < today) return 'submitted'
  if (s.sessionDate > today) return 'upcoming'
  // Today
  if (now < s.startTime) return 'upcoming'
  if (now > s.endTime) return 'submitted'
  return 'in-progress'
}

export default function FacilitatorDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const now = format(new Date(), 'HH:mm:ss')

  // 1) My modules — backend filters by role
  const modulesQuery = useQuery({
    queryKey: ['facilitator', 'my-modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data as ModuleRow[]),
  })

  // 2) Sessions per module — fetched in parallel via useQueries
  const moduleIds = modulesQuery.data?.map(m => m.id) ?? []
  const sessionQueries = useQueries({
    queries: moduleIds.map(id => ({
      queryKey: ['facilitator', 'sessions', id],
      queryFn: () => client.get(`/modules/${id}/sessions`).then(r => r.data.data as SessionRow[]),
    })),
  })

  const sessionsLoading = modulesQuery.isLoading || sessionQueries.some(q => q.isLoading)
  const sessionsError = sessionQueries.some(q => q.isError)

  // Aggregate
  const allSessions: EnrichedSession[] = sessionQueries.flatMap((q, idx) => {
    const mod = modulesQuery.data?.[idx]
    return (q.data ?? []).map(s => ({
      ...s,
      moduleCode: mod?.code,
      status: classifySession(s, today, now),
    }))
  })

  const todaySessions = allSessions
    .filter(s => s.sessionDate === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const recentSessions = allSessions
    .filter(s => s.sessionDate < today)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate) || b.startTime.localeCompare(a.startTime))
    .slice(0, 8)

  const submitted = todaySessions.filter(s => s.status === 'submitted').length
  const pending = todaySessions.filter(s => s.status === 'in-progress' || s.status === 'upcoming').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Sessions</h1>
          <p className="text-muted-foreground mt-0.5">
            Today — {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <Button asChild>
          <Link to="/attendance"><ClipboardCheck className="h-4 w-4 mr-2" />Take attendance</Link>
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sessionsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <KPICard title="Today's Sessions" value={todaySessions.length} icon={Calendar} variant="default" trend="Scheduled" trendDirection="neutral" />
            <KPICard title="Submitted" value={submitted} icon={CheckCircle2} variant="success" trend="Attendance locked" trendDirection="neutral" />
            <KPICard title="Pending" value={pending} icon={Clock} variant={pending > 0 ? 'warning' : 'default'} trend="Action needed" trendDirection="neutral" />
            <KPICard title="My Modules" value={modulesQuery.data?.length ?? 0} icon={Users} variant="info" trend="Assigned" trendDirection="neutral" />
          </>
        )}
      </div>

      {/* Today's schedule */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Today's Schedule
        </p>
        {sessionsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : sessionsError ? (
          <ErrorState onRetry={() => sessionQueries.forEach(q => q.refetch())} />
        ) : todaySessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-border shadow-card px-4 py-10 text-center">
            <Calendar className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No sessions scheduled for today</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/attendance">Plan a session</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySessions.map(s => {
              const cfg = STATUS_CONFIG[s.status]
              const Icon = cfg.icon
              return (
                <div key={s.id} className={`bg-white rounded-xl border shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden ${cfg.borderColor}`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${cfg.bgColor}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-bold font-mono text-foreground">{s.moduleCode ?? `M${s.moduleId}`}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${cfg.textColor}`}>
                      <Icon size={12} strokeWidth={2.5} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-foreground truncate">{s.moduleName}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{s.period}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant={s.status === 'in-progress' ? 'default' : 'outline'} size="sm" asChild>
                        <Link to={`/attendance`}>
                          {s.status === 'submitted' ? 'View' : s.status === 'in-progress' ? 'Continue' : 'Start'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Session history */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[13px] font-semibold text-foreground">Session History</p>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reports"><BarChart2 className="h-3 w-3 mr-1.5" />Full report</Link>
          </Button>
        </div>
        {sessionsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Calendar className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">No past sessions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-background border-b border-border">
                  {['Date', 'Module', 'Period', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(s => {
                  const cfg = STATUS_CONFIG[s.status]
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {format(new Date(s.sessionDate), 'EEE d MMM')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-semibold text-brand text-[12px]">{s.moduleCode ?? s.moduleName}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.period}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${cfg.textColor}`}>
                          <cfg.icon size={11} strokeWidth={2.5} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DNS risk — placeholder for M2 */}
      {/* TODO M2 follow-up: per-module DNS risk count needs aggregation across the facilitator's assigned modules. Wire to /dashboard/modules/:id once UI for module picker is in. */}
    </div>
  )
}
