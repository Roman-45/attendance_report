// Grades view — ported from frontend-design-reference/src/app/components/shared/GradesView.tsx
//
// Two roles, two layouts:
//  • INSTRUCTOR/ADMIN: spreadsheet-style class grade table for one selected module
//      GET /modules                       (assigned modules)
//      GET /modules/:id/grades            (computed final grades w/ breakdown)
//      GET /dashboard/modules/:id         (attendance % per student / class avg)
//  • STUDENT: per-module card view of their own marks + scaled contribution
//      GET /me/modules
//      GET /me/marks
//      GET /me/absence-summary            (attendance % per module)
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, RefreshCw } from 'lucide-react'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { InitialsAvatar, getInitials } from '@/components/ui/InitialsAvatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { Module, Enrollment, MarkEntry } from '@/types'

// ── Backend grade response ────────────────────────────────────────────────
interface MarkBreakdown {
  columnId: number
  columnName: string
  columnType: string
  score: number | null
  maxScore: number
  weight: number
  weightedScore: number | null
}
interface GradeResponse {
  studentId: number
  studentName: string
  studentCode: string
  moduleId: number
  moduleName: string
  weightedAverage: number | null
  gradeLetter: string | null
  breakdown: MarkBreakdown[]
}

interface AbsenceSummaryRow {
  moduleId: number
  moduleName: string
  attendancePercent: number
  totalSessions?: number
  presentCount?: number
}

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />
}

function attendanceColorClass(pct: number): string {
  if (pct >= 85) return 'text-status-present'
  if (pct >= 75) return 'text-status-late'
  return 'text-status-absent'
}

function attendanceBarClass(pct: number): string {
  if (pct >= 85) return 'bg-status-present'
  if (pct >= 75) return 'bg-status-late'
  return 'bg-status-absent'
}

