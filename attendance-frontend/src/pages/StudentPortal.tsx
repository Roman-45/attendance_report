import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardCheck, AlertTriangle, Award, FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientStatCard } from './Dashboard'
import { useToast } from '@/hooks/use-toast'

type Tab = 'overview' | 'modules' | 'attendance' | 'marks'

function useActiveTab(): Tab {
  const { pathname } = useLocation()
  if (pathname.endsWith('/modules')) return 'modules'
  if (pathname.endsWith('/attendance')) return 'attendance'
  if (pathname.endsWith('/marks')) return 'marks'
  return 'overview'
}

const tabs: { key: Tab; label: string; path: string }[] = [
  { key: 'overview', label: 'Overview', path: '/portal' },
  { key: 'modules', label: 'My Modules', path: '/portal/modules' },
  { key: 'attendance', label: 'My Attendance', path: '/portal/attendance' },
  { key: 'marks', label: 'My Marks', path: '/portal/marks' },
]

async function downloadBlob(url: string, filename: string) {
  const resp = await client.get(url, { responseType: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([resp.data]))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function StudentPortal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const activeTab = useActiveTab()
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [downloading, setDownloading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDownload = async (path: string, filename: string) => {
    setDownloading(path)
    try {
      await downloadBlob(path, filename)
      toast({ title: 'Downloaded successfully' })
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' })
    } finally {
      setDownloading(null)
    }
  }

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => client.get('/me/profile').then(r => r.data.data),
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['me-modules'],
    queryFn: () => client.get('/me/modules').then(r => r.data.data),
  })

  const { data: attendance = [] } = useQuery({
    queryKey: ['me-attendance'],
    queryFn: () => client.get('/me/attendance').then(r => r.data.data),
  })

  const { data: absenceSummary = [] } = useQuery({
    queryKey: ['me-absence-summary'],
    queryFn: () => client.get('/me/absence-summary').then(r => r.data.data),
  })

  const { data: marks = [] } = useQuery({
    queryKey: ['me-marks'],
    queryFn: () => client.get('/me/marks').then(r => r.data.data),
  })

  // Attendance filtered by module
  const filteredAttendance = moduleFilter === 'all'
    ? attendance
    : attendance.filter((r: { moduleId?: number; moduleName?: string }) =>
        String(r.moduleId) === moduleFilter || r.moduleName === moduleFilter
      )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {profile?.name || user?.name}
        </h1>
        <p className="text-muted-foreground">
          {profile?.program}{profile?.cohortYear ? ` — Cohort ${profile.cohortYear}` : ''}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b overflow-x-auto -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Absence Warnings */}
          {absenceSummary.filter((s: { thresholdExceeded: boolean }) => s.thresholdExceeded).length > 0 && (
            <Card className="border-destructive shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" /> Attendance Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {absenceSummary
                  .filter((s: { thresholdExceeded: boolean }) => s.thresholdExceeded)
                  .map((s: { moduleId: number; moduleName?: string; absencePercent: number; threshold: number }) => (
                    <p key={s.moduleId} className="text-sm">
                      {s.moduleName ?? `Module ${s.moduleId}`}: {s.absencePercent}% absences (threshold: {s.threshold}%)
                    </p>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <GradientStatCard
              label="Enrolled Modules"
              value={modules.length}
              icon={BookOpen}
              gradient="from-blue-500 to-sky-400"
              shadow="shadow-blue-500/20"
            />
            <GradientStatCard
              label="Attendance Records"
              value={attendance.length}
              icon={ClipboardCheck}
              gradient="from-emerald-500 to-teal-400"
              shadow="shadow-emerald-500/20"
            />
            <GradientStatCard
              label="Marks Entered"
              value={marks.length}
              icon={Award}
              gradient="from-violet-500 to-purple-400"
              shadow="shadow-violet-500/20"
            />
          </div>

          {/* Module summary */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Module Summary</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Absence %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No modules enrolled</TableCell></TableRow>
                  ) : (
                    modules.map((m: { moduleId: number; moduleName: string }) => {
                      const summary = absenceSummary.find((s: { moduleId: number }) => s.moduleId === m.moduleId)
                      return (
                        <TableRow key={m.moduleId}>
                          <TableCell className="font-medium">{m.moduleName}</TableCell>
                          <TableCell>{summary ? `${summary.absencePercent}%` : 'N/A'}</TableCell>
                          <TableCell>
                            {summary?.thresholdExceeded ? (
                              <Badge variant="destructive">At Risk</Badge>
                            ) : (
                              <Badge variant="default">Good Standing</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent attendance */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Recent Attendance (last 10)</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No records yet</TableCell></TableRow>
                  ) : (
                    attendance.slice(0, 10).map((r: { id: number; sessionDate: string; moduleName?: string; status: string }, idx: number) => (
                      <TableRow key={r.id ?? idx}>
                        <TableCell>{r.sessionDate}</TableCell>
                        <TableCell className="text-muted-foreground">{r.moduleName ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'PRESENT' ? 'default' : r.status === 'EXCUSED' ? 'secondary' : 'destructive'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── My Modules ───────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>My Enrolled Modules</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Cohort Year</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Absence %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No modules enrolled</TableCell></TableRow>
                ) : (
                  modules.map((m: { moduleId: number; moduleName: string; moduleCode?: string; cohortYear?: number; program?: string }) => {
                    const summary = absenceSummary.find((s: { moduleId: number }) => s.moduleId === m.moduleId)
                    return (
                      <TableRow key={m.moduleId}>
                        <TableCell className="font-medium">{m.moduleName}</TableCell>
                        <TableCell className="text-muted-foreground">{m.moduleCode ?? '—'}</TableCell>
                        <TableCell>{m.cohortYear ?? '—'}</TableCell>
                        <TableCell>{m.program ?? '—'}</TableCell>
                        <TableCell>{summary ? `${summary.absencePercent}%` : 'N/A'}</TableCell>
                        <TableCell>
                          {summary?.thresholdExceeded ? (
                            <Badge variant="destructive">At Risk</Badge>
                          ) : (
                            <Badge variant="default">Good Standing</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── My Attendance ────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Filter by module:</span>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((m: { moduleId: number; moduleName: string }) => (
                  <SelectItem key={m.moduleId} value={String(m.moduleId)}>
                    {m.moduleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Export:</span>
              <Button
                variant="outline" size="sm"
                onClick={() => handleDownload('/me/reports/attendance/excel', 'my_attendance.xlsx')}
                disabled={!!downloading}
              >
                {downloading === '/me/reports/attendance/excel'
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  : <><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel</>
                }
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => handleDownload('/me/reports/attendance/pdf', 'my_attendance.pdf')}
                disabled={!!downloading}
              >
                {downloading === '/me/reports/attendance/pdf'
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  : <><FileText className="h-3.5 w-3.5 mr-1" /> PDF</>
                }
              </Button>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="hidden sm:table-cell">Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                  ) : (
                    filteredAttendance.map((r: { id: number; sessionDate: string; moduleName?: string; period?: string; status: string; consecutiveAbsentFlag?: boolean }, idx: number) => (
                      <TableRow key={r.id ?? idx}>
                        <TableCell>{r.sessionDate}</TableCell>
                        <TableCell className="text-muted-foreground">{r.moduleName ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{r.period ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'PRESENT' ? 'default' : r.status === 'EXCUSED' ? 'secondary' : 'destructive'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.consecutiveAbsentFlag && (
                            <AlertTriangle className="h-4 w-4 text-destructive" aria-label="Consecutive absence flagged" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── My Marks ─────────────────────────────────────────── */}
      {activeTab === 'marks' && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>My Marks</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleDownload('/me/reports/marks/excel', 'my_marks.xlsx')}
                  disabled={!!downloading}
                >
                  {downloading === '/me/reports/marks/excel'
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : <><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel</>
                  }
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleDownload('/me/reports/marks/pdf', 'my_marks.pdf')}
                  disabled={!!downloading}
                >
                  {downloading === '/me/reports/marks/pdf'
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : <><FileText className="h-3.5 w-3.5 mr-1" /> PDF</>
                  }
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden sm:table-cell">Max</TableHead>
                  <TableHead>Weighted %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No marks recorded yet</TableCell></TableRow>
                ) : (
                  marks.map((m: { id: number; moduleName?: string; columnName?: string; markType?: string; score: number; maxMark?: number; weight?: number }, idx: number) => {
                    const weighted = m.maxMark && m.weight
                      ? ((m.score / m.maxMark) * m.weight).toFixed(1)
                      : null
                    return (
                      <TableRow key={m.id ?? idx}>
                        <TableCell className="font-medium">{m.moduleName ?? '—'}</TableCell>
                        <TableCell>{m.columnName ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{m.markType ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{m.score}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{m.maxMark ?? '—'}</TableCell>
                        <TableCell>{weighted != null ? `${weighted}%` : '—'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
