import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, AttendanceSession } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, ClipboardCheck } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/skeleton'

export default function Attendance() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null)
  const [sessionForm, setSessionForm] = useState({ sessionDate: '', startTime: '', endTime: '', period: 'MORNING' })
  const [records, setRecords] = useState<Array<{ studentId: number; studentName: string; status: string }>>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', selectedModuleId],
    queryFn: () => client.get(`/attendance/module/${selectedModuleId}/sessions`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const createSessionMutation = useMutation({
    mutationFn: () => client.post(`/attendance/module/${selectedModuleId}/sessions`, sessionForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', selectedModuleId] })
      setCreateDialogOpen(false)
      toast({ title: 'Session created' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const submitRecordsMutation = useMutation({
    mutationFn: (data: { sessionId: number; records: Array<{ studentId: number; status: string }> }) =>
      client.post(`/attendance/sessions/${data.sessionId}/records`, data.records),
    onSuccess: () => {
      setRecordDialogOpen(false)
      toast({ title: 'Attendance recorded' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const openRecordDialog = async (session: AttendanceSession) => {
    setSelectedSession(session)
    try {
      const { data } = await client.get(`/modules/${selectedModuleId}/enrollments`)
      const enrollments = data.data || []
      setRecords(enrollments.map((e: { studentId: number; studentName: string }) => ({
        studentId: e.studentId, studentName: e.studentName, status: 'PRESENT',
      })))
      setRecordDialogOpen(true)
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load enrolled students' })
    }
  }

  const toggleStatus = (idx: number) => {
    setRecords(prev => prev.map((r, i) =>
      i === idx ? { ...r, status: r.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : r
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        {selectedModuleId && (
          <Button onClick={() => { setSessionForm({ sessionDate: '', startTime: '', endTime: '', period: 'MORNING' }); setCreateDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> New Session
          </Button>
        )}
      </div>

      <div className="max-w-sm">
        <Label>Select Module</Label>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger><SelectValue placeholder="Choose a module" /></SelectTrigger>
          <SelectContent>
            {modules.map((m: Module) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedModuleId && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No sessions yet</TableCell></TableRow>
                ) : (
                  sessions.map((s: AttendanceSession) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.sessionDate}</TableCell>
                      <TableCell>{s.startTime} - {s.endTime}</TableCell>
                      <TableCell><Badge variant="secondary">{s.period}</Badge></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openRecordDialog(s)}>
                          <ClipboardCheck className="h-4 w-4 mr-1" /> Record
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Attendance Session</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSessionMutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm(f => ({ ...f, sessionDate: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={sessionForm.endTime} onChange={(e) => setSessionForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={sessionForm.period} onValueChange={(v) => setSessionForm(f => ({ ...f, period: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createSessionMutation.isPending}>
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Attendance Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, idx) => (
                  <TableRow key={r.studentId}>
                    <TableCell>{r.studentName}</TableCell>
                    <TableCell>
                      <Button
                        variant={r.status === 'PRESENT' ? 'default' : 'destructive'}
                        size="sm"
                        onClick={() => toggleStatus(idx)}
                      >
                        {r.status}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedSession && submitRecordsMutation.mutate({
                sessionId: selectedSession.id,
                records: records.map(r => ({ studentId: r.studentId, status: r.status })),
              })}
              disabled={submitRecordsMutation.isPending}
            >
              {submitRecordsMutation.isPending ? 'Saving...' : 'Submit Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
