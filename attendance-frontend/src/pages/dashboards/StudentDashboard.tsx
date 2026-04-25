import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2, AlertTriangle, BookOpen, TrendingUp, TrendingDown,
  Calendar, ChevronRight, Star, ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import type { PageResponse } from '@/types'

const DNS_THRESHOLD_DEFAULT = 75 // student needs ≥ 75% attendance (i.e. <= 25% absent by backend convention)

interface ProfileResponse {
  id: number
  studentId: string
  name: string
  email: string
  cohortYear: number
  program: string
}

interface EnrollmentResponse {
  enrollmentId: number
  studentId: number
  studentName: string
  studentCode: string
  program: string
  moduleId: number
  moduleName: string
  enrolledAt: string
}

interface AbsenceSummaryEntry {
  moduleId: number
  moduleName: string
  moduleCode: string
  totalSessions: number
  absences: number
  absencePercent: number
  threshold: number
  thresholdExceeded: boolean
}

interface AttendanceRecord {
  id: number
  sessionId: number
  sessionDate: string
  status: string
  studentName: string
}

interface MarkEntry {
  id: number
  columnId: number
  columnName: string
  columnType: string
  maxScore: number | string
  studentId: number
  score: number | string
  enteredAt: string
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

function getAttendanceStatus(presencePct: number) {
  if (presencePct >= 90) return {
    level: 'excellent' as const,
    icon: Star,
    color: 'text-status-present',
    bg: 'bg-status-present-bg',
    border: 'border-status-present-border',
    headline: 'Outstanding presence',
    body: `You've been present in ${Math.round(presencePct)}% of classes — keep it going.`,
  }
  if (presencePct >= 80) return {
    level: 'good' as const,
    icon: CheckCircle2,
    color: 'text-status-present',
    bg: 'bg-status-present-bg',
    border: 'border-status-present-border',
    headline: 'Good attendance',
    body: `Present in ${Math.round(presencePct)}% of classes — you're exam-eligible.`,
  }
  if (presencePct >= DNS_THRESHOLD_DEFAULT) return {
    level: 'watch' as const,
    icon: CheckCircle2,
    color: 'text-status-late',
    bg: 'bg-status-late-bg',
    border: 'border-status-late-border',
    headline: 'Attend your next classes to stay on track',
    body: `You're at ${Math.round(presencePct)}% attendance. Don't lose your buffer — show up.`,
  }
  return {
    level: 'critical' as const,
    icon: AlertTriangle,
    color: 'text-status-absent',
    bg: 'bg-status-absent-bg',
    border: 'border-status-absent-border',
    headline: 'Come to every session from now on',
    body: `You're at ${Math.round(presencePct)}% attendance. To sit final exams you need ≥ 75% — talk to your team leader today.`,
  }
}

export default function StudentDashboard() {
  const profileQuery = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: () => client.get('/me/profile').then(r => r.data.data as ProfileResponse),
  })

  const modulesQuery = useQuery({
    queryKey: ['student', 'modules'],
    queryFn: () => client.get('/me/modules').then(r => r.data.data as EnrollmentResponse[]),
  })

  const absenceQuery = useQuery({
    queryKey: ['student', 'absence-summary'],
    queryFn: () => client.get('/me/absence-summary').then(r => r.data.data as AbsenceSummaryEntry[]),
  })

  const recentAttQuery = useQuery({
    queryKey: ['student', 'recent-attendance'],
    queryFn: () =>
      client.get('/me/attendance', { params: { page: 0, size: 5 } })
        .then(r => r.data.data as PageResponse<AttendanceRecord>),
  })

  const marksQuery = useQuery({
    queryKey: ['student', 'marks'],
    queryFn: () => client.get('/me/marks').then(r => r.data.data as MarkEntry[]),
  })

  // Aggregate overall attendance
  const totalSessions = absenceQuery.data?.reduce((s, e) => s + e.totalSessions, 0) ?? 0
  const totalAbsences = absenceQuery.data?.reduce((s, e) => s + e.absences, 0) ?? 0
  const sessionsAttended = totalSessions - totalAbsences
  const presencePct = totalSessions > 0 ? (sessionsAttended / totalSessions) * 100 : 0
  const att = getAttendanceStatus(presencePct)
  const AttIcon = att.icon

  const atRiskModules = absenceQuery.data?.filter(e => e.thresholdExceeded) ?? []

  // Total earned across all graded entries. Per-module grouping deferred —
  // /me/marks returns columnId without moduleId, so a true per-module roll-up
  // would need a second fetch of /modules/:id/columns per module. The aggregate
  // here is "good enough" for the dashboard summary; the Marks page handles detail.
  const totalEarned = marksQuery.data?.reduce((s, m) => s + Number(m.score ?? 0), 0) ?? 0
  const totalPossible = marksQuery.data?.reduce((s, m) => s + Number(m.maxScore ?? 0), 0) ?? 0

  const initialLoading = profileQuery.isLoading || modulesQuery.isLoading || absenceQuery.isLoading

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const profile = profileQuery.data
  const firstName = profile?.name?.split(' ')[0] ?? 'Student'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1>Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground mt-0.5">
            {profile?.program} · <span className="font-mono">{profile?.studentId}</span>
          </p>
        </div>
      </div>

      {/* Attendance card */}
      {absenceQuery.isError ? (
        <ErrorState onRetry={() => absenceQuery.refetch()} />
      ) : (
        <div className={`rounded-xl border-2 ${att.border} ${att.bg} p-5`}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${att.bg} border ${att.border}`}>
                <AttIcon size={18} strokeWidth={2} className={att.color} />
              </div>
              <div className="min-w-0">
                <p className={`text-[15px] font-bold ${att.color}`}>{att.headline}</p>
                <p className="text-[13px] text-foreground mt-0.5 leading-relaxed">{att.body}</p>
                {atRiskModules.length > 0 && (
                  <Link to="/portal" className={`mt-2 inline-flex items-center gap-1 text-[12px] font-semibold ${att.color} hover:opacity-80`}>
                    Review my modules <ArrowRight size={12} strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className={`text-[40px] font-bold tabular-nums leading-none ${att.color}`}>
                {Math.round(presencePct)}%
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                {sessionsAttended} / {totalSessions} sessions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Module list */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Modules ({modulesQuery.data?.length ?? 0})
            </p>
            {totalPossible > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] bg-background border border-border rounded-md px-2 py-1 tabular-nums">
                <span className="text-muted-foreground">Total earned</span>
                <span className="font-bold text-foreground">{totalEarned.toFixed(1)}</span>
                <span className="text-subtle-foreground">/ {totalPossible.toFixed(0)}</span>
              </div>
            )}
          </div>

          {modulesQuery.data?.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-card px-4 py-10 text-center">
              <BookOpen className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">You're not enrolled in any modules yet</p>
            </div>
          ) : (
            modulesQuery.data?.map(m => {
              const summary = absenceQuery.data?.find(a => a.moduleId === m.moduleId)
              const presence = summary && summary.totalSessions > 0
                ? Math.round(((summary.totalSessions - summary.absences) / summary.totalSessions) * 100)
                : null
              return (
                <div key={m.enrollmentId} className="bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold font-mono text-brand">{summary?.moduleCode ?? m.moduleId}</span>
                        {presence !== null && presence >= 85 && <TrendingUp size={11} className="text-status-present" />}
                        {presence !== null && presence < 75 && <TrendingDown size={11} className="text-status-absent" />}
                      </div>
                      <p className="text-[13px] font-semibold text-foreground truncate">{m.moduleName}</p>
                    </div>
                  </div>

                  {summary && summary.totalSessions > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">
                          Attendance · {summary.totalSessions - summary.absences}/{summary.totalSessions} sessions
                        </span>
                        <span className={`text-[11px] font-semibold ${
                          (presence ?? 0) >= 85 ? 'text-status-present'
                          : (presence ?? 0) >= 75 ? 'text-status-late'
                          : 'text-status-absent'
                        }`}>
                          {presence}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (presence ?? 0) >= 85 ? 'bg-status-present'
                            : (presence ?? 0) >= 75 ? 'bg-status-late'
                            : 'bg-status-absent'
                          }`}
                          style={{ width: `${presence}%` }}
                        />
                      </div>
                      {summary.thresholdExceeded && (
                        <p className="text-[11px] text-status-absent font-medium mt-2 flex items-center gap-1">
                          <AlertTriangle size={11} /> DNS risk reached
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Recent attendance */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Recent Attendance</p>
              <Calendar size={14} className="text-muted-foreground" />
            </div>
            {recentAttQuery.isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : recentAttQuery.isError ? (
              <div className="p-4"><ErrorState onRetry={() => recentAttQuery.refetch()} /></div>
            ) : !recentAttQuery.data?.content.length ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-muted-foreground">No attendance recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentAttQuery.data.content.map(r => {
                  const statusUpper = r.status?.toUpperCase()
                  const cfgColor =
                    statusUpper === 'PRESENT' ? 'text-status-present'
                    : statusUpper === 'ABSENT' ? 'text-status-absent'
                    : statusUpper === 'LATE' ? 'text-status-late'
                    : 'text-status-excused'
                  return (
                    <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">
                        {(() => { try { return format(new Date(r.sessionDate), 'EEE d MMM') } catch { return r.sessionDate } })()}
                      </span>
                      <span className={`text-[11px] font-semibold uppercase ${cfgColor}`}>{r.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link to="/portal" className="text-[12px] text-brand hover:text-brand-hover font-medium">
                View full history →
              </Link>
            </div>
          </div>

          {/* Upcoming sessions — TODO M7 / N4 */}
          {/* TODO M7: hook up to /me/schedule once that endpoint lands. */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Upcoming Classes</p>
              <Calendar size={14} className="text-muted-foreground" />
            </div>
            <div className="px-4 py-8 text-center">
              <Calendar className="h-9 w-9 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">Schedule view coming soon</p>
            </div>
          </div>

          {/* Portal CTA */}
          <Button variant="outline" className="w-full" asChild>
            <Link to="/portal">Open student portal <ChevronRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
