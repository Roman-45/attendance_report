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
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Upload, Download } from 'lucide-react'

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
  const [form, setForm] = useState({ studentId: '', name: '', email: '', cohortYear: new Date().getFullYear(), program: '' })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => client.get('/students', { params: { page, size: 20, search: search || undefined } }).then(r => r.data.data),
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return client.post('/students/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setImportResult(resp.data.data)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportResult(null); setImportDialogOpen(true) }}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Student</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
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
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.studentId}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.program}</TableCell>
                    <TableCell>{s.cohortYear}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input value={form.studentId} onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))} required disabled={!!editStudent} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Input value={form.program} onChange={(e) => setForm(f => ({ ...f, program: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Cohort Year</Label>
                <Input type="number" value={form.cohortYear} onChange={(e) => setForm(f => ({ ...f, cohortYear: parseInt(e.target.value) }))} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResult(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Upload an .xlsx file with columns: studentId, name, email, cohortYear, program</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-1" /> Template
              </Button>
            </div>

            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to select .xlsx file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />

            {importMutation.isPending && (
              <p className="text-center text-sm text-muted-foreground">Importing...</p>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="default">{importResult.imported} imported</Badge>
                  <Badge variant="secondary">{importResult.skipped} skipped</Badge>
                  {importResult.errors.length > 0 && (
                    <Badge variant="destructive">{importResult.errors.length} errors</Badge>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-md border max-h-40 overflow-auto">
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
                            <TableCell className="text-destructive">{e.reason}</TableCell>
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
