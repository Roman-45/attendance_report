import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, MarkColumn, MarkEntry, Enrollment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Calculator,
  Award,
  FileText,
  BookCheck,
  FlaskConical,
  Trash2,
  MoreHorizontal,
  Save,
  RotateCcw,
  Keyboard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InitialsAvatar, getInitials } from '@/components/ui/InitialsAvatar'

// ─── Types & config ────────────────────────────────────────────────────────

type MarkType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'CUSTOM'

const MARK_TYPES: MarkType[] = ['MIDTERM', 'FINAL', 'QUIZ', 'CUSTOM']

const markTypeConfig: Record<MarkType, { icon: typeof Award; color: string; bg: string }> = {
  MIDTERM: { icon: BookCheck, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]' },
  FINAL: { icon: Award, color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
  QUIZ: { icon: FlaskConical, color: 'text-[#7C3AED]', bg: 'bg-[#EEF2FF]' },
  CUSTOM: { icon: FileText, color: 'text-[#0284C7]', bg: 'bg-[#F0F9FF]' },
}

interface CellState {
  studentId: number
  studentName: string
  studentCode?: string
  // Per-column state: keyed by columnId
  // We track raw input as string so we can show in-progress edits.
  // null = no entry yet.
}

interface GridCell {
  raw: string // current input string
  initial: string // last fetched value as string
  entryId: number | null // existing mark entry id (for PATCH) or null (for POST)
  invalid: boolean // explicitly set when paste validation fails
}

type GridState = Record<number, Record<number, GridCell>> // studentId -> columnId -> cell

// ─── Helpers ───────────────────────────────────────────────────────────────

function scoreColor(score: number, max: number): string {
  if (max <= 0) return 'text-[#64748B]'
  const pct = (score / max) * 100
  if (pct >= 70) return 'text-[#059669]'
  if (pct >= 50) return 'text-[#D97706]'
  return 'text-[#DC2626]'
}

function emptyCell(): GridCell {
  return { raw: '', initial: '', entryId: null, invalid: false }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Marks() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [activeColumnId, setActiveColumnId] = useState<number | null>(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [columnForm, setColumnForm] = useState<{ name: string; type: MarkType; maxScore: number }>({
    name: '',
    type: 'MIDTERM',
    maxScore: 100,
  })
  const [grid, setGrid] = useState<GridState>({})
  const [focusedStudentId, setFocusedStudentId] = useState<number | null>(null)
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
  const [pendingDeleteColumn, setPendingDeleteColumn] = useState<MarkColumn | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Refs for keyboard navigation: keyed `${studentId}:${columnId}`
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())
  const cellKey = (sId: number, cId: number) => `${sId}:${cId}`

  // ─── Queries ───────────────────────────────────────────────────────────

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['marks', 'modules'],
    queryFn: () => client.get('/modules').then((r) => r.data.data),
  })

  const moduleIdNum = selectedModuleId ? Number(selectedModuleId) : null

  const {
    data: columns = [],
    isLoading: columnsLoading,
    isError: columnsError,
    refetch: refetchColumns,
  } = useQuery<MarkColumn[]>({
    queryKey: ['marks', 'columns', moduleIdNum],
    queryFn: () =>
      client.get(`/modules/${moduleIdNum}/columns`).then((r) => r.data.data),
    enabled: moduleIdNum !== null,
  })

  const {
    data: entries = [],
    isLoading: entriesLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = useQuery<MarkEntry[]>({
    queryKey: ['marks', 'entries', moduleIdNum],
    queryFn: () =>
      client.get(`/modules/${moduleIdNum}/marks`).then((r) => r.data.data),
    enabled: moduleIdNum !== null,
  })

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useQuery<Enrollment[]>({
    queryKey: ['marks', 'enrollments', moduleIdNum],
    queryFn: () =>
      client.get(`/modules/${moduleIdNum}/enrollments`).then((r) => r.data.data),
    enabled: moduleIdNum !== null,
  })

  // ─── Build initial grid state from server data ─────────────────────────

  useEffect(() => {
    if (!moduleIdNum) {
      setGrid({})
      return
    }
    if (enrollmentsLoading || columnsLoading || entriesLoading) return

    const next: GridState = {}
    for (const en of enrollments) {
      next[en.studentId] = {}
      for (const col of columns) {
        next[en.studentId][col.id] = emptyCell()
      }
    }
    // Cast to a richer shape since the actual response includes more fields
    type RichEntry = MarkEntry & { studentCode?: string }
    for (const e of entries as RichEntry[]) {
      if (!next[e.studentId]) {
        next[e.studentId] = {}
      }
      const v = String(e.score)
      next[e.studentId][e.columnId] = {
        raw: v,
        initial: v,
        entryId: e.id,
        invalid: false,
      }
    }
    setGrid(next)
  }, [moduleIdNum, enrollments, columns, entries, enrollmentsLoading, columnsLoading, entriesLoading])

  // ─── Active column bookkeeping ─────────────────────────────────────────

  useEffect(() => {
    if (columns.length === 0) {
      setActiveColumnId(null)
    } else if (activeColumnId === null || !columns.find((c) => c.id === activeColumnId)) {
      setActiveColumnId(columns[0].id)
    }
  }, [columns, activeColumnId])

  // ─── Mutations ─────────────────────────────────────────────────────────

  const createColumnMutation = useMutation({
    mutationFn: () =>
      client.post(`/modules/${moduleIdNum}/columns`, {
        name: columnForm.name,
        type: columnForm.type,
        maxScore: columnForm.maxScore,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks', 'columns', moduleIdNum] })
      setColumnDialogOpen(false)
      setColumnForm({ name: '', type: 'MIDTERM', maxScore: 100 })
      toast({ title: 'Mark column created' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create column'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: number) => client.delete(`/columns/${columnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks', 'columns', moduleIdNum] })
      queryClient.invalidateQueries({ queryKey: ['marks', 'entries', moduleIdNum] })
      setPendingDeleteColumn(null)
      toast({ title: 'Column deleted' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete column'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const computeGradesMutation = useMutation({
    mutationFn: () => client.post(`/modules/${moduleIdNum}/grades/compute`),
    onSuccess: () => toast({ title: 'Grades computed successfully' }),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to compute grades'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  // ─── Dirty tracking ─────────────────────────────────────────────────────

  const dirtyCells = useMemo(() => {
    const out: Array<{
      studentId: number
      columnId: number
      score: number
      entryId: number | null
    }> = []
    for (const sIdStr of Object.keys(grid)) {
      const sId = Number(sIdStr)
      const row = grid[sId]
      for (const cIdStr of Object.keys(row)) {
        const cId = Number(cIdStr)
        const cell = row[cId]
        if (cell.raw === cell.initial) continue
        if (cell.raw === '') continue // empty input not committed
        const n = parseFloat(cell.raw)
        if (Number.isNaN(n)) continue
        out.push({ studentId: sId, columnId: cId, score: n, entryId: cell.entryId })
      }
    }
    return out
  }, [grid])

  const dirtyCount = dirtyCells.length

  // ─── Cell editing ──────────────────────────────────────────────────────

  const updateCell = useCallback(
    (studentId: number, columnId: number, raw: string) => {
      setGrid((prev) => {
        const row = prev[studentId] || {}
        const existing = row[columnId] || emptyCell()
        return {
          ...prev,
          [studentId]: {
            ...row,
            [columnId]: { ...existing, raw, invalid: false },
          },
        }
      })
    },
    [],
  )

  const revertCell = useCallback((studentId: number, columnId: number) => {
    setGrid((prev) => {
      const row = prev[studentId]
      if (!row) return prev
      const cell = row[columnId]
      if (!cell) return prev
      return {
        ...prev,
        [studentId]: {
          ...row,
          [columnId]: { ...cell, raw: cell.initial, invalid: false },
        },
      }
    })
  }, [])

  const discardAll = useCallback(() => {
    setGrid((prev) => {
      const next: GridState = {}
      for (const sIdStr of Object.keys(prev)) {
        const sId = Number(sIdStr)
        next[sId] = {}
        for (const cIdStr of Object.keys(prev[sId])) {
          const cId = Number(cIdStr)
          const cell = prev[sId][cId]
          next[sId][cId] = { ...cell, raw: cell.initial, invalid: false }
        }
      }
      return next
    })
    toast({ title: 'Changes discarded' })
  }, [toast])

  // ─── Keyboard nav ──────────────────────────────────────────────────────

  const orderedStudentIds = useMemo(
    () => enrollments.map((e) => e.studentId),
    [enrollments],
  )

  const focusCell = useCallback(
    (studentId: number, columnId: number) => {
      const el = inputRefs.current.get(cellKey(studentId, columnId))
      if (el) {
        el.focus()
        el.select()
        setFocusedStudentId(studentId)
      }
    },
    [],
  )

  const moveFocus = useCallback(
    (
      currentStudentId: number,
      currentColumnId: number,
      dRow: number,
      dCol: number,
    ) => {
      const sIdx = orderedStudentIds.indexOf(currentStudentId)
      const cIdx = columns.findIndex((c) => c.id === currentColumnId)
      if (sIdx === -1 || cIdx === -1) return
      const newSIdx = Math.min(orderedStudentIds.length - 1, Math.max(0, sIdx + dRow))
      const newCIdx = Math.min(columns.length - 1, Math.max(0, cIdx + dCol))
      const newSId = orderedStudentIds[newSIdx]
      const newCId = columns[newCIdx].id
      focusCell(newSId, newCId)
    },
    [orderedStudentIds, columns, focusCell],
  )

  // ─── Paste handler ─────────────────────────────────────────────────────

  const handlePaste = useCallback(
    (
      e: React.ClipboardEvent<HTMLInputElement>,
      startStudentId: number,
      startColumnId: number,
    ) => {
      const text = e.clipboardData.getData('text')
      if (!text) return
      // Detect tab or newline structure
      const rows = text.replace(/\r/g, '').split('\n').map((r) => r.split('\t'))
      // Trim trailing empty row
      while (rows.length > 0 && rows[rows.length - 1].every((c) => c.trim() === '')) {
        rows.pop()
      }
      if (rows.length === 0) return
      // If single value just let default behavior do it
      if (rows.length === 1 && rows[0].length === 1) return

      e.preventDefault()
      const sIdx = orderedStudentIds.indexOf(startStudentId)
      const cIdx = columns.findIndex((c) => c.id === startColumnId)
      if (sIdx === -1 || cIdx === -1) return

      setGrid((prev) => {
        const next: GridState = { ...prev }
        for (let r = 0; r < rows.length; r++) {
          const targetSId = orderedStudentIds[sIdx + r]
          if (targetSId === undefined) break
          const cells = rows[r]
          for (let c = 0; c < cells.length; c++) {
            const targetCol = columns[cIdx + c]
            if (!targetCol) break
            const raw = cells[c].trim()
            if (raw === '') continue
            const n = parseFloat(raw)
            const valid = !Number.isNaN(n) && n >= 0 && n <= targetCol.maxScore
            const row = next[targetSId] ? { ...next[targetSId] } : {}
            const existing = row[targetCol.id] || emptyCell()
            row[targetCol.id] = {
              ...existing,
              raw,
              invalid: !valid,
            }
            next[targetSId] = row
          }
        }
        return next
      })
    },
    [orderedStudentIds, columns],
  )

  // ─── Save logic ────────────────────────────────────────────────────────

  const saveAll = useCallback(async () => {
    if (!moduleIdNum) return
    if (dirtyCells.length === 0) {
      toast({ title: 'Nothing to save' })
      return
    }

    // Validate against maxScore
    const colMap = new Map(columns.map((c) => [c.id, c]))
    const invalidEntries: Array<{ studentId: number; columnId: number }> = []
    const validDirty = dirtyCells.filter((d) => {
      const col = colMap.get(d.columnId)
      if (!col) return false
      if (d.score < 0 || d.score > col.maxScore) {
        invalidEntries.push({ studentId: d.studentId, columnId: d.columnId })
        return false
      }
      return true
    })

    if (invalidEntries.length > 0) {
      // Mark them invalid in grid
      setGrid((prev) => {
        const next = { ...prev }
        for (const inv of invalidEntries) {
          const row = next[inv.studentId] ? { ...next[inv.studentId] } : {}
          const cell = row[inv.columnId]
          if (cell) {
            row[inv.columnId] = { ...cell, invalid: true }
            next[inv.studentId] = row
          }
        }
        return next
      })
      toast({
        variant: 'destructive',
        title: 'Invalid scores',
        description: `${invalidEntries.length} cell(s) outside 0..maxScore`,
      })
    }

    if (validDirty.length === 0) return

    // Group: existing entries -> PATCH; new -> POST batched per column
    const patches = validDirty.filter((d) => d.entryId !== null)
    const newByColumn = new Map<number, typeof validDirty>()
    for (const d of validDirty) {
      if (d.entryId === null) {
        const arr = newByColumn.get(d.columnId) || []
        arr.push(d)
        newByColumn.set(d.columnId, arr)
      }
    }

    const calls: Array<Promise<unknown>> = []

    for (const p of patches) {
      calls.push(
        client.patch(`/marks/${p.entryId}`, { studentId: p.studentId, score: p.score }),
      )
    }
    for (const [columnId, arr] of newByColumn.entries()) {
      calls.push(
        client.post(
          `/modules/${moduleIdNum}/marks`,
          arr.map((d) => ({ studentId: d.studentId, score: d.score })),
          { params: { columnId } },
        ),
      )
    }

    const results = await Promise.allSettled(calls)
    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed

    // Refetch entries to pick up new ids and confirm state
    await queryClient.invalidateQueries({ queryKey: ['marks', 'entries', moduleIdNum] })

    if (failed === 0) {
      toast({ title: `Saved ${validDirty.length} cell(s)` })
    } else {
      toast({
        variant: 'destructive',
        title: 'Partial save',
        description: `${succeeded} request(s) succeeded, ${failed} failed`,
      })
    }
  }, [moduleIdNum, dirtyCells, columns, queryClient, toast])

  // ─── Global Cmd/Ctrl+S handler ─────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveAll])

  // ─── Derived stats ─────────────────────────────────────────────────────

  const activeColumn = columns.find((c) => c.id === activeColumnId) || null

  const classAvg = useMemo(() => {
    if (!activeColumn) return null
    const vals: number[] = []
    for (const sId of orderedStudentIds) {
      const cell = grid[sId]?.[activeColumn.id]
      if (!cell) continue
      const n = parseFloat(cell.raw)
      if (!Number.isNaN(n)) vals.push(n)
    }
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }, [activeColumn, grid, orderedStudentIds])

  // ─── Render ────────────────────────────────────────────────────────────

  const isLoading = columnsLoading || entriesLoading || enrollmentsLoading
  const hasError = columnsError || entriesError || enrollmentsError

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            Marks &amp; Grades
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Spreadsheet-like grid for entering and reviewing student scores
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
                  setColumnForm({ name: '', type: 'MIDTERM', maxScore: 100 })
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
            {modules.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.code} - {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedModuleId && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Select a module to begin entering marks.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedModuleId && hasError && (
        <Card className="border-[#FCA5A5] bg-[#FEF2F2]">
          <CardContent className="py-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#DC2626]" />
              <p className="text-sm text-[#7F1D1D]">Failed to load marks data.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchColumns()
                refetchEntries()
                refetchEnrollments()
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedModuleId && !hasError && isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {selectedModuleId && !hasError && !isLoading && columns.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-[#818CF8]" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">
              No mark columns yet
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
              Add a column for an assessment, quiz, or exam to begin.
            </p>
            <Button
              onClick={() => {
                setColumnForm({ name: '', type: 'MIDTERM', maxScore: 100 })
                setColumnDialogOpen(true)
              }}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Column
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedModuleId && !hasError && !isLoading && columns.length > 0 && enrollments.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-16 text-center">
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">
              No students enrolled
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Enroll students in this module before entering marks.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedModuleId && !hasError && !isLoading && columns.length > 0 && enrollments.length > 0 && (
        <>
          {/* Column tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F] pb-2">
            {columns.map((c) => {
              const isActive = c.id === activeColumnId
              const cfg = markTypeConfig[c.type as MarkType] || markTypeConfig.CUSTOM
              const TypeIcon = cfg.icon
              return (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border transition-colors',
                    isActive
                      ? 'border-[#4F46E5] bg-[#EEF2FF]'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] dark:border-[#1E3A5F]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveColumnId(c.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-xs font-medium',
                      isActive ? 'text-[#4F46E5]' : 'text-[#334155] dark:text-[#94A3B8]',
                    )}
                  >
                    <TypeIcon className={cn('h-3.5 w-3.5', isActive ? 'text-[#4F46E5]' : cfg.color)} />
                    {c.name}
                    <span className="text-[10px] text-[#64748B]">/{c.maxScore}</span>
                    <Badge variant="outline" className="text-[10px] border-[#E2E8F0] text-[#64748B]">
                      {c.type}
                    </Badge>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="px-1.5 py-1.5 text-[#64748B] hover:text-[#334155]"
                        aria-label="Column actions"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-[#DC2626] focus:text-[#DC2626]"
                        onClick={() => setPendingDeleteColumn(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>

          {/* Cheatsheet */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={() => setCheatsheetOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-[#334155] dark:text-[#94A3B8]"
            >
              <span className="flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5" />
                Keyboard shortcuts
              </span>
              {cheatsheetOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {cheatsheetOpen && (
              <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                {[
                  ['↑ / ↓', 'Move row'],
                  ['← / →', 'Move column'],
                  ['Enter', 'Commit + next row'],
                  ['Tab / Shift+Tab', 'Next / prev column'],
                  ['Ctrl/Cmd+V', 'Paste from Excel'],
                  ['Ctrl/Cmd+S', 'Save all dirty cells'],
                  ['Esc', 'Discard cell edit'],
                ].map(([k, l]) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <kbd className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E3A5F] px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {k}
                    </kbd>
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Class avg pill */}
          {activeColumn && classAvg !== null && (
            <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span>
                Class average for <span className="font-semibold text-[#334155] dark:text-[#F1F5F9]">{activeColumn.name}</span>:
                {' '}
                <span className={cn('font-bold', scoreColor(classAvg, activeColumn.maxScore))}>
                  {classAvg.toFixed(1)} / {activeColumn.maxScore}
                </span>
              </span>
            </div>
          )}

          {/* Grid */}
          <Card className="border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] overflow-hidden">
            <CardContent className="p-0">
              {/* Desktop / large grid */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC] dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B] w-10">
                        #
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        Student
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B] w-24">
                        Attend.
                      </th>
                      {columns.map((c) => (
                        <th
                          key={c.id}
                          className={cn(
                            'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide',
                            c.id === activeColumnId ? 'text-[#4F46E5]' : 'text-[#64748B]',
                          )}
                        >
                          {c.name}
                          <span className="ml-1 text-[10px] font-normal text-[#94A3B8]">
                            /{c.maxScore}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((en, idx) => (
                      <tr
                        key={en.studentId}
                        className={cn(
                          'border-b border-[#F1F5F9] dark:border-[#1E3A5F] transition-colors',
                          focusedStudentId === en.studentId ? 'bg-[#EEF2FF]/40' : '',
                        )}
                      >
                        <td className="px-3 py-2 text-[12px] text-[#94A3B8] tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <InitialsAvatar initials={getInitials(en.studentName)} size="sm" />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate max-w-[180px]">
                                {en.studentName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[12px] text-[#94A3B8]">
                          {/* TODO: per-student attendance % — no endpoint yet */}
                          —
                        </td>
                        {columns.map((c) => {
                          const cell = grid[en.studentId]?.[c.id] || emptyCell()
                          const dirty = cell.raw !== cell.initial
                          const n = parseFloat(cell.raw)
                          const hasNum = !Number.isNaN(n) && cell.raw !== ''
                          const outOfRange = hasNum && (n < 0 || n > c.maxScore)
                          const showInvalid = cell.invalid || outOfRange
                          const isActiveCol = c.id === activeColumnId
                          return (
                            <td
                              key={c.id}
                              className={cn(
                                'px-3 py-2 relative',
                                dirty && 'bg-[#FEF9C3]/40',
                                isActiveCol && 'bg-[#EEF2FF]/20',
                              )}
                            >
                              {dirty && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#D97706]" />
                              )}
                              <div className="flex items-center gap-1.5">
                                <input
                                  ref={(el) => {
                                    inputRefs.current.set(cellKey(en.studentId, c.id), el)
                                  }}
                                  type="number"
                                  step="0.5"
                                  min={0}
                                  max={c.maxScore}
                                  value={cell.raw}
                                  onFocus={() => setFocusedStudentId(en.studentId)}
                                  onChange={(e) => updateCell(en.studentId, c.id, e.target.value)}
                                  onPaste={(e) => handlePaste(e, en.studentId, c.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      moveFocus(en.studentId, c.id, 1, 0)
                                    } else if (e.key === 'ArrowDown') {
                                      e.preventDefault()
                                      moveFocus(en.studentId, c.id, 1, 0)
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault()
                                      moveFocus(en.studentId, c.id, -1, 0)
                                    } else if (e.key === 'ArrowLeft') {
                                      const t = e.currentTarget
                                      if (t.selectionStart === 0 && t.selectionEnd === 0) {
                                        e.preventDefault()
                                        moveFocus(en.studentId, c.id, 0, -1)
                                      }
                                    } else if (e.key === 'ArrowRight') {
                                      const t = e.currentTarget
                                      if (
                                        t.selectionStart === t.value.length &&
                                        t.selectionEnd === t.value.length
                                      ) {
                                        e.preventDefault()
                                        moveFocus(en.studentId, c.id, 0, 1)
                                      }
                                    } else if (e.key === 'Tab') {
                                      e.preventDefault()
                                      moveFocus(en.studentId, c.id, 0, e.shiftKey ? -1 : 1)
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault()
                                      revertCell(en.studentId, c.id)
                                    }
                                  }}
                                  className={cn(
                                    'w-20 h-8 px-2 text-[13px] font-semibold text-center tabular-nums rounded-md border outline-none transition-all',
                                    'focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5]',
                                    showInvalid
                                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                                      : hasNum
                                      ? cn(
                                          'border-[#E2E8F0] bg-white dark:bg-[#0F172A]',
                                          scoreColor(n, c.maxScore),
                                        )
                                      : 'border-[#E2E8F0] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9]',
                                  )}
                                />
                                <span className="text-[11px] text-[#94A3B8]">
                                  /{c.maxScore}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / stacked card list */}
              <div className="md:hidden divide-y divide-[#F1F5F9] dark:divide-[#1E3A5F]">
                {enrollments.map((en) => (
                  <div key={en.studentId} className="p-3 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar initials={getInitials(en.studentName)} size="sm" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate">
                          {en.studentName}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {columns.map((c) => {
                        const cell = grid[en.studentId]?.[c.id] || emptyCell()
                        const dirty = cell.raw !== cell.initial
                        const n = parseFloat(cell.raw)
                        const hasNum = !Number.isNaN(n) && cell.raw !== ''
                        const outOfRange = hasNum && (n < 0 || n > c.maxScore)
                        const showInvalid = cell.invalid || outOfRange
                        return (
                          <label key={c.id} className="text-xs">
                            <span className="text-[10px] uppercase tracking-wide text-[#64748B] block mb-0.5">
                              {c.name} /{c.maxScore}
                            </span>
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={c.maxScore}
                              value={cell.raw}
                              onChange={(e) => updateCell(en.studentId, c.id, e.target.value)}
                              className={cn(
                                'w-full h-8 px-2 text-[13px] font-semibold tabular-nums rounded-md border outline-none',
                                showInvalid
                                  ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                                  : dirty
                                  ? 'border-[#D97706] bg-[#FEF9C3]/30'
                                  : 'border-[#E2E8F0] bg-white',
                              )}
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Sticky save bar */}
      {selectedModuleId && columns.length > 0 && enrollments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#0F172A] border-t border-[#E2E8F0] dark:border-[#1E3A5F] shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
          <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              {dirtyCount === 0 ? (
                <span>No unsaved changes</span>
              ) : (
                <span>
                  <span className="font-semibold text-[#D97706]">{dirtyCount}</span> dirty cell
                  {dirtyCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discardAll}
                disabled={dirtyCount === 0}
                className="border-[#E2E8F0]"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
              <Button
                size="sm"
                onClick={() => void saveAll()}
                disabled={dirtyCount === 0}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => computeGradesMutation.mutate()}
                disabled={computeGradesMutation.isPending}
                className="border-[#E2E8F0]"
              >
                <Calculator className="h-3.5 w-3.5 mr-1.5" /> Compute grades
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add column dialog */}
      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Add Mark Column
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!columnForm.name.trim() || columnForm.maxScore <= 0) {
                toast({
                  variant: 'destructive',
                  title: 'Invalid column',
                  description: 'Name is required and max score must be > 0',
                })
                return
              }
              createColumnMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Column Name</Label>
              <Input
                value={columnForm.name}
                onChange={(e) =>
                  setColumnForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="e.g. Quiz 1"
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MARK_TYPES.map((key) => {
                  const cfg = markTypeConfig[key]
                  const BtnIcon = cfg.icon
                  const isSelected = columnForm.type === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColumnForm((f) => ({ ...f, type: key }))}
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
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#94A3B8]">Max Score</Label>
              <Input
                type="number"
                min={1}
                value={columnForm.maxScore}
                onChange={(e) =>
                  setColumnForm((f) => ({ ...f, maxScore: parseInt(e.target.value) || 0 }))
                }
                required
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createColumnMutation.isPending}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {createColumnMutation.isPending ? 'Creating...' : 'Create column'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={pendingDeleteColumn !== null}
        onOpenChange={(open) => !open && setPendingDeleteColumn(null)}
      >
        <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827]">
          <DialogHeader>
            <DialogTitle>Delete column?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748B]">
            This will permanently delete the column{' '}
            <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
              {pendingDeleteColumn?.name}
            </span>{' '}
            and all its mark entries. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteColumn(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                pendingDeleteColumn && deleteColumnMutation.mutate(pendingDeleteColumn.id)
              }
              disabled={deleteColumnMutation.isPending}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Suppress unused-type warning when CellState is not consumed elsewhere yet
export type { CellState }
