// School-wide classroom seating. The layout is shared across all modules —
// a student sits in the same seat regardless of the class running that
// evening. Per the user requirement: "the layout of the class is always
// the same regardless of the module".
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { ClassroomLayout, SeatAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Grid3X3,
  Plus,
  Trash2,
  UserPlus,
  Send,
  AlertTriangle,
  X,
} from 'lucide-react'
import { SeatingGrid } from '@/components/SeatingGrid'
import { cn } from '@/lib/utils'

interface StudentLite {
  id: number
  name: string
}

interface PendingAssignment {
  studentId: number
  studentName: string
  row: number
  col: number
}

export default function Seating() {
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false)
  const [layoutForm, setLayoutForm] = useState({
    rows: '7',
    cols: '8',
    groups: '2',
  })
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<{
    row: number
    col: number
  } | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] =
    useState<SeatAssignment | null>(null)
  const [pendingAssignments, setPendingAssignments] = useState<
    PendingAssignment[]
  >([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    data: layout,
    isLoading: layoutLoading,
  } = useQuery<ClassroomLayout>({
    queryKey: ['seating-layout'],
    queryFn: () => client.get('/seating/layout').then((r) => r.data.data),
    retry: false,
  })

  const { data: students = [] } = useQuery<StudentLite[]>({
    queryKey: ['students-for-seating'],
    queryFn: () =>
      client
        .get('/students')
        .then((r) =>
          (r.data.data as Array<{ id: number; name: string }>).map((s) => ({
            id: s.id,
            name: s.name,
          })),
        ),
  })

  const createLayoutMutation = useMutation({
    mutationFn: () =>
      client.post('/seating/layout', {
        totalRows: Number(layoutForm.rows),
        columnsPerRow: Number(layoutForm.cols),
        columnGroups: Number(layoutForm.groups),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout'] })
      setLayoutDialogOpen(false)
      toast({ title: 'Classroom layout saved' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      client.post('/seating/assign', {
        studentId: Number(selectedStudentId),
        rowNumber: selectedSeat!.row,
        columnNumber: selectedSeat!.col,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout'] })
      setAssignOpen(false)
      toast({ title: 'Seat assigned' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const bulkAssignMutation = useMutation({
    mutationFn: () =>
      client.post('/seating/assign/bulk', {
        assignments: pendingAssignments.map((p) => ({
          studentId: p.studentId,
          rowNumber: p.row,
          columnNumber: p.col,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout'] })
      setPendingAssignments([])
      toast({ title: `${pendingAssignments.length} seat(s) assigned` })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed'
      toast({
        variant: 'destructive',
        title: 'Bulk assignment failed',
        description: msg,
      })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (studentId: number) =>
      client.delete(`/seating/assign/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout'] })
      setInfoOpen(false)
      toast({ title: 'Seat unassigned' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const assignedStudentIds = useMemo(
    () => new Set(layout?.seats.map((s) => s.studentId) || []),
    [layout],
  )
  const pendingStudentIds = useMemo(
    () => new Set(pendingAssignments.map((p) => p.studentId)),
    [pendingAssignments],
  )
  const pendingSeatKeys = useMemo(
    () => new Set(pendingAssignments.map((p) => `${p.row}-${p.col}`)),
    [pendingAssignments],
  )

  const unassignedStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          !assignedStudentIds.has(s.id) && !pendingStudentIds.has(s.id),
      ),
    [students, assignedStudentIds, pendingStudentIds],
  )

  const handleSeatClick = (
    row: number,
    col: number,
    assignment?: SeatAssignment,
  ) => {
    if (assignment) {
      setSelectedAssignment(assignment)
      setInfoOpen(true)
      return
    }
    if (pendingSeatKeys.has(`${row}-${col}`)) {
      setPendingAssignments((prev) =>
        prev.filter((p) => !(p.row === row && p.col === col)),
      )
      return
    }
    setSelectedSeat({ row, col })
    setSelectedStudentId('')
    setAssignOpen(true)
  }

  const queueAssignment = () => {
    if (!selectedStudentId || !selectedSeat) return
    const stu = students.find((s) => s.id === Number(selectedStudentId))
    if (!stu) return
    setPendingAssignments((prev) => [
      ...prev,
      {
        studentId: stu.id,
        studentName: stu.name,
        row: selectedSeat.row,
        col: selectedSeat.col,
      },
    ])
    setAssignOpen(false)
  }

  const layoutWithPending: ClassroomLayout | undefined = useMemo(() => {
    if (!layout) return undefined
    const virtualSeats: SeatAssignment[] = pendingAssignments.map((p) => ({
      id: -p.studentId,
      studentId: p.studentId,
      studentName: `${p.studentName} (pending)`,
      registrationNumber: '',
      rowNumber: p.row,
      columnNumber: p.col,
      assignedByName: null,
      assignedAt: new Date().toISOString(),
    }))
    return { ...layout, seats: [...layout.seats, ...virtualSeats] }
  }, [layout, pendingAssignments])

  const isEmpty = !layoutLoading && (!layout || layout.totalRows === 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1>Classroom Seating</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One shared seating chart for the whole school. A student sits in
            the same seat regardless of which module is running.
          </p>
        </div>
        {layout && (
          <Button
            variant="outline"
            onClick={() => {
              setLayoutForm({
                rows: String(layout.totalRows),
                cols: String(layout.columnsPerRow),
                groups: String(layout.columnGroups),
              })
              setLayoutDialogOpen(true)
            }}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Edit layout
          </Button>
        )}
      </div>

      {layoutLoading && (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <span className="h-6 w-6 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No classroom layout has been defined yet.
            </p>
            <Button
              onClick={() => {
                setLayoutForm({ rows: '7', cols: '8', groups: '2' })
                setLayoutDialogOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Create layout
            </Button>
          </CardContent>
        </Card>
      )}

      {layout && layoutWithPending && layout.totalRows > 0 && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-brand" />
                Seating Map
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {layout.seats.length} /{' '}
                  {layout.totalRows * layout.columnsPerRow} seats assigned
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SeatingGrid
                layout={layoutWithPending}
                onSeatClick={handleSeatClick}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-brand" />
                  Unassigned ({unassignedStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {unassignedStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 px-1">
                    All students seated.
                  </p>
                ) : (
                  <ul className="max-h-64 overflow-auto space-y-1">
                    {unassignedStudents.map((s) => (
                      <li
                        key={s.id}
                        className="px-2 py-1.5 rounded-md border border-border text-xs bg-surface-sunken"
                      >
                        <p className="font-medium leading-tight text-foreground">
                          {s.name}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {pendingAssignments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Pending bulk ({pendingAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <ul className="max-h-48 overflow-auto space-y-1">
                    {pendingAssignments.map((p) => (
                      <li
                        key={`${p.row}-${p.col}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-border text-xs"
                      >
                        <span className="flex-1 truncate font-medium text-foreground">
                          {p.studentName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          R{p.row}C{p.col}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-status-absent"
                          onClick={() =>
                            setPendingAssignments((prev) =>
                              prev.filter((x) => x.studentId !== p.studentId),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPendingAssignments([])}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
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

      <Dialog open={layoutDialogOpen} onOpenChange={setLayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                <Grid3X3 className="h-4 w-4 text-brand" />
              </div>
              Classroom layout
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createLayoutMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={layoutForm.rows}
                  onChange={(e) =>
                    setLayoutForm((f) => ({ ...f, rows: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Columns</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={layoutForm.cols}
                  onChange={(e) =>
                    setLayoutForm((f) => ({ ...f, cols: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  className="text-xs"
                  title="Number of column groups (e.g. 2 = a centre aisle)"
                >
                  Groups
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={layoutForm.groups}
                  onChange={(e) =>
                    setLayoutForm((f) => ({ ...f, groups: e.target.value }))
                  }
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              Total seats:{' '}
              <strong className="text-foreground">
                {Number(layoutForm.rows) * Number(layoutForm.cols)}
              </strong>
              . Choose a size that fits the cohort.
            </p>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createLayoutMutation.isPending}
              >
                {createLayoutMutation.isPending ? 'Saving…' : 'Save layout'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Seat — Row {selectedSeat?.row}, Col {selectedSeat?.col}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Student</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {unassignedStudents.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Tip: choose <strong>Queue</strong> to batch several seats and
              commit them in one request.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={queueAssignment}
              disabled={!selectedStudentId}
              className={cn('')}
            >
              <Plus className="h-4 w-4 mr-1" /> Queue
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStudentId || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Assigning…
                </span>
              ) : (
                'Assign now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium text-foreground">
                  {selectedAssignment.studentName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p>
                  Row {selectedAssignment.rowNumber}, Column{' '}
                  {selectedAssignment.columnNumber}
                </p>
              </div>
              {selectedAssignment.assignedByName && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned By</p>
                  <p>{selectedAssignment.assignedByName}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() =>
                selectedAssignment &&
                unassignMutation.mutate(selectedAssignment.studentId)
              }
              disabled={
                unassignMutation.isPending ||
                (selectedAssignment?.id ?? 0) < 0
              }
            >
              {unassignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Unassigning…
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
