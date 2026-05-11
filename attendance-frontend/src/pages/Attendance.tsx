import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, AttendanceSession, AttendanceRecord } from '@/types'
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
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  ClipboardCheck,
  Calendar,
  Clock,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  BookOpen,
  Keyboard,
  ArrowLeft,
  StickyNote,
  Send,
  CheckCheck,
  X,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InitialsAvatar, getInitials } from '@/components/ui/InitialsAvatar'

// ─── Types ──────────────────────────────────────────────────────────────────

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | ''

interface GridRow {
  studentId: number
  studentName: string
  studentCode?: string
  program?: string
  status: Status
  notes: string
  recordId?: number
  prevPct: number | null
}

interface EnrollmentDTO {
  enrollmentId: number
  studentId: number
  studentName: string
  studentCode?: string
  program?: string
}

const periodConfig: Record<
  string,
  { icon: typeof Sun; color: string; bg: string }
> = {
  MORNING: { icon: Sun, color: 'text-status-late', bg: 'bg-status-late-bg' },
  AFTERNOON: {
    icon: Sunset,
    color: 'text-status-late',
    bg: 'bg-status-late-bg',
  },
  EVENING: {
    icon: Moon,
    color: 'text-status-excused',
    bg: 'bg-status-excused-bg',
  },
}

const STATUS_CONFIG = {
  PRESENT: {
    label: 'Present',
    key: '1',
    icon: CheckCircle2,
    pill:
      'bg-status-present-bg text-status-present border-status-present-border',
    activeBtn: 'bg-status-present text-white border-status-present',
    color: 'text-status-present',
  },
  ABSENT: {
    label: 'Absent',
    key: '2',
    icon: XCircle,
    pill: 'bg-status-absent-bg text-status-absent border-status-absent-border',
    activeBtn: 'bg-status-absent text-white border-status-absent',
    color: 'text-status-absent',
  },
  LATE: {
    label: 'Late',
    key: '3',
    icon: ClockIcon,
    pill: 'bg-status-late-bg text-status-late border-status-late-border',
    activeBtn: 'bg-status-late text-white border-status-late',
    color: 'text-status-late',
  },
  EXCUSED: {
    label: 'Excused',
    key: '4',
    icon: BookOpen,
    pill:
      'bg-status-excused-bg text-status-excused border-status-excused-border',
    activeBtn: 'bg-status-excused text-white border-status-excused',
    color: 'text-status-excused',
  },
} as const

const STATUS_KEYS = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const

