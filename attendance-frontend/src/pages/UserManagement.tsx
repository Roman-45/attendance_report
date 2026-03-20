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
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight, Shield, Users, UserCheck, UserX, Search } from 'lucide-react'
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

const ROLES = ['ADMIN', 'FACILITATOR', 'INSTRUCTOR', 'STUDENT']

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  FACILITATOR: 'bg-blue-100 text-blue-700 border-blue-200',
  INSTRUCTOR: 'bg-violet-100 text-violet-700 border-violet-200',
  STUDENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function UserManagement() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalElements > 0 ? `${totalElements} total accounts` : 'Manage user roles and access'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Admin only
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                {r.charAt(0) + r.slice(1).toLowerCase()}
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
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[140px]">{u.name}</p>
                            {u.googleLinked && (
                              <p className="text-[10px] text-muted-foreground">Google account</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{u.email}</TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Badge className={`text-xs ${roleBadgeClass[u.role] ?? ''}`}>
                            {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
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
                                  {r.charAt(0) + r.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">Deactivated</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {u.emailVerified ? (
                          <span className="text-xs text-emerald-600 font-medium">Verified</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unverified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs h-7 ${u.active ? 'text-muted-foreground hover:text-destructive' : 'text-muted-foreground hover:text-emerald-600'}`}
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
              <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
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
