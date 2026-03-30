import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import type { ClassroomLayout, Claim, Team, ClaimType, ClaimStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardCheck, AlertTriangle, Award, FileSpreadsheet, FileText, Grid3X3, MessageSquareWarning, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientStatCard } from './Dashboard'
import { useToast } from '@/hooks/use-toast'
import { SeatingGrid } from '@/components/SeatingGrid'
import { format } from 'date-fns'

type Tab = 'overview' | 'modules' | 'attendance' | 'marks' | 'seating' | 'claims'

function useActiveTab(): Tab {
  const { pathname } = useLocation()
  if (pathname.endsWith('/modules')) return 'modules'
  if (pathname.endsWith('/attendance')) return 'attendance'
  if (pathname.endsWith('/marks')) return 'marks'
  if (pathname.endsWith('/seating')) return 'seating'
  if (pathname.endsWith('/claims')) return 'claims'
  return 'overview'
}

const tabs: { key: Tab; label: string; path: string }[] = [
  { key: 'overview', label: 'Overview', path: '/portal' },
  { key: 'modules', label: 'My Modules', path: '/portal/modules' },
  { key: 'attendance', label: 'My Attendance', path: '/portal/attendance' },
  { key: 'marks', label: 'My Marks', path: '/portal/marks' },
  { key: 'seating', label: 'My Seat', path: '/portal/seating' },
  { key: 'claims', label: 'My Claims', path: '/portal/claims' },
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
  const queryClient = useQueryClient()
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [seatModuleId, setSeatModuleId] = useState<string>('')
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimForm, setClaimForm] = useState({ moduleId: '', claimType: '' as '' | ClaimType, targetId: '', description: '' })
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
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
          Welcome, {profile?.name || user?.name}
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          {profile?.program}{profile?.cohortYear ? ` — Cohort ${profile.cohortYear}` : ''}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#E2E8F0] dark:border-[#1E3A5F] overflow-x-auto -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#94A3B8]'
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
            <Card className="border-[#DC2626] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#DC2626]">
                  <AlertTriangle className="h-5 w-5" /> Attendance Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {absenceSummary
                  .filter((s: { thresholdExceeded: boolean }) => s.thresholdExceeded)
                  .map((s: { moduleId: number; moduleName?: string; absencePercent: number; threshold: number }) => (
                    <p key={s.moduleId} className="text-sm text-[#334155]">
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
              gradient="from-[#4F46E5] to-[#7C3AED]"
              shadow="shadow-[#4F46E5]/20"
            />
            <GradientStatCard
              label="Attendance Records"
              value={attendance.length}
              icon={ClipboardCheck}
              gradient="from-[#059669] to-[#0D9488]"
              shadow="shadow-[#059669]/20"
            />
            <GradientStatCard
              label="Marks Entered"
              value={marks.length}
              icon={Award}
              gradient="from-[#D97706] to-[#EA580C]"
              shadow="shadow-[#D97706]/20"
            />
          </div>

          {/* Module summary */}
          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardHeader>
              <CardTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Module Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                    <TableHead className="text-[#64748B]">Module</TableHead>
                    <TableHead className="text-[#64748B]">Absence %</TableHead>
                    <TableHead className="text-[#64748B]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-[#94A3B8]">No modules enrolled</TableCell>
                    </TableRow>
                  ) : (
                    modules.map((m: { moduleId: number; moduleName: string }) => {
                      const summary = absenceSummary.find((s: { moduleId: number }) => s.moduleId === m.moduleId)
                      return (
                        <TableRow key={m.moduleId} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                          <TableCell className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{m.moduleName}</TableCell>
                          <TableCell className="text-[#334155]">{summary ? `${summary.absencePercent}%` : 'N/A'}</TableCell>
                          <TableCell>
                            {summary?.thresholdExceeded ? (
                              <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]">At Risk</Badge>
                            ) : (
                              <Badge className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#ECFDF5]">Good Standing</Badge>
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
          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardHeader>
              <CardTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Recent Attendance (last 10)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                    <TableHead className="text-[#64748B]">Date</TableHead>
                    <TableHead className="text-[#64748B]">Module</TableHead>
                    <TableHead className="text-[#64748B]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-[#94A3B8]">No records yet</TableCell>
                    </TableRow>
                  ) : (
                    attendance.slice(0, 10).map((r: { id: number; sessionDate: string; moduleName?: string; status: string }, idx: number) => (
                      <TableRow key={r.id ?? idx} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <TableCell className="text-[#334155]">{r.sessionDate}</TableCell>
                        <TableCell className="text-[#64748B]">{r.moduleName ?? '—'}</TableCell>
                        <TableCell>
                          {r.status === 'PRESENT' ? (
                            <Badge className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#ECFDF5]">{r.status}</Badge>
                          ) : r.status === 'EXCUSED' ? (
                            <Badge className="bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#F0F9FF]">{r.status}</Badge>
                          ) : (
                            <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]">{r.status}</Badge>
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

      {/* ── My Modules ───────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardHeader>
            <CardTitle className="text-[#0F172A] dark:text-[#F1F5F9]">My Enrolled Modules</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <TableHead className="text-[#64748B]">Module Name</TableHead>
                  <TableHead className="text-[#64748B]">Code</TableHead>
                  <TableHead className="text-[#64748B]">Cohort Year</TableHead>
                  <TableHead className="text-[#64748B]">Program</TableHead>
                  <TableHead className="text-[#64748B]">Absence %</TableHead>
                  <TableHead className="text-[#64748B]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#94A3B8]">No modules enrolled</TableCell>
                  </TableRow>
                ) : (
                  modules.map((m: { moduleId: number; moduleName: string; moduleCode?: string; cohortYear?: number; program?: string }) => {
                    const summary = absenceSummary.find((s: { moduleId: number }) => s.moduleId === m.moduleId)
                    return (
                      <TableRow key={m.moduleId} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <TableCell className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{m.moduleName}</TableCell>
                        <TableCell className="text-[#64748B]">{m.moduleCode ?? '—'}</TableCell>
                        <TableCell className="text-[#334155]">{m.cohortYear ?? '—'}</TableCell>
                        <TableCell className="text-[#334155]">{m.program ?? '—'}</TableCell>
                        <TableCell className="text-[#334155]">{summary ? `${summary.absencePercent}%` : 'N/A'}</TableCell>
                        <TableCell>
                          {summary?.thresholdExceeded ? (
                            <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]">At Risk</Badge>
                          ) : (
                            <Badge className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#ECFDF5]">Good Standing</Badge>
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
              <span className="text-sm font-medium text-[#334155]">Filter by module:</span>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-56 border-[#E2E8F0] text-[#334155]">
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
              <span className="text-xs text-[#94A3B8] mr-1">Export:</span>
              <Button
                variant="outline" size="sm"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                onClick={() => handleDownload('/me/reports/attendance/excel', 'my_attendance.xlsx')}
                disabled={!!downloading}
              >
                {downloading === '/me/reports/attendance/excel'
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                  : <><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel</>
                }
              </Button>
              <Button
                variant="outline" size="sm"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                onClick={() => handleDownload('/me/reports/attendance/pdf', 'my_attendance.pdf')}
                disabled={!!downloading}
              >
                {downloading === '/me/reports/attendance/pdf'
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                  : <><FileText className="h-3.5 w-3.5 mr-1" /> PDF</>
                }
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardHeader>
              <CardTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Attendance Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                    <TableHead className="text-[#64748B]">Date</TableHead>
                    <TableHead className="text-[#64748B]">Module</TableHead>
                    <TableHead className="text-[#64748B] hidden sm:table-cell">Period</TableHead>
                    <TableHead className="text-[#64748B]">Status</TableHead>
                    <TableHead className="text-[#64748B]">Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-[#94A3B8]">No records found</TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendance.map((r: { id: number; sessionDate: string; moduleName?: string; period?: string; status: string; consecutiveAbsentFlag?: boolean }, idx: number) => (
                      <TableRow key={r.id ?? idx} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <TableCell className="text-[#334155]">{r.sessionDate}</TableCell>
                        <TableCell className="text-[#64748B]">{r.moduleName ?? '—'}</TableCell>
                        <TableCell className="text-[#64748B] hidden sm:table-cell">{r.period ?? '—'}</TableCell>
                        <TableCell>
                          {r.status === 'PRESENT' ? (
                            <Badge className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#ECFDF5]">{r.status}</Badge>
                          ) : r.status === 'EXCUSED' ? (
                            <Badge className="bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#F0F9FF]">{r.status}</Badge>
                          ) : (
                            <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]">{r.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.consecutiveAbsentFlag && (
                            <AlertTriangle className="h-4 w-4 text-[#DC2626]" aria-label="Consecutive absence flagged" />
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
        <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-[#0F172A] dark:text-[#F1F5F9]">My Marks</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline" size="sm"
                  className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  onClick={() => handleDownload('/me/reports/marks/excel', 'my_marks.xlsx')}
                  disabled={!!downloading}
                >
                  {downloading === '/me/reports/marks/excel'
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                    : <><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel</>
                  }
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  onClick={() => handleDownload('/me/reports/marks/pdf', 'my_marks.pdf')}
                  disabled={!!downloading}
                >
                  {downloading === '/me/reports/marks/pdf'
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                    : <><FileText className="h-3.5 w-3.5 mr-1" /> PDF</>
                  }
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <TableHead className="text-[#64748B]">Module</TableHead>
                  <TableHead className="text-[#64748B]">Assessment</TableHead>
                  <TableHead className="text-[#64748B] hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-[#64748B]">Score</TableHead>
                  <TableHead className="text-[#64748B] hidden sm:table-cell">Max</TableHead>
                  <TableHead className="text-[#64748B]">Weighted %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#94A3B8]">No marks recorded yet</TableCell>
                  </TableRow>
                ) : (
                  marks.map((m: { id: number; moduleName?: string; columnName?: string; markType?: string; score: number; maxMark?: number; weight?: number }, idx: number) => {
                    const weighted = m.maxMark && m.weight
                      ? ((m.score / m.maxMark) * m.weight).toFixed(1)
                      : null
                    return (
                      <TableRow key={m.id ?? idx} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                        <TableCell className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{m.moduleName ?? '—'}</TableCell>
                        <TableCell className="text-[#334155]">{m.columnName ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs border-[#E2E8F0] text-[#64748B]">{m.markType ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{m.score}</TableCell>
                        <TableCell className="text-[#64748B] hidden sm:table-cell">{m.maxMark ?? '—'}</TableCell>
                        <TableCell className="text-[#334155]">{weighted != null ? `${weighted}%` : '—'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── My Seat ──────────────────────────────────────────── */}
      {activeTab === 'seating' && <SeatingTab modules={modules} seatModuleId={seatModuleId} setSeatModuleId={setSeatModuleId} profileStudentId={profile?.id} />}

      {/* ── My Claims ────────────────────────────────────────── */}
      {activeTab === 'claims' && (
        <ClaimsTab
          modules={modules}
          claimOpen={claimOpen}
          setClaimOpen={setClaimOpen}
          claimForm={claimForm}
          setClaimForm={setClaimForm}
          queryClient={queryClient}
          toast={toast}
        />
      )}
    </div>
  )
}

// ── Seating Tab Component ────────────────────────────────────

function SeatingTab({ modules, seatModuleId, setSeatModuleId, profileStudentId }: {
  modules: { moduleId: number; moduleName: string }[]
  seatModuleId: string
  setSeatModuleId: (v: string) => void
  profileStudentId?: number
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: layout } = useQuery<ClassroomLayout>({
    queryKey: ['my-seating-layout', seatModuleId],
    queryFn: () => client.get(`/modules/${seatModuleId}/seating/layout`).then(r => r.data.data),
    enabled: !!seatModuleId,
    retry: false,
  })

  const { data: myTeam } = useQuery<Team>({
    queryKey: ['my-team', seatModuleId],
    queryFn: () => client.get(`/me/teams/${seatModuleId}`).then(r => r.data.data),
    enabled: !!seatModuleId,
    retry: false,
  })

  const isLeader = myTeam?.leaderStudentId === profileStudentId

  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['my-team-members', myTeam?.id],
    queryFn: () => client.get(`/modules/${seatModuleId}/teams/${myTeam!.id}/members`).then(r => r.data.data),
    enabled: !!myTeam && isLeader,
  })

  const assignMutation = useMutation({
    mutationFn: () => client.post(`/modules/${seatModuleId}/seating/assign`, {
      studentId: Number(selectedStudentId),
      rowNumber: selectedSeat!.row,
      columnNumber: selectedSeat!.col,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seating-layout', seatModuleId] })
      setAssignOpen(false)
      toast({ title: 'Seat assigned' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const assignedStudentIds = new Set(layout?.seats.map(s => s.studentId) || [])

  const handleSeatClick = (row: number, col: number, assignment?: { studentId: number }) => {
    if (assignment || !isLeader) return
    setSelectedSeat({ row, col })
    setSelectedStudentId('')
    setAssignOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Label className="text-[#334155]">Select Module</Label>
        <Select value={seatModuleId} onValueChange={setSeatModuleId}>
          <SelectTrigger className="border-[#E2E8F0] text-[#334155]">
            <SelectValue placeholder="Choose a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m: { moduleId: number; moduleName: string }) => (
              <SelectItem key={m.moduleId} value={String(m.moduleId)}>{m.moduleName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {seatModuleId && !layout && (
        <Card className="border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]" />
            <p className="text-[#64748B]">No classroom layout available for this module</p>
          </CardContent>
        </Card>
      )}

      {layout && (
        <Card className="border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <Grid3X3 className="h-5 w-5" />
              Classroom Seating
              {isLeader && (
                <Badge className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FFFBEB] ml-2">Team Leader — click empty seats to assign</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeatingGrid
              layout={layout}
              readOnly={!isLeader}
              onSeatClick={isLeader ? handleSeatClick : undefined}
              highlightStudentId={profileStudentId}
            />
          </CardContent>
        </Card>
      )}

      {/* Leader assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Assign Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-[#334155]">Select Team Member</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="border-[#E2E8F0] text-[#334155]">
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers
                  .filter((m: { studentId: number }) => !assignedStudentIds.has(m.studentId))
                  .map((m: { studentId: number; studentName: string; registrationNumber: string }) => (
                    <SelectItem key={m.studentId} value={String(m.studentId)}>
                      {m.studentName} ({m.registrationNumber})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStudentId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Seat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Claims Tab Component ─────────────────────────────────────

const claimStatusBadge: Record<ClaimStatus, string> = {
  PENDING: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FFFBEB]',
  APPROVED: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#ECFDF5]',
  REJECTED: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]',
}

function ClaimsTab({ modules, claimOpen, setClaimOpen, claimForm, setClaimForm, queryClient, toast }: {
  modules: { moduleId: number; moduleName: string }[]
  claimOpen: boolean
  setClaimOpen: (v: boolean) => void
  claimForm: { moduleId: string; claimType: '' | ClaimType; targetId: string; description: string }
  setClaimForm: React.Dispatch<React.SetStateAction<{ moduleId: string; claimType: '' | ClaimType; targetId: string; description: string }>>
  queryClient: ReturnType<typeof useQueryClient>
  toast: ReturnType<typeof useToast>['toast']
}) {
  const { data: claims = [] } = useQuery<Claim[]>({
    queryKey: ['my-claims'],
    queryFn: () => client.get('/me/claims').then(r => r.data.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => client.post('/claims', {
      moduleId: Number(claimForm.moduleId),
      claimType: claimForm.claimType,
      targetId: claimForm.targetId ? Number(claimForm.targetId) : null,
      description: claimForm.description,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-claims'] })
      setClaimOpen(false)
      toast({ title: 'Claim submitted' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          onClick={() => {
            setClaimForm({ moduleId: '', claimType: '', targetId: '', description: '' })
            setClaimOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Claim
        </Button>
      </div>

      <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
            <MessageSquareWarning className="h-5 w-5" />
            My Claims
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                <TableHead className="text-[#64748B]">Module</TableHead>
                <TableHead className="text-[#64748B]">Type</TableHead>
                <TableHead className="text-[#64748B] hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-[#64748B]">Status</TableHead>
                <TableHead className="text-[#64748B] hidden md:table-cell">Resolution</TableHead>
                <TableHead className="text-[#64748B] hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#94A3B8]">
                    No claims submitted yet
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((c) => (
                  <TableRow key={c.id} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                    <TableCell className="text-sm text-[#334155]">{c.moduleName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-[#E2E8F0] text-[#64748B]">{c.claimType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#64748B] max-w-[200px] truncate hidden sm:table-cell">
                      {c.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${claimStatusBadge[c.status]}`}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#64748B] hidden md:table-cell">
                      {c.resolutionNote || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-[#94A3B8] hidden sm:table-cell">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Claim Dialog */}
      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Submit a Claim</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#334155]">Module</Label>
              <Select value={claimForm.moduleId} onValueChange={(v) => setClaimForm(f => ({ ...f, moduleId: v }))}>
                <SelectTrigger className="border-[#E2E8F0] text-[#334155]">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m: { moduleId: number; moduleName: string }) => (
                    <SelectItem key={m.moduleId} value={String(m.moduleId)}>{m.moduleName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155]">Claim Type</Label>
              <Select value={claimForm.claimType} onValueChange={(v) => setClaimForm(f => ({ ...f, claimType: v as ClaimType }))}>
                <SelectTrigger className="border-[#E2E8F0] text-[#334155]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                  <SelectItem value="MARK">Mark / Grade</SelectItem>
                  <SelectItem value="SEAT">Seat Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155]">Description</Label>
              <Textarea
                value={claimForm.description}
                onChange={(e) => setClaimForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your claim in detail..."
                className="border-[#E2E8F0] text-[#334155] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5]"
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                disabled={!claimForm.moduleId || !claimForm.claimType || !claimForm.description || submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
