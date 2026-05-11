import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight, Plus, Shield, Users, UserCheck, UserX, Search } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/skeleton'

interface UserSummary {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  emailVerified: boolean
  googleLinked: boolean
  createdAt: string
}

const ROLES = ['ADMIN', 'FACILITATOR', 'INSTRUCTOR', 'TEAM_LEADER', 'STUDENT']

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  FACILITATOR: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
  INSTRUCTOR: 'bg-[#EEF2FF] text-[#7C3AED] border-[#C7D2FE]',
  TEAM_LEADER: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  STUDENT: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
}

function formatRoleName(role: string) {
  return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface CreateForm {
  name: string
  email: string
  role: string
  password: string
}
const EMPTY_CREATE: CreateForm = {
  name: '',
  email: '',
  role: 'INSTRUCTOR',
  password: '',
}

export default function UserManagement() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () =>
      client.get('/admin/users', {
        params: {
          page,
          size: 20,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
        },
      }).then(r => r.data.data),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      client.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: 'Role updated' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update role'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateForm) => {
      const body: Record<string, string> = {
        name: payload.name,
        email: payload.email,
        role: payload.role,
      }
      if (payload.password.trim()) body.password = payload.password
      return client.post('/admin/users', body)
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateOpen(false)
      setCreateForm(EMPTY_CREATE)
      const msg = resp?.data?.message ?? 'User created'
      toast({ title: msg })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create user'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      client.patch(`/admin/users/${id}/active`, { active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({ title: vars.active ? 'Account activated' : 'Account deactivated' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update account'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const users: UserSummary[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

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
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">User Management</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {totalElements > 0 ? `${totalElements} total accounts` : 'Manage user roles and access'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setCreateForm(EMPTY_CREATE); setCreateOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> New user
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Admin only
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {ROLES.map(r => (
              <SelectItem key={r} value={r}>
                {formatRoleName(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Verified</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[#94A3B8]">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map(u => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <TableRow key={u.id} className={!u.active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-xs">
                            <AvatarFallback className="bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold dark:bg-[#4F46E5]/15 dark:text-[#A5B4FC]">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[140px]">{u.name}</p>
                            {u.googleLinked && (
                              <p className="text-[10px] text-[#94A3B8]">Google account</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#64748B] dark:text-[#94A3B8] hidden sm:table-cell">{u.email}</TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Badge className={`text-xs ${roleBadgeClass[u.role] ?? ''}`}>
                            {formatRoleName(u.role)}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={role => roleMutation.mutate({ id: u.id, role })}
                            disabled={roleMutation.isPending}
                          >
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => (
                                <SelectItem key={r} value={r} className="text-xs">
                                  {formatRoleName(r)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge className="bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] text-xs dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-[#1E3A5F]">Deactivated</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {u.emailVerified ? (
                          <span className="text-xs text-[#059669] font-medium">Verified</span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">Unverified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#64748B] dark:text-[#94A3B8] hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs h-7 ${u.active ? 'text-[#64748B] hover:text-[#DC2626]' : 'text-[#64748B] hover:text-[#059669]'}`}
                            onClick={() => activeMutation.mutate({ id: u.id, active: !u.active })}
                            disabled={activeMutation.isPending}
                            title={u.active ? 'Deactivate account' : 'Activate account'}
                          >
                            {u.active
                              ? <><UserX className="h-3.5 w-3.5 mr-1" /> Deactivate</>
                              : <><UserCheck className="h-3.5 w-3.5 mr-1" /> Activate</>
                            }
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm) }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Full name</Label>
              <Input
                id="cu-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="jane@auca.ac.rw"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{formatRoleName(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-pw">Password (optional)</Label>
              <Input
                id="cu-pw"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank to email a temporary password"
              />
              <p className="text-[11px] text-muted-foreground">
                If blank, the server generates a random temporary password and emails it.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline" size="icon" className="h-9 w-9"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} className="px-2 text-sm text-[#94A3B8]">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon" className="h-9 w-9 text-xs"
                onClick={() => setPage(p as number)}
              >
                {(p as number) + 1}
              </Button>
            )
          )}
          <Button
            variant="outline" size="icon" className="h-9 w-9"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
