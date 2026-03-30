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
import { Plus, Users, BookOpen, Calendar, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { EnrollmentDialog } from '@/components/EnrollmentDialog'
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

export default function Modules() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', startDate: '', endDate: '' })
  const [enrollModule, setEnrollModule] = useState<Module | null>(null)
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

  const openCreate = () => {
    setEditModule(null)
    setForm({ code: '', name: '', description: '', startDate: '', endDate: '' })
    setDialogOpen(true)
  }

  const openEdit = (m: Module) => {
    setEditModule(m)
    setForm({ code: m.code, name: m.name, description: m.description, startDate: m.startDate, endDate: m.endDate })
    setDialogOpen(true)
  }

  const isActive = (m: Module) => {
    const now = new Date().toISOString().split('T')[0]
    return m.startDate <= now && m.endDate >= now
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Modules</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">{modules.length} modules in the system</p>
        </div>
        <Button
          onClick={openCreate}
          className="shadow-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Module
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No modules yet</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">Create your first module to get started</p>
            <Button
              onClick={openCreate}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Module
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Module cards grid */}
      {modules.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m: Module, idx: number) => {
            const color = moduleColors[idx % moduleColors.length]
            const active = isActive(m)
            return (
              <Card
                key={m.id}
                className="group overflow-hidden hover:shadow-lg transition-all border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#CBD5E1] bg-[#FFFFFF] dark:bg-[#111827]"
              >
                {/* Color accent */}
                <div className={cn("h-1.5 bg-gradient-to-r", color.gradient)} />

                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                        color.bg,
                      )}>
                        {m.code.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-mono text-xs text-[#94A3B8]">{m.code}</p>
                        <h3 className="font-semibold text-sm leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{m.name}</h3>
                      </div>
                    </div>
                    <Badge
                      variant={active ? 'default' : 'secondary'}
                      className={cn(
                        "text-[10px] shrink-0 border",
                        active
                          ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                          : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1E3A5F]",
                      )}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Description */}
                  {m.description && (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mb-3">{m.description}</p>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-4">
                    <Calendar className="h-3 w-3" />
                    <span>{m.startDate ? format(new Date(m.startDate), 'MMM d') : '—'}</span>
                    <span>→</span>
                    <span>{m.endDate ? format(new Date(m.endDate), 'MMM d, yyyy') : '—'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
                      onClick={() => openEdit(m)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
                      onClick={() => setEnrollModule(m)}
                    >
                      <Users className="h-3 w-3 mr-1" /> Enroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Module Dialog */}
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

      {/* Enrollment Dialog */}
      {enrollModule && (
        <EnrollmentDialog
          moduleId={enrollModule.id}
          moduleName={enrollModule.name}
          open={!!enrollModule}
          onOpenChange={(open) => { if (!open) setEnrollModule(null) }}
        />
      )}
    </div>
  )
}
