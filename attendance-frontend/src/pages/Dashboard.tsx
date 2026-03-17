import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, TrendingUp } from 'lucide-react'
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Recorded</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}%</div>
          </CardContent>
        </Card>
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
