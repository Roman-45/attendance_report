import { useState } from 'react'
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  BookOpen, Users, AlertTriangle, ChevronRight, Award,
  BarChart2, Calculator, CheckCircle2,
} from 'lucide-react'

interface ModuleRow {
  id: number
  code: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
}

interface ModuleDashboardResponse {
  moduleId: number
  moduleName: string
  moduleCode: string
  totalEnrolled: number
  totalSessions: number
  averageAttendancePercent: number
  absenceThreshold: number
  studentsAtRisk: number
  averageGrade: number | null
}

interface MarkColumn {
  id: number
  moduleId: number
  name: string
  type: string
  maxScore: number | string
  weight: number | string
}

interface MarkEntry {
  id: number
  columnId: number
  columnName: string
  score: number | string
  maxScore: number | string
}

function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-status-absent-bg border border-status-absent-border rounded-lg">
      <AlertTriangle size={16} className="text-status-absent flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[13px] text-status-absent font-medium">Couldn't load data</p>
        {message && <p className="text-[12px] text-muted-foreground mt-0.5">{message}</p>}
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-[12px] font-medium text-brand hover:text-brand-hover">Try again</button>
        )}
      </div>
    </div>
  )
}

function ModuleCard({
  mod,
  dashboard,
  columns,
  marks,
  onComputeGrades,
  computing,
}: {
  mod: ModuleRow
  dashboard?: ModuleDashboardResponse
  columns?: MarkColumn[]
  marks?: MarkEntry[]
  onComputeGrades: (id: number) => void
  computing: boolean
}) {
  const isDraft = mod.status === 'DRAFT'
  const avgAtt = dashboard?.averageAttendancePercent ?? 0
  const dnsRisk = dashboard?.studentsAtRisk ?? 0

  // Compute average raw score per column
  const colAverages = (columns ?? []).map(c => {
    const entries = (marks ?? []).filter(m => m.columnId === c.id)
    if (!entries.length) return { col: c, avg: null as number | null, count: 0 }
    const total = entries.reduce((s, e) => s + Number(e.score ?? 0), 0)
    return { col: c, avg: total / entries.length, count: entries.length }
  })

  return (
    <div className="bg-white rounded-xl border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-bold font-mono text-brand">{mod.code}</span>
            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
              mod.status === 'ACTIVE' ? 'bg-status-present-bg text-status-present'
              : mod.status === 'DRAFT' ? 'bg-status-draft-bg text-status-draft'
              : 'bg-status-closed-bg text-status-closed'
            }`}>
              {mod.status}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-foreground leading-tight">{mod.name}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} strokeWidth={1.75} className="text-brand" />
        </div>
      </div>

      {/* Stats */}
      {!isDraft && dashboard && (
        <div className="px-5 pb-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[20px] font-bold text-foreground tabular-nums">{dashboard.totalEnrolled}</p>
            <p className="text-[10px] text-muted-foreground">Students</p>
          </div>
          <div className="text-center">
            <p className={`text-[20px] font-bold tabular-nums ${
              avgAtt >= 85 ? 'text-status-present'
              : avgAtt >= 75 ? 'text-status-late'
              : 'text-status-absent'
            }`}>
              {Math.round(avgAtt)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Attend.</p>
          </div>
          <div className="text-center">
            <p className={`text-[20px] font-bold tabular-nums ${dnsRisk > 0 ? 'text-status-absent' : 'text-status-present'}`}>
              {dnsRisk}
            </p>
            <p className="text-[10px] text-muted-foreground">DNS Risk</p>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="px-5 pb-4">
          <p className="text-[12px] text-muted-foreground bg-background rounded-lg px-3 py-2 text-center">
            Module not yet activated.
          </p>
        </div>
      )}

      {/* Assessment columns */}
      {!isDraft && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground mb-2">Assessments</p>
          {columns === undefined ? (
            <Skeleton className="h-12" />
          ) : columns.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No mark columns defined</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {colAverages.slice(0, 4).map(({ col, avg, count }) => (
                <div key={col.id} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-background">
                  <span className="text-[10px] font-semibold text-foreground text-center leading-tight truncate w-full">{col.name}</span>
                  {avg !== null ? (
                    <p className="text-[11px] font-bold text-foreground tabular-nums leading-none">
                      {avg.toFixed(1)}<span className="text-[9px] text-muted-foreground font-normal">/{Number(col.maxScore)}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-subtle-foreground tabular-nums">/{Number(col.maxScore)}</p>
                  )}
                  <p className="text-[9px] text-subtle-foreground">{count} entries</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DNS alert */}
      {!isDraft && dnsRisk > 0 && (
        <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2 bg-status-absent-bg border border-status-absent-border rounded-lg">
          <AlertTriangle size={13} strokeWidth={2} className="text-status-absent flex-shrink-0" />
          <p className="text-[11px] text-status-absent font-medium">
            {dnsRisk} student{dnsRisk > 1 ? 's' : ''} at DNS risk
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto px-5 py-4 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/marks"><Award className="h-3 w-3 mr-1.5" />Marks</Link>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          disabled={computing || isDraft}
          onClick={() => onComputeGrades(mod.id)}
        >
          <Calculator className="h-3 w-3 mr-1.5" />
          Compute
        </Button>
      </div>
    </div>
  )
}

export default function InstructorDashboard() {
  const { toast } = useToast()
  const [computingId, setComputingId] = useState<number | null>(null)

  const modulesQuery = useQuery({
    queryKey: ['instructor', 'my-modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data as ModuleRow[]),
  })

  const moduleIds = modulesQuery.data?.map(m => m.id) ?? []

  const dashboardQueries = useQueries({
    queries: moduleIds.map(id => ({
      queryKey: ['instructor', 'module-dashboard', id],
      queryFn: () =>
        client.get(`/dashboard/modules/${id}`).then(r => r.data.data as ModuleDashboardResponse).catch(() => null),
    })),
  })

  const columnQueries = useQueries({
    queries: moduleIds.map(id => ({
      queryKey: ['instructor', 'columns', id],
      queryFn: () => client.get(`/modules/${id}/columns`).then(r => r.data.data as MarkColumn[]).catch(() => []),
    })),
  })

  const marksQueries = useQueries({
    queries: moduleIds.map(id => ({
      queryKey: ['instructor', 'marks', id],
      queryFn: () => client.get(`/modules/${id}/marks`).then(r => r.data.data as MarkEntry[]).catch(() => []),
    })),
  })

  const computeMutation = useMutation({
    mutationFn: (moduleId: number) =>
      client.post(`/modules/${moduleId}/grades/compute`).then(r => r.data.data),
    onMutate: (id) => setComputingId(id),
    onSuccess: () => {
      toast({ title: 'Grades computed', description: 'Final grades recalculated successfully.' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to compute grades'
      toast({ variant: 'destructive', title: 'Compute failed', description: msg })
    },
    onSettled: () => setComputingId(null),
  })

  const modules = modulesQuery.data ?? []
  const activeCount = modules.filter(m => m.status === 'ACTIVE').length
  const totalStudents = dashboardQueries.reduce((acc, q) => acc + (q.data?.totalEnrolled ?? 0), 0)
  const totalDns = dashboardQueries.reduce((acc, q) => acc + (q.data?.studentsAtRisk ?? 0), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>My Modules</h1>
          <p className="text-muted-foreground mt-0.5">
            {activeCount} active · {totalStudents} total students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/reports"><BarChart2 className="h-4 w-4 mr-2" />Reports</Link>
          </Button>
          <Button asChild>
            <Link to="/marks"><CheckCircle2 className="h-4 w-4 mr-2" />Manage marks</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modulesQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <KPICard title="Active Modules" value={activeCount} icon={BookOpen} variant="default" trend="this term" trendDirection="neutral" />
            <KPICard title="Total Students" value={totalStudents} icon={Users} variant="success" trend="across modules" trendDirection="neutral" />
            <KPICard title="DNS Risk" value={totalDns} icon={AlertTriangle} variant={totalDns > 0 ? 'danger' : 'default'} trend="students at risk" trendDirection="neutral" />
          </>
        )}
      </div>

      {/* Module cards grid */}
      {modulesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : modulesQuery.isError ? (
        <ErrorState onRetry={() => modulesQuery.refetch()} message={(modulesQuery.error as Error)?.message} />
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-card px-4 py-12 text-center">
          <BookOpen className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No modules assigned yet</p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to="/select-module">Select a module <ChevronRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, idx) => (
            <ModuleCard
              key={m.id}
              mod={m}
              dashboard={dashboardQueries[idx]?.data ?? undefined}
              columns={columnQueries[idx]?.data ?? undefined}
              marks={marksQueries[idx]?.data ?? undefined}
              onComputeGrades={(id) => computeMutation.mutate(id)}
              computing={computingId === m.id || computeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