// ── Instructor / Admin view ───────────────────────────────────────────────
function InstructorGrades() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [moduleId, setModuleId] = useState<number | null>(null)

  const modulesQuery = useQuery<Module[]>({
    queryKey: ['grades', 'modules'],
    queryFn: () => client.get('/modules').then((r) => r.data.data),
  })

  // Pick first module by default once loaded
  const modules = modulesQuery.data ?? []
  const activeId = moduleId ?? modules[0]?.id ?? null

  const gradesQuery = useQuery<GradeResponse[]>({
    queryKey: ['grades', 'module-grades', activeId],
    queryFn: () => client.get(`/modules/${activeId}/grades`).then((r) => r.data.data),
    enabled: activeId !== null,
  })

  // Per-module dashboard for class-wide stats (avg attendance etc.)
  const dashboardQuery = useQuery<{ averageAttendancePercent: number }>({
    queryKey: ['grades', 'module-dashboard', activeId],
    queryFn: () => client.get(`/dashboard/modules/${activeId}`).then((r) => r.data.data),
    enabled: activeId !== null,
  })

  const recompute = useMutation({
    mutationFn: () => client.post(`/modules/${activeId}/grades/compute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', 'module-grades', activeId] })
      toast({ title: 'Grades recomputed', description: 'Latest marks rolled into final grades.' })
    },
    onError: () => {
      toast({ title: 'Could not recompute grades', variant: 'destructive' })
    },
  })

  const isLoading = modulesQuery.isLoading || gradesQuery.isLoading

  // Derive distinct columns from the first student that has a breakdown.
  const columns = useMemo(() => {
    const grades = gradesQuery.data ?? []
    const sample = grades.find((g) => g.breakdown.length > 0)
    if (!sample) return [] as { id: number; name: string; max: number; weight: number }[]
    return sample.breakdown.map((b) => ({
      id: b.columnId,
      name: b.columnName,
      max: Number(b.maxScore),
      weight: Number(b.weight),
    }))
  }, [gradesQuery.data])

  const grades = gradesQuery.data ?? []

  // Class average per column (raw /max scaled to 100)
  const classAvg = (colId: number): number | null => {
    const vals: number[] = []
    grades.forEach((g) => {
      const b = g.breakdown.find((x) => x.columnId === colId)
      if (b && b.score !== null && b.maxScore > 0) {
        vals.push((Number(b.score) / Number(b.maxScore)) * 100)
      }
    })
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <div className="flex justify-between">
          <Sk className="h-6 w-28" />
          <Sk className="h-8 w-36" />
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border">
              <Sk className="w-7 h-7 rounded-full" />
              <Sk className="h-4 flex-1 max-w-40" />
              {[0, 1, 2, 3].map((j) => (
                <Sk key={j} className="h-8 w-20 rounded-md" />
              ))}
              <Sk className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (modulesQuery.error) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="rounded-xl border border-status-absent-border bg-status-absent-bg p-6 text-center">
          <p className="text-sm font-semibold text-status-absent">Could not load modules.</p>
          <button
            onClick={() => modulesQuery.refetch()}
            className="mt-3 h-8 px-3 text-[12px] font-medium rounded-md border border-border bg-white hover:bg-background"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-[14px] font-semibold text-foreground mb-1">No modules assigned</p>
          <p className="text-[13px] text-muted-foreground">Grades will appear once you have modules.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grades</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Class mark breakdown — raw scores and weighted contribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeId ?? ''}
              onChange={(e) => setModuleId(Number(e.target.value))}
              className="h-8 pl-3 pr-8 text-[12px] font-semibold bg-brand-light border border-brand/20 text-brand rounded-md appearance-none cursor-pointer focus:outline-none"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} – {m.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recompute.mutate()}
            disabled={recompute.isPending || activeId === null}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recompute.isPending ? 'animate-spin' : ''}`} />
            Recompute
          </Button>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-[14px] font-semibold text-foreground mb-1">No grades computed yet</p>
          <p className="text-[13px] text-muted-foreground">
            Once marks are entered, click <span className="font-semibold">Recompute</span> to generate
            final grades.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Student
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                    ID
                  </th>
                  {columns.map((col) => (
                    <th key={col.id} className="px-3 py-3 text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {col.name}
                      </div>
                      <div className="text-[10px] text-subtle-foreground">
                        /{col.max} · w {Number(col.weight).toFixed(0)}%
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Class avg row */}
                <tr className="bg-brand-light/30 border-b-2 border-brand/20">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-brand" colSpan={2}>
                    Class Average
                  </td>
                  {columns.map((col) => {
                    const avg = classAvg(col.id)
                    return (
                      <td key={col.id} className="px-3 py-2.5 text-center">
                        {avg !== null ? (
                          <div className="text-[12px] font-bold text-foreground tabular-nums">
                            {avg.toFixed(1)}
                            <span className="text-[10px] text-muted-foreground font-normal">/100</span>
                          </div>
                        ) : (
                          <span className="text-subtle-foreground text-[12px]">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5 text-right text-[12px] font-bold text-brand tabular-nums">
                    {dashboardQuery.data?.averageAttendancePercent !== undefined
                      ? `${dashboardQuery.data.averageAttendancePercent.toFixed(1)}% att.`
                      : '—'}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2.5" />
                </tr>
                {grades.map((g, i) => (
                  <tr
                    key={g.studentId}
                    className={`border-b border-border last:border-0 hover:bg-background transition-colors ${
                      i % 2 !== 0 ? 'bg-[#FAFBFD]' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar initials={getInitials(g.studentName)} autoColor size="sm" />
                        <p className="font-medium text-foreground truncate max-w-[140px]">
                          {g.studentName}
                        </p>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                      {g.studentCode}
                    </td>
                    {columns.map((col) => {
                      const b = g.breakdown.find((x) => x.columnId === col.id)
                      const score = b?.score
                      const max = b ? Number(b.maxScore) : col.max
                      const weighted = b?.weightedScore
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-center">
                          {score !== null && score !== undefined ? (
                            <div>
                              <div className="text-[12px] font-semibold text-foreground tabular-nums">
                                {Number(score).toFixed(1)}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  /{max}
                                </span>
                              </div>
                              {weighted !== null && weighted !== undefined && (
                                <div className="text-[10px] text-status-present font-semibold tabular-nums">
                                  {Number(weighted).toFixed(1)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-subtle-foreground text-[12px]">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-right">
                      {g.weightedAverage !== null ? (
                        <div>
                          <span className="text-[13px] font-bold text-foreground tabular-nums">
                            {Number(g.weightedAverage).toFixed(1)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">/100</span>
                        </div>
                      ) : (
                        <span className="text-subtle-foreground text-[12px]">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-2.5 text-right">
                      {g.gradeLetter ? (
                        <span className="text-[12px] font-semibold tabular-nums text-foreground">
                          {g.gradeLetter}
                        </span>
                      ) : (
                        <span className="text-subtle-foreground text-[12px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Student view ──────────────────────────────────────────────────────────
function StudentGrades() {
  const enrollmentsQuery = useQuery<Enrollment[]>({
    queryKey: ['grades', 'me-modules'],
    queryFn: () => client.get('/me/modules').then((r) => r.data.data),
  })
  const marksQuery = useQuery<MarkEntry[]>({
    queryKey: ['grades', 'me-marks'],
    queryFn: () => client.get('/me/marks').then((r) => r.data.data),
  })
  const absenceQuery = useQuery<AbsenceSummaryRow[]>({
    queryKey: ['grades', 'me-absence'],
    queryFn: () => client.get('/me/absence-summary').then((r) => r.data.data),
  })

  const isLoading = enrollmentsQuery.isLoading || marksQuery.isLoading || absenceQuery.isLoading
  const error = enrollmentsQuery.error || marksQuery.error || absenceQuery.error

  // Group marks by module via columnId → moduleId is not on MarkEntry; use studentPortal
  // shape: backend MarkEntryResponse has columnId + columnName + maxScore + score.
  // To group by module we additionally need each enrollment's modules; we use the
  // backend's GET /modules/:id/students/:sid/grade per module to get a clean view.
  // Simpler: call /me/modules then for each, query the per-student grade.
  // Use breakdown returned by per-student grade endpoint.

  type Mark = MarkEntry & { maxScore?: number; columnName?: string; moduleId?: number; moduleName?: string }
  const marks = (marksQuery.data ?? []) as Mark[]

  // Group marks by moduleName when available; otherwise leave under "Other".
  // Backend /me/marks returns MarkEntryResponse which includes columnName but not
  // moduleId/moduleName directly — fall back to grouping by columnName prefix.
  const enrollments = enrollmentsQuery.data ?? []
  const absenceByModule = useMemo(() => {
    const map = new Map<number, AbsenceSummaryRow>()
    for (const row of absenceQuery.data ?? []) map.set(row.moduleId, row)
    return map
  }, [absenceQuery.data])

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <div className="flex justify-between">
          <Sk className="h-6 w-40" />
          <Sk className="h-12 w-32" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <Sk className="h-4 w-48" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((j) => (
                <Sk key={j} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-xl border border-status-absent-border bg-status-absent-bg p-6 text-center">
          <p className="text-sm font-semibold text-status-absent">Could not load grades.</p>
          <button
            onClick={() => {
              enrollmentsQuery.refetch()
              marksQuery.refetch()
              absenceQuery.refetch()
            }}
            className="mt-3 h-8 px-3 text-[12px] font-medium rounded-md border border-border bg-white hover:bg-background"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-[14px] font-semibold text-foreground mb-1">No grades yet</p>
          <p className="text-[13px] text-muted-foreground">
            You are not enrolled in any modules.
          </p>
        </div>
      </div>
    )
  }

  // Aggregate scaled-points totals across all marks (raw / max → counts toward earned).
  let totalEarned = 0
  let totalPossible = 0
  for (const m of marks) {
    const max = Number(m.maxScore ?? 0)
    if (max > 0 && m.score !== null && m.score !== undefined) {
      totalEarned += Number(m.score)
      totalPossible += max
    }
  }

  // Group marks by enrolled module: matching is loose because /me/marks doesn't expose
  // moduleId. We bucket by the substring of columnName that matches a module's name/code.
  const marksByModule = new Map<number, Mark[]>()
  enrollments.forEach((e) => marksByModule.set(e.moduleId, []))
  for (const m of marks) {
    // If backend later adds moduleId/moduleName, prefer that.
    if ((m as Mark).moduleId !== undefined) {
      const list = marksByModule.get((m as Mark).moduleId!) ?? []
      list.push(m)
      marksByModule.set((m as Mark).moduleId!, list)
      continue
    }
    // Fallback: assign to the first enrollment whose moduleName appears in columnName.
    const match = enrollments.find(
      (e) =>
        m.columnName &&
        (m.columnName.toLowerCase().includes(e.moduleName.toLowerCase().split(' ')[0]) ||
          e.moduleName.toLowerCase().includes((m.columnName ?? '').toLowerCase().split(' ')[0])),
    )
    if (match) {
      const list = marksByModule.get(match.moduleId) ?? []
      list.push(m)
      marksByModule.set(match.moduleId, list)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Grades</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Marks earned and weighted contribution toward each module's final score.
          </p>
        </div>
        {totalPossible > 0 && (
          <div className="bg-white border border-border rounded-xl px-4 py-3 text-right shadow-card">
            <p className="text-[24px] font-bold text-foreground tabular-nums">
              {(Math.round(totalEarned * 10) / 10).toFixed(1)}
              <span className="text-[14px] text-muted-foreground font-normal">/{totalPossible}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">pts earned so far</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {enrollments.map((e) => {
          const moduleMarks = marksByModule.get(e.moduleId) ?? []
          const earned = moduleMarks.reduce(
            (a, m) => a + (m.score !== null && m.score !== undefined ? Number(m.score) : 0),
            0,
          )
          const possible = moduleMarks.reduce(
            (a, m) =>
              a +
              (m.score !== null && m.score !== undefined && m.maxScore
                ? Number(m.maxScore)
                : 0),
            0,
          )
          const attend = absenceByModule.get(e.moduleId)?.attendancePercent ?? 0
          return (
            <div key={e.moduleId} className="bg-white rounded-xl border border-border shadow-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-[12px] font-bold font-mono text-brand">
                    Module #{e.moduleId}
                  </span>
                  <p className="text-[14px] font-semibold text-foreground">{e.moduleName}</p>
                </div>
                {possible > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[20px] font-bold text-foreground tabular-nums">
                      {(Math.round(earned * 10) / 10).toFixed(1)}
                      <span className="text-[12px] text-muted-foreground font-normal">/{possible}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">pts earned</p>
                  </div>
                )}
              </div>
              {moduleMarks.length === 0 ? (
                <p className="text-[12px] text-subtle-foreground">No marks recorded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {moduleMarks.map((m) => {
                    const max = Number(m.maxScore ?? 0)
                    const score = m.score !== null && m.score !== undefined ? Number(m.score) : null
                    const graded = score !== null && max > 0
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col items-center text-center p-3 rounded-lg border ${
                          graded
                            ? 'bg-status-present-bg border-status-present-border'
                            : 'bg-background border-border'
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {m.columnName ?? 'Mark'}
                        </p>
                        {graded ? (
                          <>
                            <p className="text-[14px] font-bold text-foreground tabular-nums mt-1">
                              {score!.toFixed(1)}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                /{max}
                              </span>
                            </p>
                            <p className="text-[11px] text-status-present font-semibold tabular-nums">
                              {((score! / max) * 100).toFixed(0)}%
                            </p>
                          </>
                        ) : (
                          <p className="text-[12px] text-subtle-foreground mt-2">—/{max || '—'}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Attendance mini-bar */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  Attendance{' '}
                  <span className={attendanceColorClass(attend)}>{attend.toFixed(0)}%</span>
                </span>
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${attendanceBarClass(attend)}`}
                    style={{ width: `${Math.min(100, Math.max(0, attend))}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Grades() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') return <StudentGrades />
  return <InstructorGrades />
}
