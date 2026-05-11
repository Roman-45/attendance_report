import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireRole } from '@/components/auth/RequireRole'
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
import Schedule from '@/pages/Schedule'
import Grades from '@/pages/Grades'
import AuditLog from '@/pages/AuditLog'
import StudentPortal from '@/pages/StudentPortal'
import Profile from '@/pages/Profile'
import UserManagement from '@/pages/UserManagement'
import Teams from '@/pages/Teams'
import Seating from '@/pages/Seating'
import Claims from '@/pages/Claims'
import TeamLeaderDashboard from '@/pages/dashboards/TeamLeaderDashboard'
import AcceptInvitation from '@/pages/AcceptInvitation'
import SelectModule from '@/pages/SelectModule'
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
  if (user.role === 'INSTRUCTOR' && user.moduleSelectionRequired) return <Navigate to="/select-module" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/select-module" element={<SelectModule />} />
            <Route element={<AppLayout />}>
              {/* Open to every authenticated role */}
              <Route path="/profile" element={<Profile />} />

              {/* Admin / Facilitator / Instructor common areas */}
              <Route element={<RequireRole roles={['ADMIN','FACILITATOR','INSTRUCTOR']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/modules"   element={<Modules />} />
                <Route path="/reports"   element={<Reports />} />
              </Route>

              {/* Admin only */}
              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/audit-log"     element={<AuditLog />} />
                <Route path="/users"         element={<UserManagement />} />
              </Route>

              {/* Admin + Facilitator */}
              <Route element={<RequireRole roles={['ADMIN','FACILITATOR']} />}>
                <Route path="/students" element={<Students />} />
              </Route>

              {/* Facilitator (attendance owner) */}
              <Route element={<RequireRole roles={['FACILITATOR']} />}>
                <Route path="/attendance" element={<Attendance />} />
              </Route>

              {/* Facilitator + Instructor (schedule view) */}
              <Route element={<RequireRole roles={['FACILITATOR','INSTRUCTOR']} />}>
                <Route path="/schedule" element={<Schedule />} />
              </Route>

              {/* Instructor (grading) */}
              <Route element={<RequireRole roles={['INSTRUCTOR']} />}>
                <Route path="/marks"  element={<Marks />} />
                <Route path="/grades" element={<Grades />} />
              </Route>

              {/* Admin + Facilitator + Team-leader (organisation) */}
              <Route element={<RequireRole roles={['ADMIN','FACILITATOR','TEAM_LEADER']} />}>
                <Route path="/teams"   element={<Teams />} />
                <Route path="/seating" element={<Seating />} />
              </Route>

              {/* Team-leader only */}
              <Route element={<RequireRole roles={['TEAM_LEADER']} />}>
                <Route path="/leader" element={<TeamLeaderDashboard />} />
                <Route path="/claims" element={<Claims />} />
              </Route>

              {/* Student portal */}
              <Route element={<RequireRole roles={['STUDENT']} />}>
                <Route path="/portal"   element={<StudentPortal />} />
                <Route path="/portal/*" element={<StudentPortal />} />
              </Route>
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
