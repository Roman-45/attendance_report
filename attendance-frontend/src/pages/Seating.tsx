import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, ClassroomLayout, SeatAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Grid3X3, Plus } from 'lucide-react'
import { SeatingGrid } from '@/components/SeatingGrid'

interface EnrolledStudent {
  studentId: number
  studentName: string
  studentStudentId: string
}

export default function Seating() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<SeatAssignment | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: layout, isLoading: layoutLoading } = useQuery<ClassroomLayout>({
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
      totalRows: 7, columnsPerRow: 8, columnGroups: 2,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      toast({ title: 'Classroom layout created' })
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

  const unassignMutation = useMutation({
    mutationFn: (studentId: number) =>
      client.delete(`/modules/${selectedModuleId}/seating/assign/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seating-layout', selectedModuleId] })
      setInfoOpen(false)
      toast({ title: 'Seat unassigned' })
    },
  })

  const assignedStudentIds = new Set(layout?.seats.map(s => s.studentId) || [])

  const handleSeatClick = (row: number, col: number, assignment?: SeatAssignment) => {
    if (assignment) {
      setSelectedAssignment(assignment)
      setInfoOpen(true)
    } else {
      setSelectedSeat({ row, col })
      setSelectedStudentId('')
      setAssignOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
          Classroom Seating
        </h1>
      </div>

      <div className="max-w-sm">
        <Label className="text-[#334155] dark:text-[#94A3B8]">Select Module</Label>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
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

      {selectedModuleId && !layout && !layoutLoading && (
        <Card className="border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]" />
            <p className="text-[#64748B] dark:text-[#94A3B8] mb-4">
              No classroom layout exists for this module
            </p>
            <Button
              onClick={() => createLayoutMutation.mutate()}
              disabled={createLayoutMutation.isPending}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Layout (7 rows x 8 seats)
            </Button>
          </CardContent>
        </Card>
      )}

      {layout && (
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
            <SeatingGrid
              layout={layout}
              onSeatClick={handleSeatClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Assign Seat Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-[#F1F5F9]">
              Assign Seat {selectedSeat?.row}{String.fromCharCode(64 + (selectedSeat?.col || 1))}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-[#334155] dark:text-[#94A3B8]">Select Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8]">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {enrolledStudents
                  .filter(s => !assignedStudentIds.has(s.studentId))
                  .map(s => (
                    <SelectItem key={s.studentId} value={String(s.studentId)}>
                      {s.studentName} ({s.studentStudentId})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStudentId || assignMutation.isPending}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50"
            >
              {assignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-[#4F46E5] border-t-white animate-spin" />
                  Assigning...
                </span>
              ) : (
                'Assign'
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
                  Row {selectedAssignment.rowNumber}, Seat {String.fromCharCode(64 + selectedAssignment.columnNumber)}
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
              disabled={unassignMutation.isPending}
              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white disabled:opacity-50"
            >
              {unassignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-[#DC2626] border-t-white animate-spin" />
                  Unassigning...
                </span>
              ) : (
                'Unassign Seat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
