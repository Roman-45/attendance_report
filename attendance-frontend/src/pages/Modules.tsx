import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { Plus, Users, BookOpen, Calendar, Pencil, PlayCircle, XCircle, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'
import { EnrollmentDialog } from '@/components/EnrollmentDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const moduleColors = [
  { gradient: 'from-[#0284C7] to-[#4F46E5]',  bg: 'bg-[#0284C7]' },
  { gradient: 'from-[#059669] to-[#0D9488]',   bg: 'bg-[#059669]' },
  { gradient: 'from-[#7C3AED] to-[#4F46E5]',   bg: 'bg-[#7C3AED]' },
  { gradient: 'from-[#D97706] to-[#DC2626]',    bg: 'bg-[#D97706]' },
  { gradient: 'from-[#DB2777] to-[#DC2626]',    bg: 'bg-[#DB2777]' },
  { gradient: 'from-[#0D9488] to-[#0284C7]',   bg: 'bg-[#0D9488]' },
  { gradient: 'from-[#D97706] to-[#D97706]',    bg: 'bg-[#D97706]' },
  { gradient: 'from-[#4F46E5] to-[#7C3AED]',   bg: 'bg-[#4F46E5]' },
]

const statusBadgeClass: Record<string, string> = {
  DRAFT:  'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  ACTIVE: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  CLOSED: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
}

interface InstructorCandidate {
  id: number
  name: string
  email: string
  currentModuleId: number | null
  currentModuleCode: string | null
}