const KEY_TO_STATUS: Record<string, Status> = {
  '1': 'PRESENT',
  '2': 'ABSENT',
  '3': 'LATE',
  '4': 'EXCUSED',
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Attendance() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    sessionDate: '',
    startTime: '',
    endTime: '',
    period: 'MORNING',
  })
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    null,
  )

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['attendance', 'modules'],
    queryFn: () => client.get('/modules').then((r) => r.data.data),
  })

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<
    AttendanceSession[]
  >({
    queryKey: ['attendance', 'sessions', selectedModuleId],
    queryFn: () =>
      client
        .get(`/modules/${selectedModuleId}/sessions`)
        .then((r) => r.data.data),
    enabled: !!selectedModuleId,
  })

  const createSessionMutation = useMutation({
    // AUCA classes are evening-only. Only the date matters; the server
    // fills startTime=18:00, endTime=21:00, period=EVENING.
    mutationFn: () =>
      client
        .post(`/modules/${selectedModuleId}/sessions`, {
          sessionDate: sessionForm.sessionDate,
        })
        .then((r) => r.data.data as AttendanceSession),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'sessions', selectedModuleId],
      })
      setCreateDialogOpen(false)
      toast({ title: 'Session created' })
      // Auto-navigate into the marking grid
      setActiveSession(created)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create session'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  // ── Active session view ────────────────────────────────────────────────
  if (activeSession) {
    return (
      <AttendanceGrid
        session={activeSession}
        moduleId={selectedModuleId}
        moduleLabel={
          modules.find((m) => String(m.id) === selectedModuleId)
            ? `${modules.find((m) => String(m.id) === selectedModuleId)!.code} · ${modules.find((m) => String(m.id) === selectedModuleId)!.name}`
            : activeSession.moduleName
        }
        onBack={() => setActiveSession(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create sessions and mark student attendance
          </p>
        </div>
        {selectedModuleId && (
          <Button
            onClick={() => {
              setSessionForm({
                sessionDate: '',
                startTime: '',
                endTime: '',
                period: 'MORNING',
              })
              setCreateDialogOpen(true)
            }}
            className="shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New session
          </Button>
        )}
      </div>

      {/* Module selector */}
      <div className="max-w-sm">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Module
        </Label>
        <Select
          value={selectedModuleId}
          onValueChange={(v) => {
            setSelectedModuleId(v)
            setActiveSession(null)
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.code} — {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Session list */}
      {selectedModuleId && (
        <>
          {sessionsLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 w-24 bg-border rounded" />
                    <div className="h-3 w-32 bg-border rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!sessionsLoading && sessions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="h-8 w-8 text-brand" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  No sessions yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a session to start marking attendance
                </p>
                <Button
                  onClick={() => {
                    setSessionForm({
                      sessionDate: '',
                      startTime: '',
                      endTime: '',
                      period: 'MORNING',
                    })
                    setCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> New session
                </Button>
              </CardContent>
            </Card>
          )}

          {sessions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const period = periodConfig[s.period] || periodConfig.MORNING
                const PIcon = period.icon
                return (
                  <Card
                    key={s.id}
                    className="group hover:shadow-md transition-all hover:border-border-strong cursor-pointer"
                    onClick={() => setActiveSession(s)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            period.bg,
                          )}
                        >
                          <PIcon className={cn('h-5 w-5', period.color)} />
                        </div>
                        <Badge variant="outline">{s.period}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {s.sessionDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                        <Clock className="h-3 w-3" />
                        <span>
                          {s.startTime} — {s.endTime}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveSession(s)
                        }}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Mark
                        attendance
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Create session dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                <Plus className="h-4 w-4 text-brand" />
              </div>
              New attendance session
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createSessionMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={sessionForm.sessionDate}
                onChange={(e) =>
                  setSessionForm((f) => ({
                    ...f,
                    sessionDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="rounded-lg border border-border bg-surface-sunken px-3 py-2.5 flex items-center gap-2.5">
              <Moon className="h-4 w-4 text-status-excused flex-shrink-0" />
              <div className="text-[12px] leading-snug">
                <p className="font-medium text-foreground">Evening class</p>
                <p className="text-muted-foreground">
                  All AUCA sessions run 18:00 – 21:00.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending
                  ? 'Creating…'
                  : 'Create session'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Attendance grid (the heart of M3) ──────────────────────────────────────

interface AttendanceGridProps {
  session: AttendanceSession
  moduleId: string
  moduleLabel: string
  onBack: () => void
}

function AttendanceGrid({
  session,
  moduleId,
  moduleLabel,
  onBack,
}: AttendanceGridProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [rows, setRows] = useState<GridRow[]>([])
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [showKbHelp, setShowKbHelp] = useState(true)
  const [notesOpenIdx, setNotesOpenIdx] = useState<number | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const notesInputRef = useRef<HTMLInputElement | null>(null)

  // ── Fetch existing records for the session ──────────────────────────────
  const recordsQuery = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'records', session.id],
    queryFn: () =>
      client.get(`/sessions/${session.id}/records`).then((r) => r.data.data),
  })

  // ── Fetch enrollments as a fallback seed ────────────────────────────────
  const enrollmentsQuery = useQuery<EnrollmentDTO[]>({
    queryKey: ['attendance', 'enrollments', moduleId],
    queryFn: () =>
      client
        .get(`/modules/${moduleId}/enrollments`)
        .then((r) => r.data.data || []),
    enabled: !!moduleId,
  })

  // ── Hydrate grid rows when data arrives ─────────────────────────────────
  useEffect(() => {
    if (recordsQuery.data === undefined || enrollmentsQuery.data === undefined)
      return

    const records = recordsQuery.data
    const enrollments = enrollmentsQuery.data

    if (records.length > 0) {
      // Use record list — already shaped one per enrolled student
      const enrollMap = new Map(enrollments.map((e) => [e.studentId, e]))
      setRows(
        records.map((r) => {
          const enrollment = enrollMap.get(r.studentId)
          return {
            studentId: r.studentId,
            studentName: r.studentName,
            studentCode: r.studentCode || enrollment?.studentCode,
            program: enrollment?.program,
            status: (r.status as Status) || '',
            notes: r.notes || '',
            recordId: r.id,
            prevPct: null, // TODO: backend has no prior-attendance endpoint yet
          }
        }),
      )
    } else {
      // No records — seed from enrollments, all blank
      setRows(
        enrollments.map((e) => ({
          studentId: e.studentId,
          studentName: e.studentName,
          studentCode: e.studentCode,
          program: e.program,
          status: '',
          notes: '',
          recordId: undefined,
          prevPct: null,
        })),
      )
    }
  }, [recordsQuery.data, enrollmentsQuery.data])

  // ── Mode detection ──────────────────────────────────────────────────────
  const isCorrectionMode =
    rows.length > 0 && rows.every((r) => r.recordId !== undefined)

  // ── Counts ──────────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      total: rows.length,
      present: rows.filter((r) => r.status === 'PRESENT').length,
      absent: rows.filter((r) => r.status === 'ABSENT').length,
      late: rows.filter((r) => r.status === 'LATE').length,
      excused: rows.filter((r) => r.status === 'EXCUSED').length,
      marked: rows.filter((r) => r.status !== '').length,
      unmarked: rows.filter((r) => r.status === '').length,
    }),
    [rows],
  )

  // ── Helpers ─────────────────────────────────────────────────────────────
  const setStatus = useCallback(
    (idx: number, status: Status) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx
            ? { ...r, status: r.status === status ? '' : status }
            : r,
        ),
      )
    },
    [setRows],
  )

  const updateNote = useCallback((idx: number, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, notes: value } : r)),
    )
  }, [])

  // ── Submit (POST batch) ────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = rows
        .filter((r) => r.status !== '')
        .map((r) => ({
          studentId: r.studentId,
          status: r.status,
          notes: r.notes || undefined,
        }))
      await client.post(`/sessions/${session.id}/records`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'records', session.id],
      })
      toast({ title: 'Attendance submitted' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to submit attendance'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  // ── Patch single record (correction) ───────────────────────────────────
  const patchMutation = useMutation({
    mutationFn: async (vars: {
      recordId: number
      status: Status
      notes?: string
    }) => {
      await client.patch(`/records/${vars.recordId}`, {
        status: vars.status,
        notes: vars.notes,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'records', session.id],
      })
      toast({ title: 'Record updated' })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update record'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const handleSubmit = useCallback(() => {
    if (isCorrectionMode) {
      // Submit the entire batch as PATCHes (only those with status set)
      const dirty = rows.filter((r) => r.recordId && r.status !== '')
      if (dirty.length === 0) return
      Promise.all(
        dirty.map((r) =>
          client.patch(`/records/${r.recordId}`, {
            status: r.status,
            notes: r.notes || undefined,
          }),
        ),
      )
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ['attendance', 'records', session.id],
          })
          toast({ title: 'Records updated' })
        })
        .catch((err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || 'Failed to update records'
          toast({ variant: 'destructive', title: 'Error', description: msg })
        })
    } else {
      submitMutation.mutate()
    }
  }, [isCorrectionMode, rows, submitMutation, queryClient, session.id, toast])

  // ── Scroll focused row into view ────────────────────────────────────────
  useEffect(() => {
    if (focusedIdx >= 0) {
      rowRefs.current[focusedIdx]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [focusedIdx])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      // Cmd/Ctrl-S submits regardless
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSubmit()
        return
      }
      if (isTyping) {
        if (e.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
          setNotesOpenIdx(null)
        }
        return
      }
      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4': {
          const status = KEY_TO_STATUS[e.key]
          if (focusedIdx >= 0 && rows[focusedIdx]) {
            setStatus(focusedIdx, status)
            e.preventDefault()
          }
          break
        }
        case 'ArrowDown':
        case 'Tab':
          if (e.key === 'Tab' && e.shiftKey) {
            setFocusedIdx((i) => Math.max(i - 1, 0))
          } else {
            setFocusedIdx((i) => Math.min(i + 1, rows.length - 1))
          }
          e.preventDefault()
          break
        case 'ArrowUp':
          setFocusedIdx((i) => Math.max(i - 1, 0))
          e.preventDefault()
          break
        case 'Enter':
          if (focusedIdx >= 0) {
            setNotesOpenIdx(focusedIdx)
            e.preventDefault()
          }
          break
        case 'Escape':
          setFocusedIdx(-1)
          setNotesOpenIdx(null)
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusedIdx, rows, setStatus, handleSubmit])

  // ── Focus notes input on open ───────────────────────────────────────────
  useEffect(() => {
    if (notesOpenIdx !== null) {
      notesInputRef.current?.focus()
    }
  }, [notesOpenIdx])

  // ── Loading ─────────────────────────────────────────────────────────────
  const isLoading = recordsQuery.isLoading || enrollmentsQuery.isLoading
  const hasError = recordsQuery.isError || enrollmentsQuery.isError

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header strip */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
                  Take attendance
                </h1>
                {isCorrectionMode && (
                  <Badge variant="warning">Correction</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-mono font-semibold text-brand">
                  {moduleLabel}
                </span>
                {' · '}
                {session.sessionDate}
                {' · '}
                {session.startTime}–{session.endTime}
                {' · '}
                {session.period}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Submitted:{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {counts.marked} / {counts.total}
              </span>
            </span>
            <Button
              onClick={handleSubmit}
              disabled={
                counts.marked === 0 ||
                submitMutation.isPending ||
                patchMutation.isPending
              }
            >
              <Send className="h-4 w-4 mr-1.5" />
              {submitMutation.isPending || patchMutation.isPending
                ? 'Saving…'
                : isCorrectionMode
                  ? 'Save corrections'
                  : 'Submit attendance'}
            </Button>
          </div>
        </div>

        {/* Status mini counts */}
        {counts.total > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            {STATUS_KEYS.map((s) => {
              const cfg = STATUS_CONFIG[s]
              const Icon = cfg.icon
              return counts[s.toLowerCase() as keyof typeof counts] > 0 ? (
                <span
                  key={s}
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    cfg.color,
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {counts[s.toLowerCase() as keyof typeof counts]} {cfg.label}
                </span>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Keyboard shortcut cheatsheet */}
      {showKbHelp && (
        <div className="mt-3 px-3 py-2 bg-brand-light border border-brand/10 rounded-lg flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-brand font-medium">
              <Keyboard className="h-3.5 w-3.5" />
              Shortcuts:
            </span>
            {[
              { key: '↑↓ / Tab', label: 'Navigate' },
              { key: '1', label: 'Present' },
              { key: '2', label: 'Absent' },
              { key: '3', label: 'Late' },
              { key: '4', label: 'Excused' },
              { key: 'Enter', label: 'Notes' },
              { key: 'Ctrl+S', label: 'Submit' },
              { key: 'Esc', label: 'Cancel' },
            ].map((item) => (
              <span
                key={item.key}
                className="flex items-center gap-1 text-xs text-brand/80"
              >
                <kbd className="bg-white border border-brand/20 text-brand px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                  {item.key}
                </kbd>
                {item.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowKbHelp(false)}
            className="text-brand/60 hover:text-brand"
            aria-label="Dismiss shortcuts"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 mt-4 pb-24">
        {isLoading && <SkeletonGrid />}

        {hasError && (
          <Card className="border-status-absent-border bg-status-absent-bg/40">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-status-absent mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Failed to load attendance data
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Check your connection and try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  recordsQuery.refetch()
                  enrollmentsQuery.refetch()
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !hasError && rows.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-brand" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">
                No students enrolled
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enroll students in this module to take attendance.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = '/students'
                }}
              >
                Enroll students
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !hasError && rows.length > 0 && (
          <div className="space-y-1.5 md:space-y-1">
            {rows.map((row, idx) => (
              <GridRowItem
                key={row.studentId}
                row={row}
                idx={idx}
                isFocused={focusedIdx === idx}
                isCorrectionMode={isCorrectionMode}
                notesOpen={notesOpenIdx === idx}
                onFocus={() => setFocusedIdx(idx)}
                onToggleNotes={() =>
                  setNotesOpenIdx((cur) => (cur === idx ? null : idx))
                }
                onSetStatus={(s) => setStatus(idx, s)}
                onUpdateNote={(v) => updateNote(idx, v)}
                onSaveSingle={() => {
                  if (row.recordId && row.status !== '') {
                    patchMutation.mutate({
                      recordId: row.recordId,
                      status: row.status,
                      notes: row.notes || undefined,
                    })
                  }
                }}
                rowRef={(el) => {
                  rowRefs.current[idx] = el
                }}
                notesInputRef={
                  notesOpenIdx === idx ? notesInputRef : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      {rows.length > 0 && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-surface border-t border-border flex items-center justify-between gap-3 flex-wrap shadow-md">
          <div className="text-sm text-muted-foreground">
            {isCorrectionMode ? 'Correcting' : 'Submitting attendance for'}{' '}
            <span className="font-semibold text-foreground">
              {counts.marked}
            </span>{' '}
            of {counts.total} students
            {counts.unmarked > 0 && (
              <span className="text-status-late ml-2">
                · {counts.unmarked} unmarked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                counts.marked === 0 ||
                submitMutation.isPending ||
                patchMutation.isPending
              }
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              {isCorrectionMode ? 'Save corrections' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Single row ─────────────────────────────────────────────────────────────

interface GridRowItemProps {
  row: GridRow
  idx: number
  isFocused: boolean
  isCorrectionMode: boolean
  notesOpen: boolean
  onFocus: () => void
  onToggleNotes: () => void
  onSetStatus: (s: Status) => void
  onUpdateNote: (v: string) => void
  onSaveSingle: () => void
  rowRef: (el: HTMLDivElement | null) => void
  notesInputRef?: React.RefObject<HTMLInputElement>
}

function GridRowItem({
  row,
  idx,
  isFocused,
  isCorrectionMode,
  notesOpen,
  onFocus,
  onToggleNotes,
  onSetStatus,
  onUpdateNote,
  onSaveSingle,
  rowRef,
  notesInputRef,
}: GridRowItemProps) {
  const cfg = row.status ? STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG] : null

  return (
    <div
      ref={rowRef}
      tabIndex={0}
      onClick={onFocus}
      onFocus={onFocus}
      aria-selected={isFocused}
      className={cn(
        'rounded-lg border transition-colors outline-none',
        isFocused
          ? 'border-brand ring-1 ring-brand/30 bg-brand-light/30'
          : 'border-border bg-surface hover:border-border-strong',
      )}
    >
      {/* Mobile: stacked layout. Desktop: single row */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xs text-subtle-foreground tabular-nums w-6 flex-shrink-0 select-none">
            {idx + 1}
          </span>
          <InitialsAvatar
            initials={getInitials(row.studentName)}
            autoColor
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {row.studentName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {row.studentCode || '—'}
              {row.program ? ` · ${row.program}` : ''}
            </p>
          </div>
          {/* Prior attendance badge */}
          <Badge variant="secondary" className="hidden lg:inline-flex">
            {row.prevPct !== null ? `${row.prevPct}%` : '—'}
          </Badge>
        </div>

        {/* Status pills + notes */}
        <div className="flex items-center justify-between md:justify-end gap-1.5 flex-wrap">
          {STATUS_KEYS.map((s) => {
            const sCfg = STATUS_CONFIG[s]
            const Icon = sCfg.icon
            const isSelected = row.status === s
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onFocus()
                  onSetStatus(s)
                }}
                aria-pressed={isSelected}
                title={`${sCfg.label} (${sCfg.key})`}
                className={cn(
                  // Bigger touch targets on mobile (h-10), compact on desktop (h-8)
                  'h-10 md:h-8 px-3 md:px-2 rounded-md border text-xs font-medium',
                  'flex items-center gap-1 transition-all flex-1 md:flex-none justify-center',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                  isSelected
                    ? sCfg.activeBtn
                    : 'border-border text-muted-foreground bg-surface hover:border-border-strong',
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="md:hidden lg:inline">{sCfg.label}</span>
                <span className="hidden md:inline lg:hidden">
                  {sCfg.key}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFocus()
              onToggleNotes()
            }}
            title="Notes (Enter)"
            aria-label="Toggle notes"
            className={cn(
              'h-10 md:h-8 w-10 md:w-8 rounded-md border flex items-center justify-center transition-colors',
              row.notes
                ? 'border-brand text-brand bg-brand-light'
                : 'border-border text-muted-foreground hover:border-border-strong',
            )}
          >
            <StickyNote className="h-3.5 w-3.5" />
          </button>
          {/* Per-row save in correction mode */}
          {isCorrectionMode && row.recordId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSaveSingle()
              }}
              disabled={!row.status}
              className="h-10 md:h-8 px-3 rounded-md border border-brand bg-brand text-white text-xs font-medium hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Notes input drawer */}
      {notesOpen && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <Input
            ref={notesInputRef}
            type="text"
            placeholder="Notes (optional)…"
            value={row.notes}
            onChange={(e) => onUpdateNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                ;(e.target as HTMLInputElement).blur()
                onToggleNotes()
              }
            }}
            className="text-sm"
          />
        </div>
      )}

      {/* Accent strip on left when set */}
      {cfg && (
        <div
          className={cn(
            'h-0.5 rounded-b-lg',
            row.status === 'PRESENT' && 'bg-status-present',
            row.status === 'ABSENT' && 'bg-status-absent',
            row.status === 'LATE' && 'bg-status-late',
            row.status === 'EXCUSED' && 'bg-status-excused',
          )}
        />
      )}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface p-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-border flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-border" />
              <div className="h-2 w-1/4 rounded bg-border" />
            </div>
            <div className="hidden md:flex gap-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-8 w-12 rounded-md bg-border" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
