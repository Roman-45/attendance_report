import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  Award, FileText, Bell, Shield, GraduationCap,
  LogOut, UserCircle, ChevronLeft, UserCog,
  Users2, Grid3X3, MessageSquareWarning, Crown
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

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[#0F172A] text-[#CBD5E1] transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[64px]" : "w-64"
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "flex h-16 items-center border-b border-[#1E3A5F] relative shrink-0",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        {collapsed ? (
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#1E293B] transition-colors"
            aria-label="Expand sidebar"
          >
            <GraduationCap className="h-5 w-5 text-[#4F46E5]" />
          </button>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5]/20 shrink-0">
              <GraduationCap className="h-4 w-4 text-[#818CF8]" />
            </div>
            <span className="ml-2.5 text-sm font-bold truncate tracking-tight text-[#F1F5F9]">AUCA Attendance</span>
            <button
              onClick={toggle}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#1E293B] transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-[#64748B]" />
            </button>
          </>
        )}
      </div>

      <nav className={cn("flex-1 py-4 overflow-y-auto", collapsed ? "px-1.5" : "px-3")}>
        {hasRole('TEAM_LEADER') ? (
          <>
            <SectionLabel collapsed={collapsed}>Team Leader</SectionLabel>
            <NavItem to="/leader" end icon={Crown} label="My Teams" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/seating" icon={Grid3X3} label="Seating" collapsed={collapsed} onNavClick={onNavClick} />

            <SectionLabel collapsed={collapsed}>Portal</SectionLabel>
            <NavItem to="/portal" end icon={LayoutDashboard} label="My Dashboard" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/modules" icon={BookOpen} label="My Modules" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/attendance" icon={ClipboardCheck} label="My Attendance" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/marks" icon={Award} label="My Marks" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/claims" icon={MessageSquareWarning} label="My Claims" collapsed={collapsed} onNavClick={onNavClick} />
          </>
        ) : hasRole('STUDENT') ? (
          <>
            <SectionLabel collapsed={collapsed}>Portal</SectionLabel>
            <NavItem to="/portal" end icon={LayoutDashboard} label="My Dashboard" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/modules" icon={BookOpen} label="My Modules" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/attendance" icon={ClipboardCheck} label="My Attendance" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/marks" icon={Award} label="My Marks" collapsed={collapsed} onNavClick={onNavClick} />

            <SectionLabel collapsed={collapsed}>Classroom</SectionLabel>
            <NavItem to="/portal/seating" icon={Grid3X3} label="My Seat" collapsed={collapsed} onNavClick={onNavClick} />
            <NavItem to="/portal/claims" icon={MessageSquareWarning} label="My Claims" collapsed={collapsed} onNavClick={onNavClick} />
          </>
        ) : (
          <>
            <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onNavClick={onNavClick} />

            {hasRole('ADMIN') && (
              <NavItem to="/students" icon={Users} label="Students" collapsed={collapsed} onNavClick={onNavClick} />
            )}

            {hasRole('ADMIN', 'FACILITATOR', 'INSTRUCTOR') && (
              <NavItem to="/modules" icon={BookOpen} label="Modules" collapsed={collapsed} onNavClick={onNavClick} />
            )}

            {(hasRole('ADMIN', 'FACILITATOR') || hasRole('ADMIN', 'INSTRUCTOR')) && (
              <>
                <SectionLabel collapsed={collapsed}>Academic</SectionLabel>
                {hasRole('ADMIN', 'FACILITATOR') && (
                  <NavItem to="/attendance" icon={ClipboardCheck} label="Attendance" collapsed={collapsed} onNavClick={onNavClick} />
                )}
                {hasRole('ADMIN', 'INSTRUCTOR') && (
                  <NavItem to="/marks" icon={Award} label="Marks & Grades" collapsed={collapsed} onNavClick={onNavClick} />
                )}
                {hasRole('ADMIN', 'FACILITATOR') && (
                  <NavItem to="/reports" icon={FileText} label="Reports" collapsed={collapsed} onNavClick={onNavClick} />
                )}
              </>
            )}

            {hasRole('ADMIN', 'FACILITATOR') && (
              <>
                <SectionLabel collapsed={collapsed}>Classroom</SectionLabel>
                <NavItem to="/teams" icon={Users2} label="Teams" collapsed={collapsed} onNavClick={onNavClick} />
                <NavItem to="/seating" icon={Grid3X3} label="Seating" collapsed={collapsed} onNavClick={onNavClick} />
                <NavItem to="/claims" icon={MessageSquareWarning} label="Claims" collapsed={collapsed} onNavClick={onNavClick} />
              </>
            )}

            {hasRole('ADMIN') && (
              <>
                <SectionLabel collapsed={collapsed}>System</SectionLabel>
                <NavItem to="/notifications" icon={Bell} label="Notifications" collapsed={collapsed} onNavClick={onNavClick} />
                <NavItem to="/users" icon={UserCog} label="User Management" collapsed={collapsed} onNavClick={onNavClick} />
                <NavItem to="/audit-log" icon={Shield} label="Audit Log" collapsed={collapsed} onNavClick={onNavClick} />
              </>
            )}
          </>
        )}
      </nav>

      {/* Bottom: avatar + profile + sign out */}
      <div className={cn("border-t border-[#1E3A5F] py-3 space-y-1 shrink-0", collapsed ? "px-1.5" : "px-3")}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl bg-[#1E293B]/60">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={photoSrc} alt={user?.name} />
              <AvatarFallback className="text-xs bg-[#4F46E5] text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-[#F1F5F9]">{user?.name}</p>
              <p className="text-[10px] text-[#64748B] truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <NavItem to="/profile" icon={UserCircle} label="Profile & Settings" collapsed={collapsed} onNavClick={onNavClick} />
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#64748B] transition-all hover:text-white hover:bg-[#1E293B]",
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

// ── Section Label ──
function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) {
    return <div className="h-px bg-[#1E3A5F] mx-2 my-3" />
  }
  return (
    <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest px-3 mt-5 mb-1.5 first:mt-0">
      {children}
    </p>
  )
}

// ── NavItem ──
interface NavItemProps {
  to: string
  end?: boolean
  icon: React.ElementType
  label: string
  collapsed: boolean
  onNavClick?: () => void
}

function NavItem({ to, end, icon: Icon, label, collapsed, onNavClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "",
        isActive
          ? "bg-[#4F46E5]/15 text-[#818CF8] font-medium"
          : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
