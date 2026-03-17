import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Users } from 'lucide-react'
import { format } from 'date-fns'
import { EnrollmentDialog } from '@/components/EnrollmentDialog'

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Module</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : modules.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No modules found</TableCell></TableRow>
              ) : (
                modules.map((m: Module) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.code}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{format(new Date(m.startDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(m.endDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={isActive(m) ? 'default' : 'secondary'}>
                        {isActive(m) ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEnrollModule(m)}
                          title="Manage enrollments"
                        >
                          <Users className="h-4 w-4 mr-1" /> Enroll
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

      {/* Add / Edit Module Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} required disabled={!!editModule} />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} required />
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
