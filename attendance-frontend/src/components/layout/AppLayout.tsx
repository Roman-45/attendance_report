import { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <img
          src="/auca-logo.jpg"
          alt="AUCA"
          className="h-14 w-14 rounded-2xl object-cover shadow-md"
        />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-brand animate-[loading_1.2s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
        <style>{`
          @keyframes loading {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Instructors who haven't selected a module yet must be redirected to the selection page
  if (
    user?.role === 'INSTRUCTOR' &&
    user?.moduleSelectionRequired &&
    location.pathname !== '/select-module'
  ) {
    return <Navigate to="/select-module" replace />
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — handles its own desktop/mobile rendering */}
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
