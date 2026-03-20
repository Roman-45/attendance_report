import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useNotificationStream } from '@/hooks/useNotificationStream'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/context/ThemeContext'
import { Search, Bell, X, Menu, UserCircle, LogOut, Sun, Moon } from 'lucide-react'

interface SearchResult {
  type: 'student' | 'module' | 'page'
  label: string
  description: string
  route: string
}

interface TopBarProps {
  onMenuClick?: () => void
}

const PAGE_RESULTS: SearchResult[] = [
  { type: 'page', label: 'Dashboard', description: 'Overview & statistics', route: '/dashboard' },
  { type: 'page', label: 'Students', description: 'Manage students', route: '/students' },
  { type: 'page', label: 'Modules', description: 'Manage modules', route: '/modules' },
  { type: 'page', label: 'Attendance', description: 'Record & view attendance', route: '/attendance' },
  { type: 'page', label: 'Marks & Grades', description: 'Manage marks & compute grades', route: '/marks' },
  { type: 'page', label: 'Reports', description: 'Download reports (Excel/PDF)', route: '/reports' },
  { type: 'page', label: 'Notifications', description: 'View notifications', route: '/notifications' },
  { type: 'page', label: 'User Management', description: 'Manage roles and account status', route: '/users' },
  { type: 'page', label: 'Audit Log', description: 'View audit trail', route: '/audit-log' },
  { type: 'page', label: 'My Portal', description: 'Student self-service', route: '/portal' },
  { type: 'page', label: 'Profile & Settings', description: 'Manage your profile', route: '/profile' },
]

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, hasRole, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = hasRole('ADMIN')
  const { toast } = useToast()

  // Fetch initial unread count — SSE will invalidate this query in real time
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notification-count'],
    queryFn: () => client.get('/notifications/unread-count').then(r => r.data.data).catch(() => 0),
    enabled: isAdmin,
    // No polling — SSE events trigger invalidation instead
  })

  // Real-time push: invalidates the unread count + shows toast when a notification arrives
  useNotificationStream(isAdmin, (payload) => {
    toast({
      title: payload.title ?? 'New Notification',
      description: payload.message ?? (payload.studentName ? `Student: ${payload.studentName}` : 'You have a new alert'),
    })
  })

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()

    const pageMatches = PAGE_RESULTS.filter(
      p => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    )

    const fetchResults = async () => {
      const merged: SearchResult[] = [...pageMatches]

      if (hasRole('ADMIN', 'FACILITATOR', 'INSTRUCTOR')) {
        try {
          const [studentsResp, modulesResp] = await Promise.all([
            hasRole('ADMIN') ? client.get('/students', { params: { search: query, size: 5 } }).catch(() => null) : null,
            client.get('/modules').catch(() => null),
          ])

          if (studentsResp?.data?.data) {
            const students = studentsResp.data.data.content ?? studentsResp.data.data ?? []
            students.slice(0, 5).forEach((s: { studentId: string; name: string; program: string }) => {
              merged.push({
                type: 'student',
                label: s.name,
                description: `${s.studentId} — ${s.program}`,
                route: '/students',
              })
            })
          }

          if (modulesResp?.data?.data) {
            const modules = modulesResp.data.data as Array<{ id: number; code: string; name: string }>
            modules
              .filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
              .slice(0, 5)
              .forEach(m => {
                merged.push({
                  type: 'module',
                  label: m.name,
                  description: m.code,
                  route: '/modules',
                })
              })
          }
        } catch {
          // ignore search errors
        }
      }

      setResults(merged.slice(0, 10))
    }

    const timer = setTimeout(fetchResults, 250)
    return () => clearTimeout(timer)
  }, [query, hasRole])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSelect = (result: SearchResult) => {
    navigate(result.route)
    setQuery('')
    setOpen(false)
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const photoSrc = user?.photoUrl
    ? `${client.defaults.baseURL?.replace('/api/v1', '')}${user.photoUrl}`
    : undefined

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-4 md:px-6">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2 shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global Search */}
      <div className="relative flex-1 max-w-md" ref={dropdownRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search... (Ctrl+K)"
          className="pl-9 pr-8"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${i}`}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(r)}
              >
                <Badge variant="outline" className="shrink-0 text-xs capitalize w-16 justify-center">
                  {r.type}
                </Badge>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && query && results.length === 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-4 shadow-lg text-center text-sm text-muted-foreground">
            No results found
          </div>
        )}
      </div>

      {/* Right side: theme toggle + notifications + user dropdown */}
      <div className="flex items-center gap-2 md:gap-3 ml-2 md:ml-4">
        {/* Dark / Light mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {hasRole('ADMIN') && (
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarImage src={photoSrc} alt={user?.name} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
