import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module, Team, TeamMember } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Users2, Trash2, Crown, UserPlus, Shield, MoreVertical, Mail, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnrolledStudent {
  studentId: number
  studentName: string
  studentStudentId: string
}

export default function Teams() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamForm, setTeamForm] = useState({ name: '', leaderStudentId: '' })
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', registrationNumber: '', teamId: '' })
  const [addStudentIds, setAddStudentIds] = useState<string[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', selectedModuleId],
    queryFn: () => client.get(`/modules/${selectedModuleId}/teams`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const { data: enrolledStudents = [] } = useQuery<EnrolledStudent[]>({
    queryKey: ['enrollments-for-teams', selectedModuleId],
    queryFn: () => client.get(`/modules/${selectedModuleId}/enrollments`).then(r => r.data.data),
    enabled: !!selectedModuleId,
  })

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ['team-members', selectedTeam?.id],
    queryFn: () => client.get(`/modules/${selectedModuleId}/teams/${selectedTeam!.id}/members`).then(r => r.data.data),
    enabled: !!selectedTeam && membersOpen,
  })

  const createMutation = useMutation({
    mutationFn: () => client.post(`/modules/${selectedModuleId}/teams`, {
      name: teamForm.name,
      leaderStudentId: teamForm.leaderStudentId ? Number(teamForm.leaderStudentId) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedModuleId] })
      setCreateOpen(false)
      toast({ title: 'Team created' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => client.delete(`/modules/${selectedModuleId}/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedModuleId] })
      toast({ title: 'Team deleted' })
    },
  })

  const addMembersMutation = useMutation({
    mutationFn: (studentIds: number[]) =>
      client.post(`/modules/${selectedModuleId}/teams/${selectedTeam!.id}/members`, { studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeam?.id] })
      queryClient.invalidateQueries({ queryKey: ['teams', selectedModuleId] })
      setAddStudentIds([])
      toast({ title: 'Members added' })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (studentId: number) =>
      client.delete(`/modules/${selectedModuleId}/teams/${selectedTeam!.id}/members/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeam?.id] })
      queryClient.invalidateQueries({ queryKey: ['teams', selectedModuleId] })
      toast({ title: 'Member removed' })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      client.post('/admin/users/invite-team-leader', {
        name: inviteForm.name,
        email: inviteForm.email,
        registrationNumber: inviteForm.registrationNumber,
        teamId: Number(inviteForm.teamId),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedModuleId] })
      setInviteOpen(false)
      setInviteForm({ name: '', email: '', registrationNumber: '', teamId: '' })
      const msg = res.data?.message || 'Invitation sent'
      toast({ title: msg })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send invitation'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const memberStudentIds = new Set(members.map(m => m.studentId))

  // Color palette for team cards — all hex arbitrary values
  const teamColors = [
    {
      gradientFrom: '#0284C7',
      gradientTo: '#4F46E5',
      lightBg: 'bg-[#EEF2FF] dark:bg-[#1E3A5F]/30',
      border: 'border-[#4F46E5]/30 dark:border-[#1E3A5F]',
      barClass: 'from-[#0284C7] to-[#4F46E5]',
      avatarClass: 'from-[#0284C7] to-[#4F46E5]',
    },
    {
      gradientFrom: '#059669',
      gradientTo: '#0D9488',
      lightBg: 'bg-[#ECFDF5] dark:bg-[#1E3A5F]/30',
      border: 'border-[#A7F3D0] dark:border-[#1E3A5F]',
      barClass: 'from-[#059669] to-[#0D9488]',
      avatarClass: 'from-[#059669] to-[#0D9488]',
    },
    {
      gradientFrom: '#7C3AED',
      gradientTo: '#4F46E5',
      lightBg: 'bg-[#EEF2FF] dark:bg-[#1E3A5F]/30',
      border: 'border-[#4F46E5]/30 dark:border-[#1E3A5F]',
      barClass: 'from-[#7C3AED] to-[#4F46E5]',
      avatarClass: 'from-[#7C3AED] to-[#4F46E5]',
    },
    {
      gradientFrom: '#D97706',
      gradientTo: '#DC2626',
      lightBg: 'bg-[#FFFBEB] dark:bg-[#1E3A5F]/30',
      border: 'border-[#FDE68A] dark:border-[#1E3A5F]',
      barClass: 'from-[#D97706] to-[#DC2626]',
      avatarClass: 'from-[#D97706] to-[#DC2626]',
    },
    {
      gradientFrom: '#DB2777',
      gradientTo: '#DC2626',
      lightBg: 'bg-[#FEF2F2] dark:bg-[#1E3A5F]/30',
      border: 'border-[#DC2626]/30 dark:border-[#1E3A5F]',
      barClass: 'from-[#DB2777] to-[#DC2626]',
      avatarClass: 'from-[#DB2777] to-[#DC2626]',
    },
    {
      gradientFrom: '#0284C7',
      gradientTo: '#0D9488',
      lightBg: 'bg-[#ECFDF5] dark:bg-[#1E3A5F]/30',
      border: 'border-[#A7F3D0] dark:border-[#1E3A5F]',
      barClass: 'from-[#0284C7] to-[#0D9488]',
      avatarClass: 'from-[#0284C7] to-[#0D9488]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Teams</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Organize students into collaborative groups</p>
        </div>
        {selectedModuleId && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setInviteForm({ name: '', email: '', registrationNumber: '', teamId: '' })
                setInviteOpen(true)
              }}
              className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
            >
              <Crown className="h-4 w-4 mr-2" /> Invite Team Leader
            </Button>
            <Button
              onClick={() => { setTeamForm({ name: '', leaderStudentId: '' }); setCreateOpen(true) }}
              className="shadow-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Team
            </Button>
          </div>
        )}
      </div>

      {/* Module selector */}
      <div className="max-w-sm">
        <Label className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Module</Label>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger className="mt-1 border-[#E2E8F0] dark:border-[#1E3A5F]">
            <SelectValue placeholder="Choose a module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((m: Module) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {selectedModuleId && !isLoading && teams.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] dark:bg-[#1E3A5F]/30 flex items-center justify-center mx-auto mb-4">
              <Users2 className="h-8 w-8 text-[#4F46E5]/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No teams yet</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">Create your first team to get started</p>
            <Button
              onClick={() => { setTeamForm({ name: '', leaderStudentId: '' }); setCreateOpen(true) }}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-[#E2E8F0] dark:border-[#1E3A5F]">
              <CardContent className="p-5">
                <div className="h-4 w-24 bg-[#F1F5F9] dark:bg-[#1E293B] rounded mb-3" />
                <div className="h-3 w-32 bg-[#F1F5F9] dark:bg-[#1E293B] rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full" />
                  <div className="h-8 w-8 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full" />
                  <div className="h-8 w-8 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team cards grid */}
      {selectedModuleId && teams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t: Team, idx: number) => {
            const color = teamColors[idx % teamColors.length]
            return (
              <Card
                key={t.id}
                className={cn(
                  "group relative overflow-hidden transition-all hover:shadow-lg border",
                  color.border,
                )}
              >
                {/* Color accent bar */}
                <div className={cn("h-1.5 bg-gradient-to-r", color.barClass)} />

                <CardContent className="p-5">
                  {/* Team header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-base leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{t.name}</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        {t.memberCount} {t.memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#DC2626] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
                        onClick={() => deleteMutation.mutate(t.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 w-8 p-0 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                        onClick={() => { setSelectedTeam(t); setMembersOpen(true) }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Leader */}
                  {t.leaderStudentName ? (
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg mb-3", color.lightBg)}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D97706] to-[#DC2626] flex items-center justify-center shadow-sm">
                        <Crown className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{t.leaderStudentName}</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Team Leader</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#1E293B]/50 mb-3 border border-dashed border-[#E2E8F0] dark:border-[#1E3A5F]">
                      <Shield className="h-4 w-4 text-[#94A3B8]/60" />
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">No leader assigned</span>
                    </div>
                  )}

                  {/* Member avatars */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(t.memberCount, 5) }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 border-[#FFFFFF] dark:border-[#111827] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shadow-sm",
                            color.avatarClass,
                          )}
                        >
                          {i + 1}
                        </div>
                      ))}
                      {t.memberCount > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-[#FFFFFF] dark:border-[#111827] bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                          +{t.memberCount - 5}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline" size="sm"
                      className="text-xs h-7 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                      onClick={() => { setSelectedTeam(t); setMembersOpen(true) }}
                    >
                      <Users2 className="h-3 w-3 mr-1" /> Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#1E3A5F]/30 flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Create Team
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Team Name</Label>
              <Input
                value={teamForm.name}
                onChange={(e) => setTeamForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. Team Alpha"
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Team Leader (optional)</Label>
              <Select
                value={teamForm.leaderStudentId}
                onValueChange={(v) => setTeamForm(f => ({ ...f, leaderStudentId: v }))}
              >
                <SelectTrigger className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <SelectValue placeholder="Select a leader" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledStudents.map((s) => (
                    <SelectItem key={s.studentId} value={String(s.studentId)}>
                      {s.studentName} ({s.studentStudentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                {createMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Team Leader Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] dark:bg-[#1E3A5F]/30 flex items-center justify-center">
                <Crown className="h-4 w-4 text-[#D97706]" />
              </div>
              Invite Team Leader
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate() }} className="space-y-4">
            <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E3A5F] p-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Mail className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              An invitation email will be sent with a link to set their password and activate the account.
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Assign to Team</Label>
              <Select
                value={inviteForm.teamId}
                onValueChange={(v) => setInviteForm(f => ({ ...f, teamId: v }))}
              >
                <SelectTrigger className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t: Team) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} {t.leaderStudentName ? `(Leader: ${t.leaderStudentName})` : '(No leader)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Full Name</Label>
              <Input
                value={inviteForm.name}
                onChange={(e) => setInviteForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Iris-Ghislaine GANZA"
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Email Address</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="e.g. iris.ganza@auca.ac.rw"
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#334155] dark:text-[#F1F5F9]">Registration Number</Label>
              <Input
                value={inviteForm.registrationNumber}
                onChange={(e) => setInviteForm(f => ({ ...f, registrationNumber: e.target.value }))}
                required
                placeholder="e.g. 26116"
                className="border-[#E2E8F0] dark:border-[#1E3A5F]"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !inviteForm.teamId || !inviteForm.name || !inviteForm.email || !inviteForm.registrationNumber}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {inviteMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Send Invitation
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#1E3A5F]/30 flex items-center justify-center">
                <Users2 className="h-4 w-4 text-[#4F46E5]" />
              </div>
              {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Add Members */}
          <div className="flex gap-2">
            <Select
              value={addStudentIds[0] || ''}
              onValueChange={(v) => setAddStudentIds([v])}
            >
              <SelectTrigger className="flex-1 border-[#E2E8F0] dark:border-[#1E3A5F]">
                <SelectValue placeholder="Add a student..." />
              </SelectTrigger>
              <SelectContent>
                {enrolledStudents
                  .filter(s => !memberStudentIds.has(s.studentId))
                  .map(s => (
                    <SelectItem key={s.studentId} value={String(s.studentId)}>
                      {s.studentName} ({s.studentStudentId})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={addStudentIds.length === 0 || addMembersMutation.isPending}
              onClick={() => addMembersMutation.mutate(addStudentIds.map(Number))}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Members List */}
          <div className="max-h-72 overflow-auto rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Student</TableHead>
                  <TableHead className="text-[#64748B] dark:text-[#94A3B8]">Reg. No.</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-[#64748B] dark:text-[#94A3B8]">
                      <UserPlus className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      No members yet — add students above
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.id} className="border-[#E2E8F0] dark:border-[#1E3A5F]">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                            selectedTeam?.leaderStudentId === m.studentId
                              ? "bg-gradient-to-br from-[#D97706] to-[#DC2626]"
                              : "bg-gradient-to-br from-[#0284C7] to-[#4F46E5]",
                          )}>
                            {selectedTeam?.leaderStudentId === m.studentId ? (
                              <Crown className="h-3 w-3" />
                            ) : (
                              m.studentName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{m.studentName}</p>
                            {selectedTeam?.leaderStudentId === m.studentId && (
                              <Badge className="text-[9px] h-4 bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] mt-0.5">Leader</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#64748B] dark:text-[#94A3B8]">{m.registrationNumber}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" size="sm"
                          className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#FEF2F2] h-7 w-7 p-0"
                          onClick={() => removeMemberMutation.mutate(m.studentId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
