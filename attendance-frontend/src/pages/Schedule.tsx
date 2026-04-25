// Weekly Schedule view — ported from frontend-design-reference/src/app/components/student/Schedule.tsx
//
// Aggregates sessions client-side from existing endpoints:
//   - STUDENT:                GET /me/modules → list of EnrollmentResponse
//   - INSTRUCTOR/FACILITATOR: GET /modules    → list of ModuleResponse (their assigned)
//   - For each module:        GET /modules/:id/sessions (parallel via useQueries)
//
// TODO(N4): If the average student starts having > 12 modules and this view
// feels slow, build a single-call backend endpoint `GET /me/schedule` that
// returns sessions across all enrolled/assigned modules in one round-trip.
// For the current dataset (≤ 8 modules per user) the parallel fan-out is fine.
import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MapPin, Clock, BookOpen } from 'lucide-react'
import { addDays, format, startOfWeek, parseISO, isSameDay } from 'date-fns'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import type { Module, Enrollment, AttendanceSession } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
type DayKey = (typeof DAYS)[number]

const DOW_TO_DAY: Record<number, DayKey | undefined> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri',
}

// Stable colour palette — assigned by hash of module code.
const PALETTE = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
]

function colorFor(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-border rounded-md ${className}`} />
}

interface PortedSession {
  id: number
  day: DayKey
  date: Date
  start: string
  end: string
  code: string
  name: string
  room: string
  type: 'lecture' | 'lab' | 'exam'
}

function formatHHmm(t: string): string {
  // Accepts "HH:mm:ss" or "HH:mm" — trim to "HH:mm".
  return t.length >= 5 ? t.slice(0, 5) : t
}

function inferType(period: string | undefined): 'lecture' | 'lab' | 'exam' {
  const p = (period ?? '').toLowerCase()
  if (p.includes('lab')) return 'lab'
  if (p.includes('exam')) return 'exam'
  return 'lecture'
}

export default function Schedule() {
  const { user } = useAuth()
  const [weekOffset, setWeek] = useState(0)

  const isStudent = user?.role === 'STUDENT'
  const isStaff = user?.role === 'INSTRUCTOR' || user?.role === 'FACILITATOR' || user?.role === 'ADMIN'

  // ── Step 1: fetch the user's modules ────────────────────────────────────
  const studentModulesQuery = useQuery<Enrollment[]>({
    queryKey: ['schedule', 'me-modules'],
    queryFn: () => client.get('/me/modules').then((r) => r.data.data),
    enabled: isStudent,
  })

  const staffModulesQuery = useQuery<Module[]>({
    queryKey: ['schedule', 'modules'],
    queryFn: () => client.get('/modules').then((r) => r.data.data),
    enabled: isStaff,
  })

  const moduleRefs: { id: number; code: string; name: string }[] = useMemo(() => {
    if (isStudent) {
      return (studentModulesQuery.data ?? []).map((e) => ({
        id: e.moduleId,
        code: '', // EnrollmentResponse exposes moduleName but not code; fallback below
        name: e.moduleName,
      }))
    }
    if (isStaff) {
      return (staffModulesQuery.data ?? []).map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
      }))
    }
    return []
  }, [isStudent, isStaff, studentModulesQuery.data, staffModulesQuery.data])

  // ── Step 2: parallel-fetch sessions per module ─────────────────────────
  const sessionQueries = useQueries({
    queries: moduleRefs.map((m) => ({
      queryKey: ['schedule', 'sessions', m.id],
      queryFn: () =>
        client.get(`/modules/${m.id}/sessions`).then((r) => r.data.data as AttendanceSession[]),
      staleTime: 60_000,
    })),
  })

  const isLoading =
    (isStudent && studentModulesQuery.isLoading) ||
    (isStaff && staffModulesQuery.isLoading) ||
    sessionQueries.some((q) => q.isLoading)

  const error =
    studentModulesQuery.error ||
    staffModulesQuery.error ||
    sessionQueries.find((q) => q.error)?.error

  // ── Step 3: derive the active week & filter sessions ───────────────────
  const weekStart = useMemo(() => {
    // Monday of the target week
    const today = new Date()
    return addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7)
  }, [weekOffset])
  const weekEnd = useMemo(() => addDays(weekStart, 4), [weekStart])

  const sessionsByDay = useMemo(() => {
    const grid: Record<DayKey, PortedSession[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [],
    }
    sessionQueries.forEach((q, idx) => {
      const ref = moduleRefs[idx]
      if (!q.data || !ref) return
      for (const s of q.data) {
        const date = typeof s.sessionDate === 'string' ? parseISO(s.sessionDate) : new Date(s.sessionDate)
        if (date < weekStart || date > addDays(weekEnd, 1)) continue
        const dow = date.getDay()
        const day = DOW_TO_DAY[dow]
        if (!day) continue
        const code = ref.code || ref.name.split(' ')[0].toUpperCase().slice(0, 6)
        grid[day].push({
          id: s.id,
          day,
          date,
          start: formatHHmm(s.startTime),
          end: formatHHmm(s.endTime),
          code,
          name: ref.name,
          room: s.period ?? '—',
          type: inferType(s.period),
        })
      }
    })
    DAYS.forEach((d) => grid[d].sort((a, b) => a.start.localeCompare(b.start)))
    return grid
  }, [sessionQueries, moduleRefs, weekStart, weekEnd])

  const allCodes = useMemo(() => {
    const s = new Set<string>()
    DAYS.forEach((d) => sessionsByDay[d].forEach((x) => s.add(x.code)))
    return Array.from(s)
  }, [sessionsByDay])

  const today = new Date()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <div className="flex justify-between">
          <Sk className="h-6 w-28" />
          <div className="flex gap-2">
            <Sk className="h-8 w-8 rounded-md" />
            <Sk className="h-8 w-32 rounded-md" />
            <Sk className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Sk className="h-6 w-full rounded-md" />
              {[0, 1].map((j) => (
                <Sk key={j} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="rounded-xl border border-status-absent-border bg-status-absent-bg p-6 text-center">
          <p className="text-sm font-semibold text-status-absent">Could not load schedule.</p>
          <button
            onClick={() => {
              studentModulesQuery.refetch()
              staffModulesQuery.refetch()
              sessionQueries.forEach((q) => q.refetch())
            }}
            className="mt-3 h-8 px-3 text-[12px] font-medium rounded-md border border-border bg-white hover:bg-background"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Week of {format(weekStart, 'd MMM')}–{format(weekEnd, 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeek((w) => w - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeek(0)}
            className={`h-8 px-3 text-[12px] font-medium rounded-md border transition-colors ${
              weekOffset === 0
                ? 'bg-brand text-white border-brand'
                : 'border-border text-muted-foreground hover:bg-background'
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setWeek((w) => w + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-background transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Empty-state when there are no modules at all */}
      {moduleRefs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-[14px] font-semibold text-foreground mb-1">No modules to display</p>
          <p className="text-[13px] text-muted-foreground">
            {isStudent
              ? 'You are not currently enrolled in any modules.'
              : 'No modules are assigned to your account yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Week grid */}
          <div className="grid grid-cols-5 gap-3">
            {DAYS.map((day, dayIdx) => {
              const date = addDays(weekStart, dayIdx)
              const isToday = isSameDay(date, today)
              const daySessions = sessionsByDay[day]
              return (
                <div key={day}>
                  <div
                    className={`text-center py-1.5 rounded-lg mb-2 ${
                      isToday ? 'bg-brand text-white' : 'bg-background'
                    }`}
                  >
                    <p className={`text-[12px] font-semibold ${isToday ? 'text-white' : 'text-foreground'}`}>
                      {day} {format(date, 'd')}
                    </p>
                    {isToday && <p className="text-[10px] text-white/70">Today</p>}
                  </div>
                  <div className="space-y-2">
                    {daySessions.length === 0 ? (
                      <div className="h-16 border border-dashed border-border rounded-xl flex items-center justify-center">
                        <p className="text-[11px] text-subtle-foreground">Free</p>
                      </div>
                    ) : (
                      daySessions.map((s) => (
                        <div
                          key={s.id}
                          className={`p-3 rounded-xl border transition-all ${colorFor(s.code)}`}
                        >
                          <p className="text-[10px] font-bold mb-0.5">{s.code}</p>
                          <p className="text-[11px] font-semibold leading-tight line-clamp-2">{s.name}</p>
                          <div className="mt-1.5 space-y-0.5">
                            <p className="flex items-center gap-1 text-[10px] opacity-70">
                              <Clock size={9} />
                              {s.start}–{s.end}
                            </p>
                            <p className="flex items-center gap-1 text-[10px] opacity-70">
                              <MapPin size={9} />
                              {s.room}
                            </p>
                          </div>
                          {s.type !== 'lecture' && (
                            <div className="mt-1.5">
                              <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-white/60">
                                {s.type}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          {allCodes.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              {allCodes.map((code) => (
                <div
                  key={code}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium ${colorFor(code)}`}
                >
                  <BookOpen size={11} strokeWidth={2} />
                  {code}
                </div>
              ))}
              <div className="flex items-center gap-2 ml-auto text-[11px] text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-background border border-dashed border-border" />
                Free
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand" />
                Today
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