export default function Modules() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const isFacilitator = hasRole('FACILITATOR')
  const canAssignInstructor = isAdmin || isFacilitator
  const isInstructor = user?.role === 'INSTRUCTOR'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', startDate: '', endDate: '' })
  const [enrollModule, setEnrollModule] = useState<Module | null>(null)
  const [assignModule, setAssignModule] = useState<Module | null>(null)
  const [pickedInstructorId, setPickedInstructorId] = useState<string>('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const saveMutation = useMutation({
    mutationFn: (mod: typeof form) =>
      editModule ? client.put(`/modules/${editModule.id}`, mod) : client.post('/modules', mod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      setDialogOpen(false)
      toast({ title: editModule ? 'Module updated' : 'Module created' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const { data: candidates = [] } = useQuery<InstructorCandidate[]>({
    queryKey: ['instructor-candidates'],
    queryFn: () => client.get('/modules/instructor-candidates').then(r => r.data.data),
    enabled: canAssignInstructor,
  })

  const assignMutation = useMutation({
    mutationFn: ({ moduleId, instructorId }: { moduleId: number; instructorId: number }) =>
      client.post(`/modules/${moduleId}/instructors`, null, { params: { instructorId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-candidates'] })
      setAssignModule(null)
      setPickedInstructorId('')
      toast({ title: 'Instructor assigned' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Assignment failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: ({ moduleId, instructorId }: { moduleId: number; instructorId: number }) =>
      client.delete(`/modules/${moduleId}/instructors/${instructorId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-candidates'] })
      setAssignModule(null)
      toast({ title: 'Instructor unassigned' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unassign failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      client.patch(`/modules/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      toast({ title: 'Module status updated' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const openCreate = () => {
    setEditModule(null)
    setForm({ code: '', name: '', description: '', startDate: '', endDate: '' })
    setDialogOpen(true)
  }

  const openEdit = (m: Module) => {
    setEditModule(m)
    setForm({ code: m.code, name: m.name, description: m.description || '', startDate: m.startDate || '', endDate: m.endDate || '' })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            {isInstructor ? 'My Module' : 'Modules'}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {isInstructor
              ? 'Manage your assigned module and its lifecycle'
              : `${modules.length} modules in the system`}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="shadow-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Module
          </Button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: isInstructor ? 1 : 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse overflow-hidden border-[#E2E8F0] dark:border-[#1E3A5F]">
              <div className="h-2 bg-[#F1F5F9] dark:bg-[#1E293B]" />
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-20 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                <div className="h-4 w-40 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                <div className="h-3 w-32 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && modules.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-[#818CF8]" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">
              {isInstructor ? 'No module assigned' : 'No modules yet'}
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
              {isInstructor
                ? 'Contact an admin to have a module assigned to you.'
                : 'Create your first module to get started'}
            </p>
            {isAdmin && (
              <Button onClick={openCreate} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0">
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Module cards grid */}
      {modules.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m: Module, idx: number) => {
            const color = moduleColors[idx % moduleColors.length]
            const statusClass = statusBadgeClass[m.status] ?? statusBadgeClass.CLOSED

            return (
              <Card
                key={m.id}
                className="group overflow-hidden hover:shadow-lg transition-all border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#CBD5E1] bg-[#FFFFFF] dark:bg-[#111827]"
              >
                {/* Color accent bar */}
                <div className={cn('h-1.5 bg-gradient-to-r', color.gradient)} />

                <CardContent className="p-5">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm', color.bg)}>
                        {m.code.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-mono text-xs text-[#94A3B8]">{m.code}</p>
                        <h3 className="font-semibold text-sm leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{m.name}</h3>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] shrink-0 border font-medium', statusClass)}
                    >
                      {m.status ?? 'ACTIVE'}
                    </Badge>
                  </div>

                  {/* Description */}
                  {m.description && (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mb-3">{m.description}</p>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{m.startDate ? format(new Date(m.startDate), 'MMM d') : '—'}</span>
                    <span>→</span>
                    <span>{m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : '—'}</span>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <GraduationCap className="h-3 w-3" />
                    <span className="truncate">
                      {m.instructors && m.instructors.length > 0
                        ? m.instructors[0]
                        : <span className="italic text-[#94A3B8]">No instructor assigned</span>}
                    </span>
                  </div>

                  {/* Actions — INSTRUCTOR */}
                  {isInstructor && (
                    <div className="flex items-center gap-2">
                      {m.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-[#059669] hover:bg-[#047857] text-white border-0"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: m.id, status: 'ACTIVE' })}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" /> Start Module
                        </Button>
                      )}
                      {m.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-[#DC2626] hover:bg-[#B91C1C] text-white border-0"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: m.id, status: 'CLOSED' })}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Close Module
                        </Button>
                      )}
                      {m.status === 'CLOSED' && (
                        <div className="flex-1 text-center text-xs text-[#64748B] py-1.5">
                          This cohort has ended
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions — ADMIN / FACILITATOR */}
                  {!isInstructor && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setEnrollModule(m)}
                      >
                        <Users className="h-3 w-3 mr-1" /> Enroll
                      </Button>
                      {canAssignInstructor && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => {
                            setAssignModule(m)
                            setPickedInstructorId('')
                          }}
                        >
                          <GraduationCap className="h-3 w-3 mr-1" /> Instructor
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Module Dialog (admin only) */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                  {editModule
                    ? <Pencil className="h-4 w-4 text-[#4F46E5]" />
                    : <Plus className="h-4 w-4 text-[#4F46E5]" />}
                </div>
                {editModule ? 'Edit Module' : 'Add Module'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#334155] dark:text-[#94A3B8]">Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                    required
                    disabled={!!editModule}
                    placeholder="e.g. UX201"
                    className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#334155] dark:text-[#94A3B8]">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. UI/UX Design"
                    className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#334155] dark:text-[#94A3B8]">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief module description"
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#334155] dark:text-[#94A3B8]">Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                    className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] focus-visible:ring-[#4F46E5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#334155] dark:text-[#94A3B8]">End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                    className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#0F172A] dark:text-[#F1F5F9] focus-visible:ring-[#4F46E5]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Module'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Enrollment Dialog */}
      {enrollModule && (
        <EnrollmentDialog
          moduleId={enrollModule.id}
          moduleName={enrollModule.name}
          open={!!enrollModule}
          onOpenChange={(open) => { if (!open) setEnrollModule(null) }}
        />
      )}

      {/* Assign Instructor Dialog (admin + facilitator) */}
      {assignModule && (
        <Dialog open={!!assignModule} onOpenChange={(open) => { if (!open) setAssignModule(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-brand" />
                Assign instructor — {assignModule.code}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {assignModule.instructors && assignModule.instructors.length > 0 ? (
                <div className="rounded-md border border-border-subtle bg-surface-sunken p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Currently teaching
                    </p>
                    <p className="text-sm font-medium text-foreground">{assignModule.instructors[0]}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentName = assignModule.instructors?.[0]
                      const current = candidates.find(c => c.name === currentName)
                      if (current) unassignMutation.mutate({ moduleId: assignModule.id, instructorId: current.id })
                    }}
                    disabled={unassignMutation.isPending}
                  >
                    Unassign
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This module has no instructor yet. Pick one to assign.
                </p>
              )}

              <div className="space-y-2">
                <Label>Pick an instructor</Label>
                <Select value={pickedInstructorId} onValueChange={setPickedInstructorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="— choose an instructor —" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                        {c.currentModuleCode
                          ? ` — already teaches ${c.currentModuleCode}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Each instructor teaches at most one module. Reassigning here unbinds them from any previous module.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModule(null)}>Cancel</Button>
              <Button
                disabled={!pickedInstructorId || assignMutation.isPending}
                onClick={() => assignMutation.mutate({
                  moduleId: assignModule.id,
                  instructorId: Number(pickedInstructorId),
                })}
              >
                {assignMutation.isPending ? 'Assigning…' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
