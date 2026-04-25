import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CheckCircle, ChevronRight, GraduationCap, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import client from '@/api/client'
import type { Module } from '@/types'

export default function SelectModule() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: ['modules-available'],
    queryFn: async () => {
      const { data } = await client.get('/modules/available')
      return data.data
    },
  })

  const selectMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const { data } = await client.post('/modules/select', { moduleId })
      return data.data
    },
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      navigate('/modules')
    },
  })

  const handleConfirm = () => {
    if (selectedId !== null) {
      selectMutation.mutate(selectedId)
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-status-draft-bg text-status-draft border-status-draft-border',
    ACTIVE: 'bg-status-active-bg text-status-active border-status-active-border',
    CLOSED: 'bg-status-closed-bg text-status-closed border-status-closed-border',
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[420px] lg:min-h-screen bg-brand flex-col items-center justify-center p-10 fixed left-0 top-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-32 right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 backdrop-blur">
              <GraduationCap className="h-6 w-6 text-brand-foreground" />
            </div>
            <span className="text-xl font-semibold text-brand-foreground">AUCA Attendance</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-brand-foreground">
              Welcome,{' '}
              <span className="text-white/70">Instructor</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Before you get started, select the module you will be teaching this cohort.
              This is a one-time step — you will be accountable for this module going forward.
            </p>
          </div>
          <div className="mt-4 space-y-3 w-full">
            {[
              { icon: Layers, label: 'Manage attendance sessions' },
              { icon: BookOpen, label: 'Track marks & grades' },
              { icon: CheckCircle, label: 'Start and close your module' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 rounded-md px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">
                  <Icon className="h-4 w-4 text-brand-foreground" />
                </div>
                <span className="text-sm text-brand-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right main panel */}
      <div className="w-full max-w-2xl lg:ml-[420px]">
        <div className="mb-8 text-center lg:text-left">
          <h1>Choose your module</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the course you are teaching. This cannot be changed after selection.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <Card className="border-border bg-surface">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted">
                <BookOpen className="h-7 w-7 text-subtle-foreground" />
              </div>
              <p className="font-medium text-foreground">No modules available</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                All modules already have instructors assigned. Please contact an administrator to create a new module.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((module) => {
              const isSelected = selectedId === module.id
              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedId(module.id)}
                  className={`w-full text-left rounded-md border px-5 py-4 transition-all ${
                    isSelected
                      ? 'border-brand bg-brand-light shadow-sm'
                      : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        isSelected ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">{module.name}</span>
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                            {module.code}
                          </span>
                          {module.status && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[module.status] ?? ''}`}>
                              {module.status}
                            </span>
                          )}
                        </div>
                        {module.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                        )}
                        {(module.startDate || module.endDate) && (
                          <p className="mt-1 text-xs text-subtle-foreground">
                            {module.startDate} {module.startDate && module.endDate ? '→' : ''} {module.endDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 mt-1 ${
                      isSelected
                        ? 'border-brand bg-brand'
                        : 'border-border-strong bg-surface'
                    }`}>
                      {isSelected && <CheckCircle className="h-3 w-3 text-brand-foreground" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {modules.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleConfirm}
              disabled={selectedId === null || selectMutation.isPending}
              className="px-6 gap-2"
            >
              {selectMutation.isPending ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  Confirm Selection
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {selectMutation.isError && (
          <p className="mt-3 text-sm text-status-absent text-right">
            {(selectMutation.error as Error)?.message ?? 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </div>
  )
}
