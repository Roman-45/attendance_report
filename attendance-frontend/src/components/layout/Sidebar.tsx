import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  Award, FileText, Bell, Shield, GraduationCap,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItem = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
const activeItem = "bg-muted text-primary"

interface SidebarProps {
  onNavClick?: () => void
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <GraduationCap className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-semibold">AUCA Attendance</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {hasRole('STUDENT') ? (
          <>
            <NavLink to="/portal" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
              <LayoutDashboard className="h-4 w-4" /> My Dashboard
            </NavLink>
            <NavLink to="/portal/modules" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
              <BookOpen className="h-4 w-4" /> My Modules
            </NavLink>
            <NavLink to="/portal/attendance" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
              <ClipboardCheck className="h-4 w-4" /> My Attendance
            </NavLink>
            <NavLink to="/portal/marks" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
              <Award className="h-4 w-4" /> My Marks
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>

            {hasRole('ADMIN') && (
              <NavLink to="/students" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                <Users className="h-4 w-4" /> Students
              </NavLink>
            )}

            {hasRole('ADMIN', 'FACILITATOR', 'INSTRUCTOR') && (
              <NavLink to="/modules" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                <BookOpen className="h-4 w-4" /> Modules
              </NavLink>
            )}

            {hasRole('ADMIN', 'FACILITATOR') && (
              <NavLink to="/attendance" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                <ClipboardCheck className="h-4 w-4" /> Attendance
              </NavLink>
            )}

            {hasRole('ADMIN', 'INSTRUCTOR') && (
              <NavLink to="/marks" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                <Award className="h-4 w-4" /> Marks & Grades
              </NavLink>
            )}

            {hasRole('ADMIN', 'FACILITATOR') && (
              <NavLink to="/reports" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                <FileText className="h-4 w-4" /> Reports
              </NavLink>
            )}

            {hasRole('ADMIN') && (
              <>
                <NavLink to="/notifications" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                  <Bell className="h-4 w-4" /> Notifications
                </NavLink>
                <NavLink to="/audit-log" className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
                  <Shield className="h-4 w-4" /> Audit Log
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
