import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, MarkColumn } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, PenLine, Calculator } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/skeleton'

export default function Marks() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<MarkColumn | null>(null)
  const [columnForm, setColumnForm] = useState({ name: '', markType: 'ASSIGNMENT', maxMark: 100, weight: 0 })
  const [entries, setEntries] = useState<Array<{ studentId: number; studentName: string; score: number }>>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['mark-columns', selectedModuleId],
    queryFn: () => client.get(`/marks/module/${selectedModuleId}/columns`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const createColumnMutation = useMutation({
    mutationFn: () => client.post(`/marks/module/${selectedModuleId}/columns`, columnForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mark-columns', selectedModuleId] })
      setColumnDialogOpen(false)
      toast({ title: 'Mark column created' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const saveEntriesMutation = useMutation({
    mutationFn: (data: { columnId: number; entries: Array<{ studentId: number; score: number }> }) =>
      client.post(`/marks/columns/${data.columnId}/entries`, data.entries),
    onSuccess: () => {
      setEntryDialogOpen(false)
      toast({ title: 'Marks saved' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const computeGradesMutation = useMutation({
    mutationFn: () => client.post(`/grades/module/${selectedModuleId}/compute`),
    onSuccess: () => {
      toast({ title: 'Grades computed successfully' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const openEntryDialog = async (col: MarkColumn) => {
    setSelectedColumn(col)
    try {
      const { data } = await client.get(`/modules/${selectedModuleId}/enrollments`)
      const enrollments = data.data || []
      setEntries(enrollments.map((e: { studentId: number; studentName: string }) => ({
        studentId: e.studentId, studentName: e.studentName, score: 0,
      })))
      setEntryDialogOpen(true)
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load students' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Marks & Grades</h1>
        <div className="flex flex-wrap gap-2">
          {selectedModuleId && (
            <>
              <Button variant="outline" onClick={() => computeGradesMutation.mutate()} disabled={computeGradesMutation.isPending}>
                <Calculator className="h-4 w-4 mr-2" /> Compute Grades
              </Button>
              <Button onClick={() => { setColumnForm({ name: '', markType: 'ASSIGNMENT', maxMark: 100, weight: 0 }); setColumnDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Add Column
              </Button>
            </>
          )}
        </div>
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
          <CardHeader><CardTitle>Mark Columns</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Mark</TableHead>
                  <TableHead>Weight (%)</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : columns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No mark columns</TableCell></TableRow>
                ) : (
                  columns.map((c: MarkColumn) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="secondary">{c.markType}</Badge></TableCell>
                      <TableCell>{c.maxMark}</TableCell>
                      <TableCell>{c.weight}%</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEntryDialog(c)}>
                          <PenLine className="h-4 w-4 mr-1" /> Enter Marks
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

      {/* Create Column Dialog */}
      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Mark Column</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createColumnMutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input value={columnForm.name} onChange={(e) => setColumnForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Assignment 1" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={columnForm.markType} onValueChange={(v) => setColumnForm(f => ({ ...f, markType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="MIDTERM">Midterm</SelectItem>
                  <SelectItem value="FINAL">Final Exam</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Mark</Label>
                <Input type="number" value={columnForm.maxMark} onChange={(e) => setColumnForm(f => ({ ...f, maxMark: parseInt(e.target.value) }))} required />
              </div>
              <div className="space-y-2">
                <Label>Weight (%)</Label>
                <Input type="number" value={columnForm.weight} onChange={(e) => setColumnForm(f => ({ ...f, weight: parseInt(e.target.value) }))} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createColumnMutation.isPending}>
                {createColumnMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Enter Marks — {selectedColumn?.name}</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-32">Score (/{selectedColumn?.maxMark})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow key={entry.studentId}>
                    <TableCell>{entry.studentName}</TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} max={selectedColumn?.maxMark} value={entry.score}
                        onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, score: parseFloat(e.target.value) || 0 } : r))}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedColumn && saveEntriesMutation.mutate({
                columnId: selectedColumn.id,
                entries: entries.map(e => ({ studentId: e.studentId, score: e.score })),
              })}
              disabled={saveEntriesMutation.isPending}
            >
              {saveEntriesMutation.isPending ? 'Saving...' : 'Save Marks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
