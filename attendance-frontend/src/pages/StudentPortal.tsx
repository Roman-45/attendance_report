import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ClipboardCheck, AlertTriangle, Award } from 'lucide-react'

export default function StudentPortal() {
  const { user } = useAuth()

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.name || user?.name}</h1>
        <p className="text-muted-foreground">{profile?.program} — Cohort {profile?.cohortYear}</p>
      </div>

      {/* Absence Warnings */}
      {absenceSummary.filter((s: { thresholdExceeded: boolean }) => s.thresholdExceeded).length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Attendance Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absenceSummary.filter((s: { thresholdExceeded: boolean }) => s.thresholdExceeded).map((s: { moduleId: number; absencePercent: number; threshold: number }) => (
              <p key={s.moduleId} className="text-sm">
                Module {s.moduleId}: {s.absencePercent}% absences (threshold: {s.threshold}%)
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marks Entered</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Modules */}
      <Card>
        <CardHeader><CardTitle>My Modules</CardTitle></CardHeader>
        <CardContent className="p-0">
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
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No modules</TableCell></TableRow>
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

      {/* Recent Attendance */}
      <Card>
        <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
              ) : (
                attendance.slice(0, 10).map((r: { id: number; sessionDate: string; status: string }, idx: number) => (
                  <TableRow key={r.id ?? idx}>
                    <TableCell>{r.sessionDate}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'PRESENT' ? 'default' : 'destructive'}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
