import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  Award, FileText, Bell, Shield, GraduationCap,
  LogOut, UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import client from '@/api/client'

const navItem = "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-all hover:text-white hover:bg-white/10"
const activeItem = "bg-primary/90 text-white font-medium"

interface SidebarProps {
  onNavClick?: () => void
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const photoSrc = user?.photoUrl
    ? `${client.defaults.baseURL?.replace('/api/v1', '')}${user.photoUrl}`
    : undefined

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700/50 px-6">
        <GraduationCap className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-semibold">AUCA Attendance</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {hasRole('STUDENT') ? (
          <>
            <NavLink to="/portal" end className={({ isActive }) => cn(navItem, isActive && activeItem)} onClick={onNavClick}>
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
                <div className="border-t border-slate-700/50 my-2" />
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

      {/* Bottom: avatar + profile + sign out */}
      <div className="border-t border-slate-700/50 p-4 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={photoSrc} alt={user?.name} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <NavLink
          to="/profile"
          className={({ isActive }) => cn(navItem, "text-xs py-1.5", isActive && activeItem)}
          onClick={onNavClick}
        >
          <UserCircle className="h-4 w-4" /> Profile & Settings
        </NavLink>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-all hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}
