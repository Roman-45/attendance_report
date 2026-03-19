import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  Award, FileText, Bell, Shield, GraduationCap,
  LogOut, UserCircle, ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import client from '@/api/client'

interface SidebarProps {
  onNavClick?: () => void
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()
  const { collapsed, toggle } = useSidebar()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const photoSrc = user?.photoUrl
    ? `${client.defaults.baseURL?.replace('/api/v1', '')}${user.photoUrl}`
    : undefined

  // Nav item classes: pill active style (like Oculis inspiration)
  const navItem = cn(
    "flex items-center gap-3 rounded-full px-3 py-2 text-slate-400 transition-all duration-150",
    "hover:text-white hover:bg-white/10",
    collapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
  )
  const activeNavItem = "bg-primary/20 text-primary font-medium hover:bg-primary/25 hover:text-primary"

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-slate-900 text-slate-100 transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[64px]" : "w-64"
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "flex h-16 items-center border-b border-slate-700/50 relative shrink-0",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        {collapsed ? (
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Expand sidebar"
          >
            <GraduationCap className="h-5 w-5 text-primary" />
          </button>
        ) : (
          <>
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <span className="ml-2 text-base font-semibold truncate">AUCA Attendance</span>
            <button
              onClick={toggle}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
          </>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1 py-4 overflow-y-auto", collapsed ? "px-1.5" : "px-3")}>
        {hasRole('STUDENT') ? (
          <>
            <NavItem to="/portal" end icon={LayoutDashboard} label="My Dashboard" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            <NavItem to="/portal/modules" icon={BookOpen} label="My Modules" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            <NavItem to="/portal/attendance" icon={ClipboardCheck} label="My Attendance" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            <NavItem to="/portal/marks" icon={Award} label="My Marks" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
          </>
        ) : (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />

            {hasRole('ADMIN') && (
              <NavItem to="/students" icon={Users} label="Students" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN', 'FACILITATOR', 'INSTRUCTOR') && (
              <NavItem to="/modules" icon={BookOpen} label="Modules" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN', 'FACILITATOR') && (
              <NavItem to="/attendance" icon={ClipboardCheck} label="Attendance" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN', 'INSTRUCTOR') && (
              <NavItem to="/marks" icon={Award} label="Marks & Grades" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN', 'FACILITATOR') && (
              <NavItem to="/reports" icon={FileText} label="Reports" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN') && (
              <>
                <div className={cn("border-t border-slate-700/50 my-2", collapsed ? "mx-1" : "mx-0")} />
                <NavItem to="/notifications" icon={Bell} label="Notifications" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
                <NavItem to="/audit-log" icon={Shield} label="Audit Log" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
              </>
            )}
          </>
        )}
      </nav>

      {/* Bottom: avatar + profile + sign out */}
      <div className={cn("border-t border-slate-700/50 py-3 space-y-1 shrink-0", collapsed ? "px-1.5" : "px-3")}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={photoSrc} alt={user?.name} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-slate-100">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <NavItem to="/profile" icon={UserCircle} label="Profile & Settings" collapsed={collapsed} navItem={navItem} activeNavItem={activeNavItem} onNavClick={onNavClick} />
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-full px-3 py-2 text-xs text-slate-400 transition-all hover:text-white hover:bg-white/10",
            collapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}

// ── NavItem helper ──────────────────────────────────────────────────────────
interface NavItemProps {
  to: string
  end?: boolean
  icon: React.ElementType
  label: string
  collapsed: boolean
  navItem: string
  activeNavItem: string
  onNavClick?: () => void
}

function NavItem({ to, end, icon: Icon, label, collapsed, navItem, activeNavItem, onNavClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(navItem, isActive && activeNavItem)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </NavLink>
  )
}
