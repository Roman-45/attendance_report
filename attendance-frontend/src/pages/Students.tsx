import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Student } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { YearPicker } from '@/components/ui/year-picker'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; studentId: string; reason: string }>
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 rounded bg-muted w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  )
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
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () =>
      client.get('/students', { params: { page, size: 20, search: search || undefined } }).then(r => r.data.data),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const students: Student[] = data?.content ?? data ?? []
  const totalPages = data?.totalPages ?? 1

  // Generate page numbers to show (window of 5)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {search ? `No students matching "${search}"` : 'No students yet'}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>
                      {s.program ? (
                        <Badge variant="secondary">{s.program}</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>{s.cohortYear}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        Edit
                      </Button>
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
              <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
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
              <Label>Student ID</Label>
              <Input
                value={form.studentId}
                onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))}
                required
                disabled={!!editStudent}
                placeholder="e.g. STU20250001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="jane@auca.ac.rw"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Program</Label>
                <Input
                  value={form.program}
                  onChange={(e) => setForm(f => ({ ...f, program: e.target.value }))}
                  required
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
              <p className="text-sm text-muted-foreground">
                Upload an .xlsx file with columns: studentId, name, email, cohortYear, program
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Template
              </Button>
            </div>

            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 p-10 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary mb-3 transition-colors" />
              <p className="text-sm font-medium">Click to select .xlsx file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />

            {importMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                  <div className="rounded-lg border max-h-40 overflow-auto">
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
                            <TableCell className="text-destructive text-xs">{e.reason}</TableCell>
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
    </div>
  )
}
