// Route guard. Redirects to login if not authenticated, or back to the
// role's home page if their role is not in the allow-list. Usage:
//   <Route element={<RequireRole roles={['ADMIN','FACILITATOR']} />}>
//     <Route path="/students" element={<Students />} />
//   </Route>
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'
import type { ReactNode } from 'react'

interface Props {
  roles: Role[]
  /** Optional. If absent, renders <Outlet /> (used as a route element). */
  children?: ReactNode
}

export function RequireRole({ roles, children }: Props) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children ?? <Outlet />}</>
}
