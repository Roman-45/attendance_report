import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Team, TeamMember, ImportResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Upload, Users, Crown, Grid3X3, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function TeamLeaderDashboard() {
  const [importOpen, setImportOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const navigate = useNavigate()

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['my-teams'],
    queryFn: () => client.get('/team-leader/my-teams').then(r => r.data.data),
  })

  const { data: members = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ['team-members', selectedTeam?.id],
    queryFn: () => client.get(`/team-leader/teams/${selectedTeam!.id}/members`).then(r => r.data.data),
    enabled: !!selectedTeam && membersOpen,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ teamId, file }: { teamId: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await client.post(`/team-leader/teams/${teamId}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data as ImportResult
    },
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ['my-teams'] })
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeam?.id] })
      toast({ title: `Import complete: ${result.imported} imported, ${result.skipped} skipped` })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    },
  })

  const teamColors = [
    {
      bg: 'from-[#0284C7] to-[#4F46E5]',
      light: 'bg-[#EEF2FF] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
    {
      bg: 'from-[#059669] to-[#0284C7]',
      light: 'bg-[#ECFDF5] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
    {
      bg: 'from-[#7C3AED] to-[#4F46E5]',
      light: 'bg-[#EEF2FF] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
    {
      bg: 'from-[#D97706] to-[#DC2626]',
      light: 'bg-[#FFFBEB] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
    {
      bg: 'from-[#DC2626] to-[#7C3AED]',
      light: 'bg-[#EEF2FF] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
    {
      bg: 'from-[#0284C7] to-[#059669]',
      light: 'bg-[#EEF2FF] dark:bg-[#1E293B]',
      border: 'border-[#E2E8F0] dark:border-[#1E3A5F]',
    },
  ]

  const openImport = (team: Team) => {
    setSelectedTeam(team)
    setSelectedFile(null)
    setImportResult(null)
    setImportOpen(true)
  }

  const openMembers = (team: Team) => {
    setSelectedTeam(team)
    setMembersOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = () => {
    if (!selectedTeam || !selectedFile) return
    uploadMutation.mutate({ teamId: selectedTeam.id, file: selectedFile })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Team Leader Dashboard</h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Manage your teams, import members, and assign seats</p>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 w-24 bg-[#F1F5F9] dark:bg-[#1E293B] rounded mb-3" />
                <div className="h-3 w-32 bg-[#F1F5F9] dark:bg-[#1E293B] rounded mb-4" />
                <div className="h-8 w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && teams.length === 0 && (
        <Card className="border-dashed border-[#E2E8F0] dark:border-[#1E3A5F]">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-[#4F46E5] opacity-60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0F172A] dark:text-[#F1F5F9]">No teams assigned</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">You are not currently leading any teams. Contact your facilitator if this is unexpected.</p>
          </CardContent>
        </Card>
      )}

      {/* Teams grid */}
      {teams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, idx) => {
            const color = teamColors[idx % teamColors.length]
            return (
              <Card
                key={t.id}
                className={cn(
                  "group relative overflow-hidden transition-all hover:shadow-lg border",
                  color.border,
                )}
              >
                {/* Color accent bar */}
                <div className={cn("h-1.5 bg-gradient-to-r", color.bg)} />

                <CardContent className="p-5">
                  {/* Team header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base leading-tight text-[#0F172A] dark:text-[#F1F5F9]">{t.name}</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{t.moduleName}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 text-[#334155] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#1E3A5F]">
                      {t.memberCount} {t.memberCount === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>

                  {/* Leader indicator */}
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg mb-4", color.light)}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D97706] to-[#DC2626] flex items-center justify-center shadow-sm">
                      <Crown className="h-3.5 w-3.5 text-[#FFFFFF]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-tight text-[#334155] dark:text-[#F1F5F9]">You are the leader</p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Manage members and seating</p>
                    </div>
                  </div>

                  {/* Member avatars preview */}
                  <div className="flex -space-x-2 mb-4">
                    {Array.from({ length: Math.min(t.memberCount, 5) }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-[#FFFFFF] dark:border-[#111827] flex items-center justify-center text-[10px] font-bold text-[#FFFFFF] bg-gradient-to-br shadow-sm",
                          color.bg,
                        )}
                      >
                        {i + 1}
                      </div>
                    ))}
                    {t.memberCount > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#FFFFFF] dark:border-[#111827] bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                        +{t.memberCount - 5}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#EEF2FF] hover:text-[#4F46E5] hover:border-[#4F46E5]"
                      onClick={() => openImport(t)}
                    >
                      <Upload className="h-3 w-3 mr-1.5" /> Import Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#EEF2FF] hover:text-[#4F46E5] hover:border-[#4F46E5]"
                      onClick={() => openMembers(t)}
                    >
                      <Users className="h-3 w-3 mr-1.5" /> View Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#EEF2FF] hover:text-[#4F46E5] hover:border-[#4F46E5]"
                      onClick={() => navigate('/portal/seating')}
                    >
                      <Grid3X3 className="h-3 w-3 mr-1.5" /> Seats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Import Members Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-[#4F46E5]" />
              </div>
              Import Members — {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4">
              {/* Template info */}
              <div className="rounded-lg border border-dashed border-[#E2E8F0] dark:border-[#1E3A5F] p-4 bg-[#F8FAFC] dark:bg-[#1E293B]">
                <p className="text-sm font-medium mb-1 text-[#334155] dark:text-[#F1F5F9]">Expected Excel format (.xlsx)</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  The spreadsheet should have a header row with columns: <span className="font-mono text-[#0F172A] dark:text-[#F1F5F9]">registrationNumber</span> and <span className="font-mono text-[#0F172A] dark:text-[#F1F5F9]">name</span> (optional).
                </p>
              </div>

              {/* Dropzone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[#4F46E5] hover:bg-[#EEF2FF]",
                  selectedFile
                    ? "border-[#4F46E5] bg-[#EEF2FF]"
                    : "border-[#94A3B8] dark:border-[#1E3A5F]",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-[#4F46E5]" />
                    <p className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">{selectedFile.name}</p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-[#94A3B8]" />
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Click to select an Excel file</p>
                    <p className="text-xs text-[#94A3B8]">.xlsx or .xls</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF]"
                >
                  {uploadMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-[#FFFFFF] border-t-transparent animate-spin" />
                      Uploading...
                    </span>
                  ) : 'Upload & Import'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Import results summary */}
              {importResult.imported > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ECFDF5] dark:bg-[#1E293B] border border-[#059669]">
                  <CheckCircle className="h-5 w-5 text-[#059669] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#059669]">
                      {importResult.imported} student{importResult.imported !== 1 ? 's' : ''} imported
                    </p>
                  </div>
                </div>
              )}

              {importResult.skipped > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FFFBEB] dark:bg-[#1E293B] border border-[#D97706]">
                  <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#D97706]">
                      {importResult.skipped} student{importResult.skipped !== 1 ? 's' : ''} skipped
                    </p>
                    <p className="text-xs text-[#D97706] opacity-80">Already exist in this team</p>
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] dark:bg-[#1E293B] border border-[#DC2626]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0" />
                    <p className="text-sm font-medium text-[#DC2626]">
                      {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ul className="space-y-1 ml-7">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-[#DC2626]">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] text-center">
                Total rows processed: {importResult.totalRows}
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                  className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-md bg-[#FFFFFF] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A] dark:text-[#F1F5F9]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <Users className="h-4 w-4 text-[#4F46E5]" />
              </div>
              {selectedTeam?.name} — Members
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-80 overflow-auto space-y-2">
            {membersLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1E293B]">
                    <div className="w-9 h-9 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-[#F1F5F9] dark:bg-[#1E293B] rounded mb-1" />
                      <div className="h-2 w-16 bg-[#F1F5F9] dark:bg-[#1E293B] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!membersLoading && members.length === 0 && (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-[#94A3B8]" />
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No members yet</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Import members using an Excel file</p>
              </div>
            )}

            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827] hover:bg-[#EEF2FF] dark:hover:bg-[#1E293B] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0284C7] to-[#4F46E5] flex items-center justify-center text-xs font-bold text-[#FFFFFF] shadow-sm">
                  {m.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[#334155] dark:text-[#F1F5F9]">{m.studentName}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{m.registrationNumber}</p>
                </div>
                <p className="text-[10px] text-[#94A3B8] shrink-0">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMembersOpen(false)}
              className="border-[#E2E8F0] dark:border-[#1E3A5F] text-[#334155] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
