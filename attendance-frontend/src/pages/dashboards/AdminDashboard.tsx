import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Users, BookOpen, BarChart2, Bell,
  ClipboardCheck, AlertTriangle, Mail, Plus, Download,
  ArrowUpRight, RefreshCw, Inbox, FileText,
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

function ModuleChip({ mod }: { mod: ModuleRow }) {
  const dotColor =
    mod.status === 'ACTIVE' ? 'bg-status-present'
    : mod.status === 'DRAFT' ? 'bg-status-draft'
    : 'bg-status-closed'
  return (
    <Link
      to={`/modules`}
      className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:border-border-strong hover:bg-background transition-all duration-150"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-brand font-mono">{mod.code}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      </div>
      <p className="text-[11px] text-foreground leading-tight line-clamp-2">{mod.name}</p>
      <span className="text-[10px] text-muted-foreground mt-auto uppercase tracking-wide">
        {mod.status.toLowerCase()}
      </span>
    </Link>
  )
}

export default function AdminDashboard() {
  // Total Students — page 0 size 1, totalElements is the count
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

  // Active Users
  const usersQuery = useQuery({
    queryKey: ['admin', 'users-total'],
    queryFn: () =>
      client.get('/admin/users', { params: { page: 0, size: 1 } })
        .then(r => r.data.data as PageResponse<unknown>),
  })

  // Unread notifications count
  const notifQuery = useQuery({
    queryKey: ['admin', 'unread-notifications'],
    queryFn: () => client.get('/notifications/unread-count').then(r => r.data.data as number),
  })

  // Audit feed
  const auditQuery = useQuery({
    queryKey: ['admin', 'audit', 0],
    queryFn: () =>
      client.get('/audit', { params: { page: 0, size: 10 } })
        .then(r => r.data.data as PageResponse<AuditEntry>),
  })

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Admin overview of students, modules, and recent activity</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/reports"><BarChart2 className="h-4 w-4 mr-2" />Reports</Link>
          </Button>
          <Button asChild>
            <Link to="/users"><Plus className="h-4 w-4 mr-2" />Invite user</Link>
          </Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {studentsQuery.isLoading
          ? <Skeleton className="h-32 rounded-xl" />
          : <KPICard
              title="Total Students"
              value={studentsQuery.data?.totalElements ?? 0}
              icon={Users}
              variant="default"
              trend="enrolled in the system"
              trendDirection="neutral"
            />}
        {modulesQuery.isLoading
          ? <Skeleton className="h-32 rounded-xl" />
          : <KPICard
              title="Total Modules"
              value={modulesQuery.data?.length ?? 0}
              icon={BookOpen}
              variant="success"
              trend={`${modulesQuery.data?.filter(m => m.status === 'ACTIVE').length ?? 0} active`}
              trendDirection="neutral"
            />}
        {usersQuery.isLoading
          ? <Skeleton className="h-32 rounded-xl" />
          : <KPICard
              title="Active Users"
              value={usersQuery.data?.totalElements ?? 0}
              icon={Users}
              variant="info"
              trend="across all roles"
              trendDirection="neutral"
            />}
        {notifQuery.isLoading
          ? <Skeleton className="h-32 rounded-xl" />
          : <KPICard
              title="Unread Notifications"
              value={notifQuery.data ?? 0}
              icon={Bell}
              variant={notifQuery.data && notifQuery.data > 0 ? 'warning' : 'default'}
              trend="awaiting attention"
              trendDirection="neutral"
            />}
      </div>

      {/* ── Module overview ── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
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
              {modulesQuery.data.slice(0, 6).map(m => <ModuleChip key={m.id} mod={m} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity (audit feed) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden">
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
            </div>
          ) : (
            <div className="divide-y divide-border">
              {auditQuery.data.content.map(a => {
                const cfg = ACTION_ICON[a.action] ?? ACTION_ICON.UPDATE
                const Icon = cfg.icon
                let when = ''
                try { when = formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) } catch { when = '' }
                return (
                  <div key={a.id} className="flex gap-3 px-4 py-3 hover:bg-background transition-colors">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
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

        {/* Right column: at-risk + invitations placeholders */}
        <div className="flex flex-col gap-4">
          {/* At-risk students — empty state for M2 */}
          {/* TODO M2 follow-up: build /admin/at-risk-students endpoint or aggregate client-side from /students + /me/absence-summary per student */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">At-Risk Students</p>
            </div>
            <div className="px-4 py-8 text-center">
              <AlertTriangle className="h-9 w-9 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">Coming soon</p>
              <p className="text-[11px] text-subtle-foreground mt-1">A consolidated DNS-risk feed will arrive in the next release.</p>
            </div>
          </div>

          {/* Pending invitations — empty state for M2 */}
          {/* TODO: there's no pending-invitations endpoint yet; UserManagementController only has invite-team-leader. Will need a /admin/invitations/pending endpoint in a future PR. */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Pending Invitations</p>
            </div>
            <div className="px-4 py-8 text-center">
              <Inbox className="h-9 w-9 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">No pending invitations to show</p>
              <Button variant="ghost" size="sm" className="mt-2" asChild>
                <Link to="/users"><Mail className="h-3 w-3 mr-1.5" />Manage users</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
