import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, TrendingUp, type LucideIcon } from 'lucide-react'
import type { ModuleDashboard } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GradientStatCard
          label="Total Modules"
          value={modules?.length ?? 0}
          icon={BookOpen}
          gradient="from-blue-500 to-sky-400"
          shadow="shadow-blue-500/20"
        />
        <GradientStatCard
          label="Total Enrollments"
          value={totalStudents}
          icon={Users}
          gradient="from-emerald-500 to-teal-400"
          shadow="shadow-emerald-500/20"
        />
        <GradientStatCard
          label="Sessions Recorded"
          value={totalSessions}
          icon={ClipboardCheck}
          gradient="from-amber-500 to-orange-400"
          shadow="shadow-amber-500/20"
        />
        <GradientStatCard
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          icon={TrendingUp}
          gradient="from-violet-500 to-purple-400"
          shadow="shadow-violet-500/20"
        />
      </div>

      {dashboards && dashboards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Module</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboards}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="moduleName" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="averageAttendancePercent" fill="hsl(221.2, 83.2%, 53.3%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Reusable gradient stat card ──────────────────────────────────────────────
interface GradientStatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  gradient: string
  shadow: string
}

function GradientStatCard({ label, value, icon: Icon, gradient, shadow }: GradientStatCardProps) {
  return (
    <div className={`rounded-xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-white/75 text-sm font-medium truncate">{label}</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
        </div>
        <div className="rounded-full bg-white/20 p-2.5 shrink-0 ml-3">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export { GradientStatCard }
