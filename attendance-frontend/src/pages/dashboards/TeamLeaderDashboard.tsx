import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '@/api/client'
import { KPICard } from '@/components/ui/KPICard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { InitialsAvatar, getInitials } from '@/components/ui/InitialsAvatar'
import {
  Users, AlertTriangle, MessageSquare, CheckCircle2, Clock, XCircle,
  Plus, ChevronRight, Filter,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PageResponse } from '@/types'

interface TeamResponse {
  id: number
  moduleId: number
  moduleName: string
  name: string
  leaderStudentId: number | null
  leaderStudentName: string | null
  memberCount: number
  createdAt: string
}

interface TeamMember {
  id: number
  studentId: number
  studentName: string
  registrationNumber: string
  joinedAt: string
}

interface ClaimResponse {
  id: number
  studentId: number
  studentName: string
  moduleId: number
  moduleName: string
  claimType: 'ATTENDANCE' | 'MARK' | 'SEAT'
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const CLAIM_STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  PENDING:  { icon: Clock,        color: 'text-status-late',    bg: 'bg-status-late-bg',    label: 'Open' },
  APPROVED: { icon: CheckCircle2, color: 'text-status-present', bg: 'bg-status-present-bg', label: 'Approved' },
  REJECTED: { icon: XCircle,      color: 'text-status-absent',  bg: 'bg-status-absent-bg',  label: 'Rejected' },
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-status-absent-bg border border-status-absent-border rounded-lg">
      <AlertTriangle size={16} className="text-status-absent flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[13px] text-status-absent font-medium">Couldn't load data</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-[12px] font-medium text-brand hover:text-brand-hover">Try again</button>
        )}
      </div>
    </div>
  )
}

