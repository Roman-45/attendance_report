import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  FileSpreadsheet, FileText, Download, Plus, Trash2,
  Play, Clock, CalendarDays, Mail, RefreshCw
} from 'lucide-react'

interface ScheduledReportConfig {
  id: number
  module: { id: number; code: string; name: string }
  reportType: string
  frequency: string
  recipientEmail: string
  enabled: boolean
  lastSentAt: string | null
  createdBy: { id: number; name: string }
  createdAt: string
}

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily', icon: RefreshCw, description: 'Sent every day at 6:00 AM' },
  { value: 'WEEKLY', label: 'Weekly', icon: CalendarDays, description: 'Sent every Monday at 7:00 AM' },
  { value: 'MONTHLY', label: 'Monthly', icon: Clock, description: 'Sent on the 1st of each month at 8:00 AM' },
]

const REPORT_TYPES = [
  { value: 'ATTENDANCE', label: 'Attendance Report' },
  { value: 'MARKS', label: 'Marks Report' },
]

const frequencyBadgeClass: Record<string, string> = {
  DAILY:   'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
  WEEKLY:  'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]',
  MONTHLY: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
}

const reportTypeBadgeClass: Record<string, string> = {
  ATTENDANCE: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  MARKS:      'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
}

export default function Reports() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [triggeringFrequency, setTriggeringFrequency] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    moduleId: '',
    reportType: 'ATTENDANCE',
    frequency: 'WEEKLY',
    recipientEmail: '',
  })

  const { toast } = useToast()
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = hasRole('ADMIN')

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: scheduledReports = [], isLoading: scheduledLoading } = useQuery<ScheduledReportConfig[]>({
    queryKey: ['scheduled-reports'],
    queryFn: () => client.get('/scheduled-reports').then(r => r.data.data),
    enabled: isAdmin,
  })

  const createScheduleMutation = useMutation({
    mutationFn: (form: typeof scheduleForm) =>
      client.post('/scheduled-reports', {
        moduleId: Number(form.moduleId),
        reportType: form.reportType,
        frequency: form.frequency,
        recipientEmail: form.recipientEmail.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] })
      setScheduleDialogOpen(false)
      setScheduleForm({ moduleId: '', reportType: 'ATTENDANCE', frequency: 'WEEKLY', recipientEmail: '' })
      toast({ title: 'Scheduled report created' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create scheduled report'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/scheduled-reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] })
      toast({ title: 'Scheduled report deleted' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete' }),
  })

  const triggerMutation = useMutation({
    mutationFn: (frequency: string) => client.post(`/scheduled-reports/trigger/${frequency}`),
    onMutate: (frequency) => setTriggeringFrequency(frequency),
    onSuccess: (_data, frequency) => {
      toast({ title: `${frequency.charAt(0) + frequency.slice(1).toLowerCase()} reports triggered`, description: 'Emails are being sent to recipients' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to trigger reports' }),
    onSettled: () => setTriggeringFrequency(null),
  })

  const downloadReport = async (type: 'attendance' | 'marks', format: 'excel' | 'pdf') => {
    if (!selectedModuleId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a module' })
      return
    }
    const key = `${type}-${format}`
    setDownloading(key)
    try {
      const response = await client.get(`/reports/modules/${selectedModuleId}/${type}/${format}`, {
        responseType: 'blob',
      })
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}_report.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Report downloaded' })
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate report' })
    } finally {
      setDownloading(null)
    }
  }

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createScheduleMutation.mutate(scheduleForm)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Reports</h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
          Download module reports or configure automated email delivery
        </p>
      </div>

      {/* ── Manual Download Section ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Manual Download</h2>
        <div className="max-w-sm">
          <Label className="text-[#334155] dark:text-[#94A3B8]">Select Module</Label>
          <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
            <SelectTrigger><SelectValue placeholder="Choose a module" /></SelectTrigger>
            <SelectContent>
              {modules.map((m: Module) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
                <FileSpreadsheet className="h-5 w-5 text-[#059669]" /> Attendance Report
              </CardTitle>
              <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">
                Download attendance records for the selected module
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                onClick={() => downloadReport('attendance', 'excel')}
                disabled={!!downloading || !selectedModuleId}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'attendance-excel' ? 'Downloading…' : 'Excel'}
              </Button>
              <Button
                variant="outline"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                onClick={() => downloadReport('attendance', 'pdf')}
                disabled={!!downloading || !selectedModuleId}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'attendance-pdf' ? 'Downloading…' : 'PDF'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
                <FileText className="h-5 w-5 text-[#4F46E5]" /> Marks Report
              </CardTitle>
              <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">
                Download marks and grades for the selected module
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                onClick={() => downloadReport('marks', 'excel')}
                disabled={!!downloading || !selectedModuleId}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'marks-excel' ? 'Downloading…' : 'Excel'}
              </Button>
              <Button
                variant="outline"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                onClick={() => downloadReport('marks', 'pdf')}
                disabled={!!downloading || !selectedModuleId}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'marks-pdf' ? 'Downloading…' : 'PDF'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Scheduled Reports Section (Admin only) ── */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Scheduled Email Reports</h2>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                Automatically send reports to recipients on a recurring schedule
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Manual trigger buttons */}
              {FREQUENCIES.map(f => (
                <Button
                  key={f.value}
                  variant="outline"
                  size="sm"
                  className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                  onClick={() => triggerMutation.mutate(f.value)}
                  disabled={!!triggeringFrequency}
                  title={`Manually trigger all ${f.label.toLowerCase()} reports now`}
                >
                  {triggeringFrequency === f.value ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {f.label}
                </Button>
              ))}
              <Button
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF]"
                onClick={() => setScheduleDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> New Schedule
              </Button>
            </div>
          </div>

          <Card className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#1E293B]">
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Module</TableHead>
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Report Type</TableHead>
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Frequency</TableHead>
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Recipient</TableHead>
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Last Sent</TableHead>
                    <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Created By</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse border-[#E2E8F0] dark:border-[#1E3A5F]">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}>
                            <div className="h-4 rounded bg-[#F1F5F9] dark:bg-[#1E293B] w-3/4" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : scheduledReports.length === 0 ? (
                    <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                      <TableCell colSpan={7} className="text-center py-12 text-[#94A3B8] dark:text-[#64748B]">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No scheduled reports yet. Click "New Schedule" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scheduledReports.map(r => (
                      <TableRow key={r.id} className="border-[#E2E8F0] dark:border-[#1E3A5F] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-[#0F172A] dark:text-[#F1F5F9]">{r.module?.name ?? '—'}</p>
                            <p className="text-xs text-[#94A3B8] font-mono">{r.module?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${reportTypeBadgeClass[r.reportType] ?? 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]'}`}>
                            {r.reportType === 'ATTENDANCE' ? 'Attendance' : 'Marks'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${frequencyBadgeClass[r.frequency] ?? 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]'}`}>
                            {r.frequency.charAt(0) + r.frequency.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-[#334155] dark:text-[#94A3B8]">
                            <Mail className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                            <span className="truncate max-w-[180px]">{r.recipientEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          {r.lastSentAt
                            ? new Date(r.lastSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : <span className="text-[#94A3B8]/50">Never</span>
                          }
                        </TableCell>
                        <TableCell className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          {r.createdBy?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                            onClick={() => deleteScheduleMutation.mutate(r.id)}
                            disabled={deleteScheduleMutation.isPending}
                            title="Delete schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Schedule frequency info */}
          <div className="grid gap-3 md:grid-cols-3">
            {FREQUENCIES.map(f => (
              <div
                key={f.value}
                className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] px-4 py-3"
              >
                <div className="rounded-full bg-[#EEF2FF] dark:bg-[#1E293B] p-2 shrink-0">
                  <f.icon className="h-4 w-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">{f.label}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Create Scheduled Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Module</Label>
              <Select
                value={scheduleForm.moduleId}
                onValueChange={v => setScheduleForm(f => ({ ...f, moduleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <span className="font-mono text-xs mr-2 text-[#94A3B8]">{m.code}</span>{m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Report Type</Label>
                <Select
                  value={scheduleForm.reportType}
                  onValueChange={v => setScheduleForm(f => ({ ...f, reportType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Frequency</Label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={v => setScheduleForm(f => ({ ...f, frequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(fr => (
                      <SelectItem key={fr.value} value={fr.value}>{fr.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Recipient Email</Label>
              <Input
                type="email"
                value={scheduleForm.recipientEmail}
                onChange={e => setScheduleForm(f => ({ ...f, recipientEmail: e.target.value }))}
                placeholder="reports@example.com"
                required
              />
            </div>

            {scheduleForm.frequency && (
              <div className="rounded-lg bg-[#EEF2FF] dark:bg-[#1E293B] px-3 py-2 text-xs text-[#4F46E5] dark:text-[#94A3B8]">
                {FREQUENCIES.find(f => f.value === scheduleForm.frequency)?.description}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                onClick={() => setScheduleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF]"
                disabled={createScheduleMutation.isPending || !scheduleForm.moduleId || !scheduleForm.recipientEmail.trim()}
              >
                {createScheduleMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating…
                  </span>
                ) : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
