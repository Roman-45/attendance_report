import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/toaster'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import VerifyEmailPending from '@/pages/VerifyEmailPending'
import ForgotPassword from '@/pages/ForgotPassword'
import Dashboard from '@/pages/Dashboard'
import Students from '@/pages/Students'
import Modules from '@/pages/Modules'
import Attendance from '@/pages/Attendance'
import Marks from '@/pages/Marks'
import Reports from '@/pages/Reports'
import Notifications from '@/pages/Notifications'
import AuditLog from '@/pages/AuditLog'
import StudentPortal from '@/pages/StudentPortal'
import Profile from '@/pages/Profile'
import UserManagement from '@/pages/UserManagement'
import Teams from '@/pages/Teams'
import Seating from '@/pages/Seating'
import Claims from '@/pages/Claims'
import TeamLeaderDashboard from '@/pages/TeamLeaderDashboard'
import AcceptInvitation from '@/pages/AcceptInvitation'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function RoleRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'STUDENT') return <Navigate to="/portal" replace />
  if (user.role === 'TEAM_LEADER') return <Navigate to="/leader" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/modules" element={<Modules />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/marks" element={<Marks />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/seating" element={<Seating />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/leader" element={<TeamLeaderDashboard />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/portal/*" element={<StudentPortal />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
