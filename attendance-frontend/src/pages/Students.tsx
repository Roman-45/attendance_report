import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Student, Module, Enrollment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { YearPicker } from '@/components/ui/year-picker'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Upload, Download, ChevronLeft, ChevronRight, BookOpen, Trash2, UserPlus } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/skeleton'

interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; studentId: string; reason: string }>
}

export default function Students() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [form, setForm] = useState({
    studentId: '',
    name: '',
    email: '',
    cohortYear: new Date().getFullYear(),
    program: '',
  })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enrollment management state
  const [enrollmentStudent, setEnrollmentStudent] = useState<Student | null>(null)
  const [enrollModuleId, setEnrollModuleId] = useState<string>('')

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () =>
      client.get('/students', { params: { page, size: 20, search: search || undefined } }).then(r => r.data.data),
  })

  // Fetch enrollments for the selected student
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ['student-enrollments', enrollmentStudent?.id],
    queryFn: () =>
      client.get(`/students/${enrollmentStudent!.id}/enrollments`).then(r => r.data.data),
    enabled: !!enrollmentStudent,
  })

  // Fetch all modules for the enroll dropdown
  const { data: allModules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
    enabled: !!enrollmentStudent,
  })

  const saveMutation = useMutation({
    mutationFn: (student: typeof form) =>
      editStudent
        ? client.put(`/students/${editStudent.id}`, student)
        : client.post('/students', student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setDialogOpen(false)
      setEditStudent(null)
      toast({ title: editStudent ? 'Student updated' : 'Student created' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return client.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setImportResult(resp.data.data)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Import failed'
      toast({ variant: 'destructive', title: 'Import Error', description: msg })
    },
  })

  const enrollMutation = useMutation({
    mutationFn: ({ moduleId, studentDbId }: { moduleId: number; studentDbId: number }) =>
      client.post(`/modules/${moduleId}/enrollments`, { studentIds: [studentDbId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', enrollmentStudent?.id] })
      setEnrollModuleId('')
      toast({ title: 'Student enrolled successfully' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Enrollment failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: ({ moduleId, studentDbId }: { moduleId: number; studentDbId: number }) =>
      client.delete(`/modules/${moduleId}/enrollments/${studentDbId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', enrollmentStudent?.id] })
      toast({ title: 'Student unenrolled' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to unenroll'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importMutation.mutate(file)
    e.target.value = ''
  }

  const downloadTemplate = async () => {
    const resp = await client.get('/students/import/template', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([resp.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-import-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const openCreate = () => {
    setEditStudent(null)
    setForm({ studentId: '', name: '', email: '', cohortYear: new Date().getFullYear(), program: '' })
    setDialogOpen(true)
  }

  const openEdit = (s: Student) => {
    setEditStudent(s)
    setForm({ studentId: s.studentId, name: s.name, email: s.email, cohortYear: s.cohortYear, program: s.program })
    setDialogOpen(true)
  }

  const openEnrollments = (s: Student) => {
    setEnrollmentStudent(s)
    setEnrollModuleId('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const handleEnroll = () => {
    if (!enrollModuleId || !enrollmentStudent) return
    enrollMutation.mutate({ moduleId: Number(enrollModuleId), studentDbId: enrollmentStudent.id })
  }

  // Modules not yet enrolled in (for the dropdown)
  const enrolledModuleIds = new Set(enrollments.map(e => e.moduleId))
  const availableModules = allModules.filter(m => !enrolledModuleIds.has(m.id))

  const students: Student[] = data?.content ?? data ?? []
  const totalPages = data?.totalPages ?? 1

  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else {
      pages.push(0)
      if (page > 2) pages.push('...')
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i)
      if (page < totalPages - 3) pages.push('...')
      pages.push(totalPages - 1)
    }
    return pages
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Students</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {data?.totalElements != null ? `${data.totalElements} total` : 'Manage student records'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportResult(null); setImportDialogOpen(true) }}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Search by name, ID, email…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={2} />)
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12 text-[#94A3B8]">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {search ? `No students matching "${search}"` : 'No students yet'}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#4F46E5] hover:text-[#4338CA]"
                          onClick={() => openEnrollments(s)}
                          title="Manage module enrollments"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Numbered pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-sm text-[#94A3B8]">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9 text-xs"
                onClick={() => setPage(p as number)}
              >
                {(p as number) + 1}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Jane Doe"
              />
              <p className="text-[11px] text-muted-foreground">
                Only the name is required. Other details can be added later.
              </p>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Optional details
              </summary>
              <div className="mt-3 space-y-3 rounded-md border border-border-subtle p-3">
                <div className="space-y-1.5">
                  <Label>Student ID</Label>
                  <Input
                    value={form.studentId}
                    onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))}
                    disabled={!!editStudent}
                    placeholder="Auto-generated if blank"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@auca.ac.rw"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Program / Department</Label>
                    <Input
                      value={form.program}
                      onChange={(e) => setForm(f => ({ ...f, program: e.target.value }))}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cohort Year</Label>
                    <YearPicker
                      value={form.cohortYear}
                      onChange={(year) => setForm(f => ({ ...f, cohortYear: year }))}
                      minYear={2000}
                    />
                  </div>
                </div>
              </div>
            </details>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving…
                  </span>
                ) : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResult(null) }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                Upload an .xlsx file with columns: studentId, name, email, cohortYear, program
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Template
              </Button>
            </div>

            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] p-10 cursor-pointer hover:border-[#4F46E5]/50 hover:bg-[#4F46E5]/[0.02] transition-all duration-200 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-[#CBD5E1] group-hover:text-[#4F46E5] mb-3 transition-colors" />
              <p className="text-sm font-medium text-[#334155] dark:text-[#CBD5E1]">Click to select .xlsx file</p>
              <p className="text-xs text-[#94A3B8] mt-1">or drag and drop</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />

            {importMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#64748B] py-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                Importing…
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="success">{importResult.imported} imported</Badge>
                  <Badge variant="secondary">{importResult.skipped} skipped</Badge>
                  {importResult.errors.length > 0 && (
                    <Badge variant="destructive">{importResult.errors.length} errors</Badge>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell>{e.row}</TableCell>
                            <TableCell>{e.studentId || '—'}</TableCell>
                            <TableCell className="text-[#DC2626] text-xs">{e.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Management Dialog */}
      <Dialog
        open={!!enrollmentStudent}
        onOpenChange={(open) => { if (!open) setEnrollmentStudent(null) }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#4F46E5]" />
              Module Enrollments — {enrollmentStudent?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enroll in a new module */}
            <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#1E293B]/30 p-3 space-y-2">
              <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Add to module</p>
              <div className="flex gap-2">
                <Select value={enrollModuleId} onValueChange={setEnrollModuleId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      availableModules.length === 0 ? 'Enrolled in all modules' : 'Select module…'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        <span className="font-mono text-xs mr-2 text-[#94A3B8]">{m.code}</span>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleEnroll}
                  disabled={!enrollModuleId || enrollMutation.isPending}
                  size="sm"
                >
                  {enrollMutation.isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5 mr-1" /> Enroll</>
                  )}
                </Button>
              </div>
            </div>

            {/* Current enrollments list */}
            <div>
              <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wide mb-2">
                Currently enrolled ({enrollments.length})
              </p>
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8] text-sm">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  Not enrolled in any modules
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {enrollments.map(e => (
                    <div
                      key={e.enrollmentId}
                      className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] px-3 py-2 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-[#0F172A] dark:text-[#F1F5F9]">{e.moduleName}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Enrolled {new Date(e.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#94A3B8] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => unenrollMutation.mutate({ moduleId: e.moduleId, studentDbId: enrollmentStudent!.id })}
                        disabled={unenrollMutation.isPending}
                        title="Remove from module"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentStudent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
