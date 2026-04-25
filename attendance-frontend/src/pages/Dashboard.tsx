// Thin role-router wrapper. The real implementations live in
// `pages/dashboards/{Admin,Facilitator,Instructor,Student,TeamLeader}Dashboard.tsx`.
// `RoleRedirect` in App.tsx already sends students to /portal and team leaders
// to /leader, but if any user lands on /dashboard we still render the right
// sub-dashboard for their role.
import { useAuth } from '@/context/AuthContext'
import AdminDashboard from '@/pages/dashboards/AdminDashboard'
import FacilitatorDashboard from '@/pages/dashboards/FacilitatorDashboard'
import InstructorDashboard from '@/pages/dashboards/InstructorDashboard'
import StudentDashboard from '@/pages/dashboards/StudentDashboard'
import TeamLeaderDashboard from '@/pages/dashboards/TeamLeaderDashboard'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  if (isLoading || !user) return null

  switch (user.role) {
    case 'ADMIN':       return <AdminDashboard />
    case 'FACILITATOR': return <FacilitatorDashboard />
    case 'INSTRUCTOR':  return <InstructorDashboard />
    case 'STUDENT':     return <StudentDashboard />
    case 'TEAM_LEADER': return <TeamLeaderDashboard />
    default:            return <AdminDashboard />
  }
}

// Re-export retained for backwards compat with `StudentPortal.tsx` which
// imports `GradientStatCard` from this file.
export { GradientStatCard } from './DashboardGradientCard'
