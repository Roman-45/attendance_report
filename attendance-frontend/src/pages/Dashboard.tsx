import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, BookOpen, ClipboardCheck, TrendingUp,
  Calendar, ArrowUpRight, ArrowDownRight,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleDashboard } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuth()

  const { data: modules } = useQuery({
    queryKey: ['dashboard-modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const { data: dashboards } = useQuery({
    queryKey: ['module-dashboards'],
    queryFn: async () => {
      if (!modules?.length) return []
      const results = await Promise.all(
        modules.slice(0, 10).map((m: { id: number }) =>
          client.get(`/modules/${m.id}/dashboard`).then(r => r.data.data).catch(() => null)
        )
      )
      return results.filter(Boolean) as ModuleDashboard[]
    },
    enabled: !!modules?.length,
  })

  const totalStudents = dashboards?.reduce((sum, d) => sum + d.totalStudents, 0) ?? 0
  const totalSessions = dashboards?.reduce((sum, d) => sum + d.totalSessions, 0) ?? 0
  const avgAttendance = dashboards?.length
    ? Math.round(dashboards.reduce((sum, d) => sum + d.averageAttendancePercent, 0) / dashboards.length)
    : 0

  const chartColors = [
    '#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626',
    '#0284C7', '#DB2777', '#0D9488',
  ]

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[#64748B] font-medium">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5 text-[#0F172A] dark:text-[#F1F5F9]">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Calendar className="h-4 w-4" />
          <span>{today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Modules"
          value={modules?.length ?? 0}
          icon={BookOpen}
          trend={modules?.length ? `${modules.length} active` : undefined}
          trendUp
          color="blue"
        />
        <StatCard
          label="Total Enrollments"
          value={totalStudents}
          icon={Users}
          trend={totalStudents > 0 ? 'across all modules' : undefined}
          color="emerald"
        />
        <StatCard
          label="Sessions Recorded"
          value={totalSessions}
          icon={ClipboardCheck}
          trend={totalSessions > 0 ? 'total sessions' : undefined}
          color="amber"
        />
        <StatCard
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          icon={TrendingUp}
          trend={avgAttendance >= 75 ? 'Good standing' : avgAttendance > 0 ? 'Needs attention' : undefined}
          trendUp={avgAttendance >= 75}
          color="violet"
        />
      </div>

      {/* Charts & Module Overview */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Bar chart - takes 3 cols */}
        {dashboards && dashboards.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Attendance by Module</CardTitle>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Average attendance percentage per module</p>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboards} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="moduleName"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Attendance']}
                  />
                  <Bar dataKey="averageAttendancePercent" radius={[6, 6, 0, 0]}>
                    {dashboards.map((_, idx) => (
                      <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Module list - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Module Overview</CardTitle>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Quick stats for each module</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {(!dashboards || dashboards.length === 0) ? (
                <div className="text-center py-10 text-[#94A3B8]">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No module data yet</p>
                </div>
              ) : (
                dashboards.map((d, idx) => (
                  <div
                    key={d.moduleName}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                    >
                      {d.moduleName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-[#0F172A] dark:text-[#F1F5F9]">{d.moduleName}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {d.totalStudents} students · {d.totalSessions} sessions
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-bold",
                        d.averageAttendancePercent >= 75 ? "text-[#059669]" : "text-[#D97706]"
                      )}>
                        {d.averageAttendancePercent}%
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] h-4",
                          d.averageAttendancePercent >= 75
                            ? "text-[#059669] border-[#A7F3D0]"
                            : "text-[#D97706] border-[#FDE68A]"
                        )}
                      >
                        {d.averageAttendancePercent >= 75 ? 'Good' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Stat Card ──
const colorMap = {
  blue: { icon: 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED]', text: 'text-[#4F46E5]' },
  emerald: { icon: 'bg-gradient-to-br from-[#059669] to-[#0D9488]', text: 'text-[#059669]' },
  amber: { icon: 'bg-gradient-to-br from-[#D97706] to-[#EA580C]', text: 'text-[#D97706]' },
  violet: { icon: 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]', text: 'text-[#7C3AED]' },
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color: keyof typeof colorMap
}

function StatCard({ label, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className="hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", c.icon)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-[11px] font-medium", trendUp ? "text-[#059669]" : "text-[#64748B]")}>
              {trendUp !== undefined && (trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
              {trend}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">{value}</p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

export { GradientStatCard } from './DashboardGradientCard'
