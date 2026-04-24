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
    DRAFT: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    ACTIVE: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    CLOSED: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[420px] lg:min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#4F46E5]/50 flex-col items-center justify-center p-10 fixed left-0 top-0">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#4F46E5]/20 blur-3xl" />
        <div className="absolute bottom-32 right-8 w-32 h-32 rounded-full bg-[#0284C7]/15 blur-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]">
              <GraduationCap className="h-6 w-6 text-[#F1F5F9]" />
            </div>
            <span className="text-xl font-bold text-[#F1F5F9]">AUCA Attendance</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-[#F1F5F9]">
              Welcome,{' '}
              <span className="text-[#BAE6FD]">Instructor</span>
            </h2>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
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
              <div key={label} className="flex items-center gap-3 bg-white/[0.08] rounded-lg px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4F46E5]/30">
                  <Icon className="h-4 w-4 text-[#BAE6FD]" />
                </div>
                <span className="text-sm text-[#94A3B8]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right main panel */}
      <div className="w-full max-w-2xl lg:ml-[420px]">
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl font-bold text-[#0F172A]">Choose your module</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Select the course you are teaching. This cannot be changed after selection.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <Card className="border-[#E2E8F0] bg-[#FFFFFF]">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9]">
                <BookOpen className="h-7 w-7 text-[#94A3B8]" />
              </div>
              <p className="font-medium text-[#0F172A]">No modules available</p>
              <p className="text-sm text-[#64748B] text-center max-w-xs">
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
                  className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
                    isSelected
                      ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-md shadow-[#4F46E5]/10'
                      : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-[#4F46E5] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#0F172A] truncate">{module.name}</span>
                          <span className="text-xs text-[#64748B] font-mono bg-[#F1F5F9] px-2 py-0.5 rounded">
                            {module.code}
                          </span>
                          {module.status && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColors[module.status] ?? ''}`}>
                              {module.status}
                            </span>
                          )}
                        </div>
                        {module.description && (
                          <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{module.description}</p>
                        )}
                        {(module.startDate || module.endDate) && (
                          <p className="mt-1 text-xs text-[#94A3B8]">
                            {module.startDate} {module.startDate && module.endDate ? '→' : ''} {module.endDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 mt-1 ${
                      isSelected
                        ? 'border-[#4F46E5] bg-[#4F46E5]'
                        : 'border-[#CBD5E1] bg-white'
                    }`}>
                      {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
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
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 gap-2"
            >
              {selectMutation.isPending ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
          <p className="mt-3 text-sm text-[#DC2626] text-right">
            {(selectMutation.error as Error)?.message ?? 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </div>
  )
}
