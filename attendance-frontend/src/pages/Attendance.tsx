import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, AttendanceSession } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, ClipboardCheck, Calendar, Clock, Sun, Sunset, Moon, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

const periodConfig: Record<string, { icon: typeof Sun; color: string; bg: string }> = {
  MORNING: { icon: Sun, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB] dark:bg-[#D97706]/10' },
  AFTERNOON: { icon: Sunset, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB] dark:bg-[#D97706]/10' },
  EVENING: { icon: Moon, color: 'text-[#7C3AED]', bg: 'bg-[#EEF2FF] dark:bg-[#7C3AED]/10' },
}

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

  const presentCount = records.filter(r => r.status === 'PRESENT').length
  const absentCount = records.filter(r => r.status === 'ABSENT').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Attendance</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Create sessions and record student attendance</p>
        </div>
        {selectedModuleId && (
          <Button onClick={() => {
            setSessionForm({ sessionDate: '', startTime: '', endTime: '', period: 'MORNING' })
            setCreateDialogOpen(true)
          }} className="shadow-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus className="h-4 w-4 mr-2" /> New Session
          </Button>
        )}
      </div>

      {/* Module selector */}
      <div className="max-w-sm">
        <Label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Module</Label>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger className="mt-1 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9]">
            <SelectValue placeholder="Choose a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m: Module) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Session cards */}
      {selectedModuleId && (
        <>
          {sessionsLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 w-24 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                    <div className="h-3 w-32 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!sessionsLoading && sessions.length === 0 && (
            <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] dark:bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="h-8 w-8 text-[#818CF8]" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No sessions yet</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">Create a session to start recording attendance</p>
                <Button
                  onClick={() => {
                    setSessionForm({ sessionDate: '', startTime: '', endTime: '', period: 'MORNING' })
                    setCreateDialogOpen(true)
                  }}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Session
                </Button>
              </CardContent>
            </Card>
          )}

          {sessions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s: AttendanceSession) => {
                const period = periodConfig[s.period] || periodConfig.MORNING
                const PeriodIcon = period.icon
                return (
                  <Card
                    key={s.id}
                    className="group hover:shadow-md transition-all border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] hover:border-[#CBD5E1] dark:hover:border-[#1E3A5F]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", period.bg)}>
                          <PeriodIcon className={cn("h-5 w-5", period.color)} />
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-[#E2E8F0] dark:border-[#1E3A5F] text-[#64748B] dark:text-[#94A3B8]"
                        >
                          {s.period}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
                        <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{s.sessionDate}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                        <Clock className="h-3 w-3" />
                        <span>{s.startTime} — {s.endTime}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-[#E2E8F0] dark:border-[#1E3A5F] text-[#4F46E5] hover:text-[#4338CA] hover:border-[#CBD5E1] hover:bg-[#EEF2FF] dark:hover:bg-[#4F46E5]/10"
                        onClick={() => openRecordDialog(s)}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Record Attendance
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F46E5]/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#4F46E5]" />
              </div>
              New Attendance Session
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSessionMutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Date</Label>
              <Input
                type="date"
                value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm(f => ({ ...f, sessionDate: e.target.value }))}
                required
                className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9] bg-[#FFFFFF] dark:bg-[#111827] focus:border-[#4F46E5]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#F1F5F9]">Start Time</Label>
                <Input
                  type="time"
                  value={sessionForm.startTime}
                  onChange={(e) => setSessionForm(f => ({ ...f, startTime: e.target.value }))}
                  required
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9] bg-[#FFFFFF] dark:bg-[#111827] focus:border-[#4F46E5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#F1F5F9]">End Time</Label>
                <Input
                  type="time"
                  value={sessionForm.endTime}
                  onChange={(e) => setSessionForm(f => ({ ...f, endTime: e.target.value }))}
                  required
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9] bg-[#FFFFFF] dark:bg-[#111827] focus:border-[#4F46E5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Period</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map(p => {
                  const cfg = periodConfig[p]
                  const PIcon = cfg.icon
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSessionForm(f => ({ ...f, period: p }))}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm font-medium",
                        sessionForm.period === p
                          ? "border-[#4F46E5] bg-[#EEF2FF] dark:bg-[#4F46E5]/10 text-[#4F46E5]"
                          : "border-[#E2E8F0] dark:border-[#1E3A5F] text-[#64748B] dark:text-[#94A3B8] hover:border-[#818CF8]",
                      )}
                    >
                      <PIcon className="h-4 w-4" />
                      <span className="text-xs capitalize">{p.toLowerCase()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createSessionMutation.isPending}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Attendance Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-xl bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F46E5]/10 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Record Attendance
            </DialogTitle>
          </DialogHeader>

          {/* Summary bar */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ECFDF5] dark:bg-[#059669]/10 border border-[#A7F3D0] dark:border-[#059669]/30">
              <UserCheck className="h-4 w-4 text-[#059669]" />
              <span className="text-sm font-semibold text-[#059669] dark:text-[#059669]">{presentCount}</span>
              <span className="text-xs text-[#059669]/70">Present</span>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FEF2F2] dark:bg-[#DC2626]/10 border border-[#FECACA] dark:border-[#DC2626]/30">
              <UserX className="h-4 w-4 text-[#DC2626]" />
              <span className="text-sm font-semibold text-[#DC2626] dark:text-[#DC2626]">{absentCount}</span>
              <span className="text-xs text-[#DC2626]/70">Absent</span>
            </div>
          </div>

          {/* Student list */}
          <div className="max-h-80 overflow-auto space-y-1 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] p-1">
            {records.map((r, idx) => (
              <button
                key={r.studentId}
                onClick={() => toggleStatus(idx)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all text-sm",
                  r.status === 'PRESENT'
                    ? "bg-[#ECFDF5] dark:bg-[#059669]/10 hover:bg-[#A7F3D0]/40 dark:hover:bg-[#059669]/20"
                    : "bg-[#FEF2F2] dark:bg-[#DC2626]/10 hover:bg-[#FECACA]/40 dark:hover:bg-[#DC2626]/20",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    r.status === 'PRESENT' ? "bg-[#059669]" : "bg-[#DC2626]",
                  )}>
                    {r.studentName.charAt(0)}
                  </div>
                  <span className="font-medium text-[#334155] dark:text-[#F1F5F9]">{r.studentName}</span>
                </div>
                <Badge
                  className={cn("text-[10px]",
                    r.status === 'PRESENT'
                      ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] dark:bg-[#059669]/20 dark:text-[#059669] dark:border-[#059669]/30"
                      : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] dark:bg-[#DC2626]/20 dark:text-[#DC2626] dark:border-[#DC2626]/30",
                  )}
                >
                  {r.status === 'PRESENT' ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                  {r.status}
                </Badge>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              onClick={() => selectedSession && submitRecordsMutation.mutate({
                sessionId: selectedSession.id,
                records: records.map(r => ({ studentId: r.studentId, status: r.status })),
              })}
              disabled={submitRecordsMutation.isPending}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {submitRecordsMutation.isPending ? 'Saving...' : 'Submit Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
