import { useQuery, useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Users, BookOpen, BarChart2,
  ClipboardCheck, AlertTriangle, Mail, Plus, Download,
  ArrowUpRight, RefreshCw, Inbox, FileText, ShieldAlert,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PageResponse } from '@/types'

// ── Local response shapes (co-located; see types/index.ts for shared) ──
interface ModuleRow {
  id: number
  code: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  startDate: string
  endDate: string
}

interface AuditEntry {
  id: number
  userEmail: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | string
  entityType: string
  entityId: number | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

interface AtRiskStudent {
  studentId: number
  studentName: string
  studentCode: string
  absences: number
  totalSessions: number
  absencePercent: number
}

interface ModuleDashboard {
  moduleId: number
  moduleCode: string
  moduleName: string
  totalEnrolled: number
  totalSessions: number
  averageAttendancePercent: number
  studentsAtRisk: number
  atRiskStudents: AtRiskStudent[]
}

interface AggregatedRisk {
  student: AtRiskStudent
  moduleCode: string
  moduleName: string
  moduleId: number
}

// ── Action-icon mapping for activity feed ──
const ACTION_ICON: Record<string, { icon: typeof ClipboardCheck; color: string; bg: string }> = {
  CREATE: { icon: Plus,           color: 'text-status-present', bg: 'bg-status-present-bg' },
  UPDATE: { icon: RefreshCw,      color: 'text-status-excused', bg: 'bg-status-excused-bg' },
  DELETE: { icon: AlertTriangle,  color: 'text-status-absent',  bg: 'bg-status-absent-bg'  },
  IMPORT: { icon: Download,       color: 'text-brand',          bg: 'bg-brand-light'       },
}

function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-status-absent-bg border border-status-absent-border rounded-lg">
      <AlertTriangle size={16} className="text-status-absent flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[13px] text-status-absent font-medium">Couldn't load data</p>
        {message && <p className="text-[12px] text-muted-foreground mt-0.5">{message}</p>}
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-[12px] font-medium text-brand hover:text-brand-hover">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

function ModuleChip({ mod, attendance }: { mod: ModuleRow; attendance?: number }) {
  const dotColor =
    mod.status === 'ACTIVE' ? 'bg-status-present'
    : mod.status === 'DRAFT' ? 'bg-status-draft'
    : 'bg-status-closed'
  const attendanceColor =
    attendance == null ? 'text-muted-foreground'
    : attendance >= 85 ? 'text-status-present'
    : attendance >= 70 ? 'text-status-late'
    : 'text-dns-500'
  return (
    <Link
      to={`/modules`}
      className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:border-border-strong hover:shadow-sm bg-surface transition-all duration-150"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-brand">{mod.code}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      </div>
      <p className="text-[11px] text-foreground leading-tight line-clamp-2">{mod.name}</p>
      {attendance != null ? (
        <span className={`font-mono text-[10px] font-semibold ${attendanceColor} mt-auto`}>
          {attendance.toFixed(0)}% attendance
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground mt-auto uppercase tracking-wide">
          {mod.status.toLowerCase()}
        </span>
      )}
    </Link>
  )
}

export default function AdminDashboard() {
  // Total Students
  const studentsQuery = useQuery({
    queryKey: ['admin', 'students-total'],
    queryFn: () =>
      client.get('/students', { params: { page: 0, size: 1 } })
        .then(r => r.data.data as PageResponse<unknown>),
  })

  // Total Modules + table
  const modulesQuery = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data as ModuleRow[]),
  })

  // Active Staff (Users) — admin-only count
  const usersQuery = useQuery({
    queryKey: ['admin', 'users-total'],
    queryFn: () =>
      client.get('/admin/users', { params: { page: 0, size: 1 } })
        .then(r => r.data.data as PageResponse<unknown>),
  })

  // Per-module dashboard fetches — aggregated for KPIs + DNS Risk callout
  const moduleDashboards = useQueries({
    queries: (modulesQuery.data ?? []).map(m => ({
      queryKey: ['admin', 'module-dashboard', m.id],
      queryFn: () =>
        client.get(`/dashboard/modules/${m.id}`).then(r => r.data.data as ModuleDashboard),
      enabled: !!modulesQuery.data?.length,
      staleTime: 30_000,
    })),
  })

  const dashboardsReady = moduleDashboards.length > 0 && moduleDashboards.every(q => !q.isLoading)
  const allDashboards = moduleDashboards.map(q => q.data).filter((d): d is ModuleDashboard => !!d)

  // Aggregate at-risk students across all modules (dedup per studentId — show worst module)
  const atRiskAggregated: AggregatedRisk[] = (() => {
    const byStudent = new Map<number, AggregatedRisk>()
    for (const dash of allDashboards) {
      for (const s of dash.atRiskStudents ?? []) {
        const existing = byStudent.get(s.studentId)
        if (!existing || s.absencePercent > existing.student.absencePercent) {
          byStudent.set(s.studentId, {
            student: s,
            moduleCode: dash.moduleCode,
            moduleName: dash.moduleName,
            moduleId: dash.moduleId,
          })
        }
      }
    }
    return Array.from(byStudent.values()).sort((a, b) => b.student.absencePercent - a.student.absencePercent)
  })()

  const overallAttendance = (() => {
    if (allDashboards.length === 0) return null
    const valid = allDashboards.filter(d => d.totalSessions > 0)
    if (valid.length === 0) return null
    return valid.reduce((sum, d) => sum + d.averageAttendancePercent, 0) / valid.length
  })()

  // Audit feed
  const auditQuery = useQuery({
    queryKey: ['admin', 'audit', 0],
    queryFn: () =>
      client.get('/audit', { params: { page: 0, size: 8 } })
        .then(r => r.data.data as PageResponse<AuditEntry>),
  })

  // Lookup attendance % per module for the chip grid
  const moduleAttendanceById = new Map<number, number>(
    allDashboards.map(d => [d.moduleId, d.averageAttendancePercent])
  )

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">
            Academic year 2025/26 · Trimester 2 · {modulesQuery.data?.length ?? 0} active modules
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/reports"><BarChart2 className="h-4 w-4 mr-2" />Reports</Link>
          </Button>
          <Button asChild>
            <Link to="/users"><Plus className="h-4 w-4 mr-2" />Invite faculty</Link>
          </Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {studentsQuery.isLoading
          ? <Skeleton className="h-32 rounded-lg" />
          : <KPICard
              title="Enrolled Students"
              value={studentsQuery.data?.totalElements ?? 0}
              icon={Users}
              variant="default"
              trend={`across ${modulesQuery.data?.length ?? 0} modules`}
              trendDirection="neutral"
            />}
        {!dashboardsReady
          ? <Skeleton className="h-32 rounded-lg" />
          : <KPICard
              title="Avg Attendance"
              value={overallAttendance != null ? `${overallAttendance.toFixed(0)}%` : '—'}
              icon={ClipboardCheck}
              variant={overallAttendance == null || overallAttendance >= 85 ? 'success' : overallAttendance >= 70 ? 'warning' : 'danger'}
              trend={overallAttendance != null ? `across ${allDashboards.filter(d => d.totalSessions > 0).length} modules with sessions` : 'no sessions recorded yet'}
              trendDirection="neutral"
            />}
        {!dashboardsReady
          ? <Skeleton className="h-32 rounded-lg" />
          : <KPICard
              title="DNS Risk"
              value={atRiskAggregated.length}
              icon={ShieldAlert}
              variant={atRiskAggregated.length > 0 ? 'danger' : 'success'}
              trend={atRiskAggregated.length > 0 ? 'students flagged this trimester' : 'no students flagged'}
              trendDirection={atRiskAggregated.length > 0 ? 'down' : 'neutral'}
            />}
        {usersQuery.isLoading
          ? <Skeleton className="h-32 rounded-lg" />
          : <KPICard
              title="Active Staff"
              value={usersQuery.data?.totalElements ?? 0}
              icon={Users}
              variant="info"
              trend="admins, facilitators, instructors"
              trendDirection="neutral"
            />}
      </div>

      {/* ── Module overview ── */}
      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[13px] font-semibold text-foreground">Modules</p>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/modules">Manage modules <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        <div className="p-4">
          {modulesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : modulesQuery.isError ? (
            <ErrorState onRetry={() => modulesQuery.refetch()} message={(modulesQuery.error as Error)?.message} />
          ) : !modulesQuery.data?.length ? (
            <div className="py-10 text-center">
              <BookOpen className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No modules yet</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/modules">Create a module</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {modulesQuery.data.slice(0, 6).map(m => (
                <ModuleChip key={m.id} mod={m} attendance={moduleAttendanceById.get(m.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity (audit feed) */}
        <div className="lg:col-span-2 bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-foreground">Recent Activity</p>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/audit-log">Full log <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {auditQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : auditQuery.isError ? (
            <div className="p-4">
              <ErrorState onRetry={() => auditQuery.refetch()} />
            </div>
          ) : !auditQuery.data?.content.length ? (
            <div className="px-4 py-10 text-center">
              <FileText className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No activity recorded yet</p>
              <p className="text-[11px] text-subtle-foreground mt-1">Once facilitators record attendance or instructors enter marks, every action will be logged here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {auditQuery.data.content.map(a => {
                const cfg = ACTION_ICON[a.action] ?? ACTION_ICON.UPDATE
                const Icon = cfg.icon
                let when = ''
                try { when = formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) } catch { when = '' }
                return (
                  <div key={a.id} className="flex gap-3 px-4 py-3 hover:bg-surface-sunken transition-colors">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${cfg.bg}`}>
                      <Icon size={13} strokeWidth={2} className={cfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-foreground line-clamp-2">
                        <span className="font-semibold">{a.action}</span>{' '}
                        <span className="text-muted-foreground">on {a.entityType}</span>
                        {a.details ? <span className="text-muted-foreground"> · {a.details}</span> : null}
                      </p>
                      <p className="text-[11px] text-subtle-foreground mt-0.5">
                        {a.userEmail ?? 'system'} · {when}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: DNS Risk callout + invitations */}
        <div className="flex flex-col gap-4">
          {/* ── DNS Risk callout (per design guide §6.8) ─────────────── */}
          <div className="rounded-lg border overflow-hidden bg-dns-50" style={{ borderColor: 'rgba(228, 27, 35, 0.3)' }}>
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} className="text-dns-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[15px] font-semibold text-foreground leading-tight">At-Risk Students</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {!dashboardsReady
                      ? 'Loading…'
                      : atRiskAggregated.length === 0
                        ? 'No students flagged this trimester'
                        : `${atRiskAggregated.length} student${atRiskAggregated.length === 1 ? '' : 's'} flagged this trimester`}
                  </p>
                </div>
              </div>
              <Link to="/students" className="text-[12px] font-medium text-brand hover:text-brand-hover whitespace-nowrap mt-1">
                View all →
              </Link>
            </div>
            {!dashboardsReady ? (
              <div className="px-4 pb-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
              </div>
            ) : atRiskAggregated.length === 0 ? (
              <div className="px-4 pb-5 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Students whose absence rate crosses the module's threshold (default 25%) appear here automatically. The system flags them after every recorded session.
                </p>
              </div>
            ) : (
              <div className="px-2 pb-2">
                <ul className="divide-y divide-dns-50">
                  {atRiskAggregated.slice(0, 5).map(r => (
                    <li key={r.student.studentId} className="flex items-center gap-3 px-2 py-2.5 hover:bg-white/40 rounded-md transition-colors">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-dns-50 flex items-center justify-center font-mono text-[10px] font-semibold text-dns-500">
                        {r.student.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-foreground truncate leading-tight">{r.student.studentName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          <span className="font-mono">{r.moduleCode}</span> · {r.student.absences}/{r.student.totalSessions} absent
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-dns-500 border border-dns-50 font-mono tabular-nums">
                        {r.student.absencePercent.toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pending invitations placeholder */}
          <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Pending Invitations</p>
            </div>
            <div className="px-4 py-8 text-center">
              <Inbox className="h-9 w-9 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">No pending invitations</p>
              <Button variant="ghost" size="sm" className="mt-2" asChild>
                <Link to="/users"><Mail className="h-3 w-3 mr-1.5" />Manage faculty</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