export default function TeamLeaderDashboard() {
  const [filter, setFilter] = useState<'all' | 'risk'>('all')

  // 1. My teams
  const teamsQuery = useQuery({
    queryKey: ['team-leader', 'my-teams'],
    queryFn: () => client.get('/team-leader/my-teams').then(r => r.data.data as TeamResponse[]),
  })

  const teams = teamsQuery.data ?? []
  const teamIds = teams.map(t => t.id)
  const moduleIds = teams.map(t => t.moduleId)

  // 2. Members for each team
  const memberQueries = useQueries({
    queries: teamIds.map(teamId => ({
      queryKey: ['team-leader', 'team-members', teamId],
      queryFn: () =>
        client.get(`/team-leader/teams/${teamId}/members`).then(r => r.data.data as TeamMember[]),
    })),
  })

  const allMembers: { team: TeamResponse; member: TeamMember }[] = memberQueries.flatMap((q, idx) => {
    const team = teams[idx]
    if (!team) return []
    return (q.data ?? []).map(m => ({ team, member: m }))
  })

  // 3. Pending claims for the modules our teams are scoped to
  const claimsQueries = useQueries({
    queries: moduleIds.map(moduleId => ({
      queryKey: ['team-leader', 'claims', moduleId],
      queryFn: () =>
        client.get(`/claims/module/${moduleId}`, { params: { page: 0, size: 20 } })
          .then(r => {
            // Backend returns either Page<ClaimResponse> or List, normalise.
            const data = r.data.data
            if (Array.isArray(data)) return data as ClaimResponse[]
            return (data as PageResponse<ClaimResponse>).content
          })
          .catch(() => [] as ClaimResponse[]),
    })),
  })

  const allClaims: ClaimResponse[] = claimsQueries.flatMap(q => q.data ?? [])
  const openClaims = allClaims.filter(c => c.status === 'PENDING')

  const teamSize = allMembers.length
  const dnsCount = 0 // TODO: hide per-member attendance for M2 (see component-level rules)
  const membersLoading = teamsQuery.isLoading || memberQueries.some(q => q.isLoading)

  const filtered = filter === 'risk' ? [] : allMembers // No risk data yet → "risk" filter shows empty

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>{teams.length === 1 ? teams[0].name : 'My Teams'}</h1>
          <p className="text-muted-foreground mt-0.5">
            {teamSize} member{teamSize !== 1 ? 's' : ''}
            {teams.length > 0 && ` · ${teams.map(t => t.moduleName).join(' · ')}`}
          </p>
        </div>
        <Button asChild>
          <Link to="/claims"><Plus className="h-4 w-4 mr-2" />Raise a claim</Link>
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {membersLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <KPICard title="Team Members" value={teamSize} icon={Users} variant="default" trend="Enrolled" trendDirection="neutral" />
            <KPICard title="Teams" value={teams.length} icon={Users} variant="info" trend="Modules covered" trendDirection="neutral" />
            <KPICard title="DNS Risk" value="—" icon={AlertTriangle} variant="default" trend="Coming soon" trendDirection="neutral" />
            <KPICard title="Open Claims" value={openClaims.length} icon={MessageSquare} variant={openClaims.length > 0 ? 'warning' : 'default'} trend="Awaiting review" trendDirection="neutral" />
          </>
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Roster */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Team Roster</p>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{teamSize}</span>
            </div>
            <button
              onClick={() => setFilter(f => f === 'all' ? 'risk' : 'all')}
              className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors border ${
                filter === 'risk'
                  ? 'bg-status-absent-bg text-status-absent border-status-absent-border'
                  : 'text-muted-foreground hover:bg-background border-border'
              }`}
            >
              <Filter size={12} />
              {filter === 'risk' ? 'DNS only' : 'Filter'}
            </button>
          </div>

          {membersLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : teamsQuery.isError ? (
            <div className="p-4"><ErrorState onRetry={() => teamsQuery.refetch()} /></div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Users className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">
                {filter === 'risk'
                  ? 'No members at DNS risk to flag right now'
                  : "No team members yet — invite students from the team page"}
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/teams">Manage teams</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-background border-b border-border">
                    {['Student', 'Reg #', 'Module', 'Attendance'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ team, member }) => (
                    <tr key={`${team.id}-${member.id}`} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar initials={getInitials(member.studentName)} autoColor size="sm" />
                          <p className="font-medium text-foreground">{member.studentName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-[12px]">
                        {member.registrationNumber}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{team.moduleName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {/* TODO M2 follow-up: per-member attendance % needs aggregation across attendance records — wire to a /team-leader/teams/:id/attendance summary endpoint, or compute client-side from /students/:id/attendance once available. */}
                        <span className="text-subtle-foreground">—</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Claims panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Claims</p>
              {openClaims.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-status-late-bg text-status-late border border-status-late-border">
                  {openClaims.length} open
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/claims">All <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>

          {claimsQueries.some(q => q.isLoading) ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : allClaims.length === 0 ? (
            <div className="px-4 py-10 text-center flex-1">
              <MessageSquare className="h-10 w-10 text-subtle-foreground mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No claims yet for your teams</p>
            </div>
          ) : (
            <div className="divide-y divide-border flex-1">
              {allClaims.slice(0, 6).map(c => {
                const cfg = CLAIM_STATUS_CONFIG[c.status] ?? CLAIM_STATUS_CONFIG.PENDING
                const Icon = cfg.icon
                let when = ''
                try { when = formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) } catch { /* ignore */ }
                return (
                  <Link key={c.id} to="/claims" className="block px-4 py-3.5 hover:bg-background transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground">{c.claimType}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.studentName} · <span className="font-mono">{c.moduleName}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{c.description}</p>
                    {when && <p className="text-[10px] text-subtle-foreground mt-1">{when}</p>}
                  </Link>
                )
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-border flex-shrink-0">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/claims"><Plus className="h-3 w-3 mr-1.5" />Raise new claim</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Suppress unused-var warning for dnsCount placeholder */}
      <span className="hidden">{dnsCount}</span>
    </div>
  )
}
