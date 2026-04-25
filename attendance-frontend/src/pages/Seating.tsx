import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, ClassroomLayout, SeatAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Grid3X3, Plus, Trash2, UserPlus, Send, AlertTriangle, X } from 'lucide-react'
import { SeatingGrid } from '@/components/SeatingGrid'
import { cn } from '@/lib/utils'

interface EnrolledStudent {
  studentId: number
  studentName: string
  studentStudentId: string
}

interface PendingAssignment {
  studentId: number
  studentName: string
  studentStudentId: string
  row: number
  col: number
}

export default function Seating() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false)
  const [layoutForm, setLayoutForm] = useState({ rows: '7', cols: '8', groups: '2' })
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<SeatAssignment | null>(null)
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: layout, isLoading: layoutLoading, isError: layoutError } = useQuery<ClassroomLayout>({
    queryKey: ['seating-layout', selectedModuleId],
    queryFn: () => client.get(`/modules/${selectedModuleId}/seating/layout`).then(r => r.data.data),
    enabled: !!selectedModuleId,
    retry: false,
  })

  const { data: enrolledStudents = [] } = useQuery<EnrolledStudent[]>({
    queryKey: ['enrollments-for-seating', selectedModuleId],
    queryFn: () => client.get(`/modules/${selectedModuleId}/enrollments`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const createLayoutMutation = useMutation({
    mutationFn: () => client.post(`/modules/${selectedModuleId}/seating/layout`, {
      totalRows: Number(layoutForm.rows),
      columnsPerRow: Number(layoutForm.cols),
      columnGroups: Number(layoutForm.groups),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      setLayoutDialogOpen(false)
      toast({ title: 'Classroom layout created' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const assignMutation = useMutation({
    mutationFn: () => client.post(`/modules/${selectedModuleId}/seating/assign`, {
      studentId: Number(selectedStudentId),
      rowNumber: selectedSeat!.row,
      columnNumber: selectedSeat!.col,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      setAssignOpen(false)
      toast({ title: 'Seat assigned' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const bulkAssignMutation = useMutation({
    mutationFn: () => client.post(`/modules/${selectedModuleId}/seating/assign/bulk`, {
      assignments: pendingAssignments.map(p => ({
        studentId: p.studentId,
        rowNumber: p.row,
        columnNumber: p.col,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      setPendingAssignments([])
      toast({ title: `${pendingAssignments.length} seat(s) assigned` })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Bulk assignment failed', description: msg })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (studentId: number) =>
      client.delete(`/modules/${selectedModuleId}/seating/assign/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      setInfoOpen(false)
      toast({ title: 'Seat unassigned' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const assignedStudentIds = useMemo(
    () => new Set(layout?.seats.map(s => s.studentId) || []),
    [layout],
  )
  const pendingStudentIds = useMemo(
    () => new Set(pendingAssignments.map(p => p.studentId)),
    [pendingAssignments],
  )
  const pendingSeatKeys = useMemo(
    () => new Set(pendingAssignments.map(p => `${p.row}-${p.col}`)),
    [pendingAssignments],
  )

  const unassignedStudents = useMemo(
    () => enrolledStudents.filter(
      s => !assignedStudentIds.has(s.studentId) && !pendingStudentIds.has(s.studentId),
    ),
    [enrolledStudents, assignedStudentIds, pendingStudentIds],
  )

  const handleSeatClick = (row: number, col: number, assignment?: SeatAssignment) => {
    if (assignment) {
      setSelectedAssignment(assignment)
      setInfoOpen(true)
      return
    }
    if (pendingSeatKeys.has(`${row}-${col}`)) {
      // Already pending — remove from pending
      setPendingAssignments(prev => prev.filter(p => !(p.row === row && p.col === col)))
      return
    }
    setSelectedSeat({ row, col })
    setSelectedStudentId('')
    setAssignOpen(true)
  }

  // Add the chosen student to the pending stack
  const queueAssignment = () => {
    if (!selectedStudentId || !selectedSeat) return
    const stu = enrolledStudents.find(s => s.studentId === Number(selectedStudentId))
    if (!stu) return
    setPendingAssignments(prev => [
      ...prev,
      {
        studentId: stu.studentId,
        studentName: stu.studentName,
        studentStudentId: stu.studentStudentId,
        row: selectedSeat.row,
        col: selectedSeat.col,
      },
    ])
    setAssignOpen(false)
  }

  // Bridge the SeatingGrid: include pending assignments visually as virtual SeatAssignments
  const layoutWithPending: ClassroomLayout | undefined = useMemo(() => {
    if (!layout) return undefined
    const virtualSeats: SeatAssignment[] = pendingAssignments.map(p => ({
      id: -p.studentId, // negative — unique placeholder
      studentId: p.studentId,
      studentName: `${p.studentName} (pending)`,
      registrationNumber: p.studentStudentId,
      rowNumber: p.row,
      columnNumber: p.col,
      assignedByName: null,
      assignedAt: new Date().toISOString(),
    }))
    return { ...layout, seats: [...layout.seats, ...virtualSeats] }
  }, [layout, pendingAssignments])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            Classroom Seating
          </h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">
            Arrange where students sit. Click a seat to assign a student.
          </p>
        </div>
      </div>

      <div className="max-w-sm">
        <Label className="text-[#334155] dark:text-[#94A3B8]">Select Module</Label>
        <Select value={selectedModuleId} onValueChange={(v) => { setSelectedModuleId(v); setPendingAssignments([]) }}>
          <SelectTrigger className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8]">
            <SelectValue placeholder="Choose a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m: Module) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading skeleton */}
      {selectedModuleId && layoutLoading && (
        <Card className="border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardContent className="py-12 flex items-center justify-center">
            <span className="h-6 w-6 rounded-full border-2 border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
          </CardContent>
        </Card>
      )}

      {/* No layout — empty state with creation dialog trigger */}
      {selectedModuleId && layoutError && !layoutLoading && (
        <Card className="border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]" />
            <p className="text-[#64748B] dark:text-[#94A3B8] mb-4">
              No classroom layout exists for this module yet
            </p>
            <Button
              onClick={() => { setLayoutForm({ rows: '7', cols: '8', groups: '2' }); setLayoutDialogOpen(true) }}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Layout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loaded layout */}
      {layout && layoutWithPending && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <Card className="border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
                <Grid3X3 className="h-5 w-5 text-[#4F46E5]" />
                Seating Map — {layout.moduleName}
                <span className="text-sm font-normal text-[#64748B] dark:text-[#94A3B8] ml-auto">
                  {layout.seats.length} / {layout.totalRows * layout.columnsPerRow} seats assigned
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SeatingGrid layout={layoutWithPending} onSeatClick={handleSeatClick} />
            </CardContent>
          </Card>

          {/* Side panel: unassigned students + pending bulk */}
          <div className="space-y-4">
            <Card className="border-[#E2E8F0] dark:border-[#1E3A5F]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
                  <UserPlus className="h-4 w-4 text-[#4F46E5]" />
                  Unassigned ({unassignedStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {unassignedStudents.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] py-2 px-1">All students seated.</p>
                ) : (
                  <ul className="max-h-64 overflow-auto space-y-1">
                    {unassignedStudents.map(s => (
                      <li
                        key={s.studentId}
                        className="px-2 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E3A5F] text-xs text-[#334155] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#1E293B]/40"
                      >
                        <p className="font-medium leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{s.studentName}</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{s.studentStudentId}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {pendingAssignments.length > 0 && (
              <Card className="border-[#FDE68A] dark:border-[#D97706]/40 bg-[#FFFBEB] dark:bg-[#D97706]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-[#92400E] dark:text-[#FDE68A]">
                    <Send className="h-4 w-4" />
                    Pending bulk ({pendingAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <ul className="max-h-48 overflow-auto space-y-1">
                    {pendingAssignments.map(p => (
                      <li
                        key={`${p.row}-${p.col}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#FDE68A] dark:border-[#D97706]/40 text-xs"
                      >
                        <span className="flex-1 truncate text-[#0F172A] dark:text-[#F1F5F9] font-medium">
                          {p.studentName}
                        </span>
                        <span className="text-[10px] font-mono text-[#92400E] dark:text-[#FDE68A]">
                          R{p.row}C{p.col}
                        </span>
                        <button
                          type="button"
                          className="text-[#94A3B8] hover:text-[#DC2626]"
                          onClick={() => setPendingAssignments(prev => prev.filter(x => x.studentId !== p.studentId))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      className="flex-1"
                      onClick={() => setPendingAssignments([])}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                      onClick={() => bulkAssignMutation.mutate()}
                      disabled={bulkAssignMutation.isPending}
                    >
                      {bulkAssignMutation.isPending ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Saving
                        </span>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          Commit all
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Layout creation dialog */}
      <Dialog open={layoutDialogOpen} onOpenChange={setLayoutDialogOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#4F46E5]/20 flex items-center justify-center">
                <Grid3X3 className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Create Classroom Layout
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createLayoutMutation.mutate() }} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8] text-xs">Rows</Label>
                <Input
                  type="number" min={1} max={30} required
                  value={layoutForm.rows}
                  onChange={(e) => setLayoutForm(f => ({ ...f, rows: e.target.value }))}
                  className="border-[#E2E8F0] dark:border-[#1E3A5F]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8] text-xs">Columns</Label>
                <Input
                  type="number" min={1} max={20} required
                  value={layoutForm.cols}
                  onChange={(e) => setLayoutForm(f => ({ ...f, cols: e.target.value }))}
                  className="border-[#E2E8F0] dark:border-[#1E3A5F]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8] text-xs" title="Number of column groups (e.g. 2 = a centre aisle)">Groups</Label>
                <Input
                  type="number" min={1} max={5} required
                  value={layoutForm.groups}
                  onChange={(e) => setLayoutForm(f => ({ ...f, groups: e.target.value }))}
                  className="border-[#E2E8F0] dark:border-[#1E3A5F]"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              Total seats: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{Number(layoutForm.rows) * Number(layoutForm.cols)}</strong>.
              Choose a size that fits the enrolled cohort.
            </p>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createLayoutMutation.isPending}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {createLayoutMutation.isPending ? 'Creating...' : 'Create Layout'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Seat Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">
              Assign Seat — Row {selectedSeat?.row}, Col {selectedSeat?.col}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-[#334155] dark:text-[#94A3B8]">Select Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8]">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {unassignedStudents.map(s => (
                  <SelectItem key={s.studentId} value={String(s.studentId)}>
                    {s.studentName} ({s.studentStudentId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Tip: choose <strong>Queue</strong> to batch several seats and commit them in one request.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={queueAssignment}
              disabled={!selectedStudentId}
              className={cn('border-[#E2E8F0] dark:border-[#1E3A5F]')}
            >
              <Plus className="h-4 w-4 mr-1" /> Queue
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStudentId || assignMutation.isPending}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50"
            >
              {assignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Assigning...
                </span>
              ) : (
                'Assign now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seat Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">Seat Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Student</p>
                <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">{selectedAssignment.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Registration No.</p>
                <p className="text-[#334155] dark:text-[#94A3B8]">{selectedAssignment.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Position</p>
                <p className="text-[#334155] dark:text-[#94A3B8]">
                  Row {selectedAssignment.rowNumber}, Column {selectedAssignment.columnNumber}
                </p>
              </div>
              {selectedAssignment.assignedByName && (
                <div>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Assigned By</p>
                  <p className="text-[#334155] dark:text-[#94A3B8]">{selectedAssignment.assignedByName}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedAssignment && unassignMutation.mutate(selectedAssignment.studentId)}
              disabled={unassignMutation.isPending || (selectedAssignment?.id ?? 0) < 0}
              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white disabled:opacity-50"
            >
              {unassignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Unassigning...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Unassign Seat
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
