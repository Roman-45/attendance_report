import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, MarkColumn } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, PenLine, Calculator, Award, FileText, Target, BookCheck, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

const markTypeConfig: Record<string, { icon: typeof Award; color: string; bg: string }> = {
  ASSIGNMENT: { icon: FileText,    color: 'text-[#0284C7]', bg: 'bg-[#F0F9FF]' },
  QUIZ:       { icon: FlaskConical, color: 'text-[#7C3AED]', bg: 'bg-[#EEF2FF]' },
  MIDTERM:    { icon: BookCheck,   color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]' },
  FINAL:      { icon: Award,       color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
  PROJECT:    { icon: Target,      color: 'text-[#059669]', bg: 'bg-[#ECFDF5]' },
}

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
    queryFn: () => client.get(`/modules/${selectedModuleId}/columns`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const createColumnMutation = useMutation({
    mutationFn: () => client.post(`/modules/${selectedModuleId}/columns`, columnForm),
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
      client.post(`/modules/${selectedModuleId}/marks`, data.entries, { params: { columnId: data.columnId } }),
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
    mutationFn: () => client.post(`/modules/${selectedModuleId}/grades/compute`),
    onSuccess: () => toast({ title: 'Grades computed successfully' }),
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

  const totalWeight = columns.reduce((sum: number, c: MarkColumn) => sum + c.weight, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            Marks &amp; Grades
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Create assessments and enter student scores
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedModuleId && (
            <>
              <Button
                variant="outline"
                onClick={() => computeGradesMutation.mutate()}
                disabled={computeGradesMutation.isPending}
                className="shadow-sm border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] dark:border-[#1E3A5F]"
              >
                <Calculator className="h-4 w-4 mr-2" /> Compute Grades
              </Button>
              <Button
                onClick={() => {
                  setColumnForm({ name: '', markType: 'ASSIGNMENT', maxMark: 100, weight: 0 })
                  setColumnDialogOpen(true)
                }}
                className="shadow-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Column
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Module selector */}
      <div className="max-w-sm">
        <Label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
          Module
        </Label>
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

      {/* Weight progress */}
      {selectedModuleId && columns.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#64748B] dark:text-[#94A3B8]">
                Total Weight Distribution
              </span>
              <span
                className={cn(
                  'font-bold',
                  totalWeight === 100 ? 'text-[#059669]' : 'text-[#D97706]',
                )}
              >
                {totalWeight}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(totalWeight, 100)}%`,
                  backgroundColor:
                    totalWeight === 100
                      ? '#059669'
                      : totalWeight > 100
                      ? '#DC2626'
                      : '#D97706',
                }}
              />
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              totalWeight === 100
                ? 'text-[#059669] border-[#A7F3D0]'
                : 'text-[#D97706] border-[#FDE68A]',
            )}
          >
            {totalWeight === 100 ? 'Complete' : `${100 - totalWeight}% remaining`}
          </Badge>
        </div>
      )}

      {/* Column cards */}
      {selectedModuleId && (
        <>
          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-10 w-10 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg" />
                    <div className="h-4 w-32 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                    <div className="h-3 w-20 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && columns.length === 0 && (
            <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-[#818CF8]" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">
                  No assessment columns
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Add columns for assignments, quizzes, exams, etc.
                </p>
                <Button
                  onClick={() => {
                    setColumnForm({ name: '', markType: 'ASSIGNMENT', maxMark: 100, weight: 0 })
                    setColumnDialogOpen(true)
                  }}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Column
                </Button>
              </CardContent>
            </Card>
          )}

          {columns.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {columns.map((c: MarkColumn) => {
                const type = markTypeConfig[c.markType] || markTypeConfig.ASSIGNMENT
                const TypeIcon = type.icon
                return (
                  <Card
                    key={c.id}
                    className="group hover:shadow-md transition-all border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', type.bg)}>
                          <TypeIcon className={cn('h-5 w-5', type.color)} />
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-[#E2E8F0] text-[#64748B] dark:border-[#1E3A5F] dark:text-[#94A3B8]"
                        >
                          {c.weight}% weight
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-sm mb-1 text-[#0F172A] dark:text-[#F1F5F9]">
                        {c.name}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                        {c.markType} · Max: {c.maxMark} points
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:text-[#94A3B8]"
                        onClick={() => openEntryDialog(c)}
                      >
                        <PenLine className="h-3.5 w-3.5 mr-1.5" /> Enter Marks
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Create Column Dialog */}
      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Add Assessment Column
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createColumnMutation.mutate() }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Column Name</Label>
              <Input
                value={columnForm.name}
                onChange={(e) => setColumnForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Assignment 1"
                className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Type</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(markTypeConfig).map(([key, cfg]) => {
                  const BtnIcon = cfg.icon
                  const isSelected = columnForm.markType === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColumnForm(f => ({ ...f, markType: key }))}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-medium',
                        isSelected
                          ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                          : 'border-[#E2E8F0] text-[#64748B] hover:border-[#818CF8] dark:border-[#1E3A5F] dark:text-[#94A3B8]',
                      )}
                    >
                      <BtnIcon className="h-4 w-4" />
                      <span className="text-[10px] capitalize">{key.toLowerCase()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Max Mark</Label>
                <Input
                  type="number"
                  value={columnForm.maxMark}
                  onChange={(e) => setColumnForm(f => ({ ...f, maxMark: parseInt(e.target.value) }))}
                  required
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Weight (%)</Label>
                <Input
                  type="number"
                  value={columnForm.weight}
                  onChange={(e) => setColumnForm(f => ({ ...f, weight: parseInt(e.target.value) }))}
                  required
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createColumnMutation.isPending}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {createColumnMutation.isPending ? 'Creating...' : 'Create Column'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-xl bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <PenLine className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Enter Marks — {selectedColumn?.name}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Max score: <span className="font-semibold text-[#334155] dark:text-[#F1F5F9]">{selectedColumn?.maxMark}</span> points
          </p>

          <div className="max-h-80 overflow-auto space-y-1 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] p-1">
            {entries.map((entry, idx) => (
              <div
                key={entry.studentId}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-xs font-bold text-white">
                    {entry.studentName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">
                    {entry.studentName}
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={selectedColumn?.maxMark}
                  value={entry.score}
                  onChange={(e) =>
                    setEntries(prev =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, score: parseFloat(e.target.value) || 0 } : r,
                      ),
                    )
                  }
                  className="w-20 text-center text-sm border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9]"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              onClick={() =>
                selectedColumn &&
                saveEntriesMutation.mutate({
                  columnId: selectedColumn.id,
                  entries: entries.map(e => ({ studentId: e.studentId, score: e.score })),
                })
              }
              disabled={saveEntriesMutation.isPending}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {saveEntriesMutation.isPending ? 'Saving...' : 'Save Marks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
