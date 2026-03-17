import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Enrollment, Student } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Search, UserPlus, Trash2 } from 'lucide-react'

interface Props {
  moduleId: number
  moduleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollmentDialog({ moduleId, moduleName, open, onOpenChange }: Props) {
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Enrolled students for this module
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', moduleId],
    queryFn: () => client.get(`/modules/${moduleId}/enrollments`).then(r => r.data.data ?? []),
    enabled: open,
  })

  // All students (for adding)
  const { data: allStudentsData } = useQuery({
    queryKey: ['students-all', studentSearch],
    queryFn: () =>
      client.get('/students', { params: { size: 50, search: studentSearch || undefined } })
        .then(r => r.data.data),
    enabled: open,
  })

  const enrolledStudentIds = new Set(
    (enrollments as Enrollment[]).map((e) => e.studentId)
  )

  const allStudents: Student[] = allStudentsData?.content ?? allStudentsData ?? []
  const unenrolledStudents = allStudents.filter((s) => !enrolledStudentIds.has(s.id))

  const enrollMutation = useMutation({
    mutationFn: (studentIds: number[]) =>
      client.post(`/modules/${moduleId}/enrollments`, { studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', moduleId] })
      setSelectedIds([])
      toast({ title: 'Students enrolled successfully' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Enrollment failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (studentId: number) =>
      client.delete(`/modules/${moduleId}/enrollments/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', moduleId] })
      toast({ title: 'Student removed from module' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedIds([]); setStudentSearch('') } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enrollments — {moduleName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Enrolled students */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Enrolled Students ({(enrollments as Enrollment[]).length})</h3>
            {loadingEnrollments ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : (enrollments as Enrollment[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No students enrolled yet</p>
            ) : (
              <div className="rounded-md border max-h-48 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(enrollments as Enrollment[]).map((e) => (
                      <TableRow key={e.enrollmentId}>
                        <TableCell className="font-mono text-xs">{e.studentStudentId}</TableCell>
                        <TableCell>{e.studentName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{e.program}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeMutation.mutate(e.studentId)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Add students */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Add Students</h3>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search students to add..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            {unenrolledStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {allStudents.length === 0 ? 'No students found' : 'All students are already enrolled'}
              </p>
            ) : (
              <div className="rounded-md border max-h-48 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unenrolledStudents.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => toggleSelect(s.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{s.program}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0 ? `${selectedIds.length} student${selectedIds.length > 1 ? 's' : ''} selected` : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button
              onClick={() => enrollMutation.mutate(selectedIds)}
              disabled={selectedIds.length === 0 || enrollMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Selected'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
