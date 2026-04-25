import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import client from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Camera,
  Save,
  Mail,
  CheckCircle,
  GraduationCap,
  User as UserIcon,
  Lock,
  Bell,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Tab = 'profile' | 'security' | 'notifications'

interface PreferencesPayload {
  emailEnabled: boolean
  pushEnabled: boolean
  notifyAttendance: boolean
  notifyMarks: boolean
  notifyDns: boolean
  notifyClaims: boolean
  notifySystem: boolean
}

const NOTIFICATION_TYPES: { key: keyof PreferencesPayload; label: string; desc: string }[] = [
  { key: 'notifyAttendance', label: 'Attendance submitted',  desc: 'When a facilitator submits session attendance.' },
  { key: 'notifyMarks',      label: 'Marks entered',          desc: 'When new marks are submitted for your module.' },
  { key: 'notifyDns',        label: 'DNS risk alerts',        desc: 'When a student is flagged as approaching DNS threshold.' },
  { key: 'notifyClaims',     label: 'Claim updates',          desc: 'When a claim is raised, updated, or resolved.' },
  { key: 'notifySystem',     label: 'System events',          desc: 'Module activations, user invitations, and system maintenance.' },
]

const CHANNEL_TYPES: { key: keyof PreferencesPayload; label: string; desc: string }[] = [
  { key: 'emailEnabled', label: 'Email',         desc: 'Receive notifications by email.' },
  { key: 'pushEnabled',  label: 'In-app / push', desc: 'Receive notifications inside the app and via push.' },
]

export default function Profile() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const profileIncomplete = searchParams.get('complete') === 'true'
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // ── Profile section state ────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now())

  // Email change
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailConfirming, setEmailConfirming] = useState(false)

  // ── Security: password ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // ── Security: MFA ────────────────────────────────────────────────────────
  const [mfaStep, setMfaStep] = useState<'idle' | 'otp'>('idle')
  const [mfaOtp, setMfaOtp] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)

  // ── Notification preferences (loaded via React Query) ────────────────────
  const {
    data: prefs,
    isLoading: prefsLoading,
    isError: prefsError,
  } = useQuery<PreferencesPayload>({
    queryKey: ['me', 'preferences'],
    queryFn: async () => {
      const { data } = await client.get('/me/preferences')
      return data.data as PreferencesPayload
    },
  })

  const updatePrefs = useMutation({
    mutationFn: async (next: PreferencesPayload) => {
      const { data } = await client.patch('/me/preferences', next)
      return data.data as PreferencesPayload
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me', 'preferences'], data)
    },
    onError: () => {
      toast({ title: 'Failed to save preferences', variant: 'destructive' })
    },
  })

  function togglePref(key: keyof PreferencesPayload, value: boolean) {
    if (!prefs) return
    const next: PreferencesPayload = { ...prefs, [key]: value }
    queryClient.setQueryData(['me', 'preferences'], next) // optimistic
    updatePrefs.mutate(next)
  }

  // Keep local "name" input synced if user object changes
  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getPhotoSrc = () => {
    if (user?.photoUrl) {
      return `${client.defaults.baseURL?.replace('/api/v1', '')}${user.photoUrl}?t=${photoTimestamp}`
    }
    return undefined
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  function readApiError(err: unknown, fallback: string): string {
    return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  }

  // ── Handlers: Profile ────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!name.trim()) return
    setNameSaving(true)
    try {
      await client.patch('/profile', { name: name.trim() })
      await refreshUser()
      toast({ title: 'Name updated successfully' })
    } catch {
      toast({ title: 'Failed to update name', variant: 'destructive' })
    } finally {
      setNameSaving(false)
    }
  }

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await client.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotoTimestamp(Date.now())
      await refreshUser()
      toast({ title: 'Profile photo updated' })
    } catch {
      toast({ title: 'Failed to upload photo', variant: 'destructive' })
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return
    setEmailSending(true)
    try {
      await client.post('/profile/email/request', { newEmail: newEmail.trim() })
      setEmailStep('otp')
      toast({ title: `Verification code sent to ${newEmail}` })
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Failed to send verification code'), variant: 'destructive' })
    } finally {
      setEmailSending(false)
    }
  }

  const handleConfirmEmailChange = async () => {
    if (emailOtp.length !== 6) return
    setEmailConfirming(true)
    try {
      await client.post('/profile/email/confirm', { otp: emailOtp })
      toast({ title: 'Email updated — please sign in again with your new address' })
      logout()
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Invalid or expired code'), variant: 'destructive' })
    } finally {
      setEmailConfirming(false)
    }
  }

  // ── Handlers: Security ───────────────────────────────────────────────────

  const passwordsMatch = nextPassword.length > 0 && nextPassword === confirmPassword
  const passwordValid = nextPassword.length >= 8 && passwordsMatch && currentPassword.length > 0

  const handleChangePassword = async () => {
    if (!passwordValid) return
    setPwSaving(true)
    try {
      await client.post('/me/password', { currentPassword, newPassword: nextPassword })
      toast({ title: 'Password updated' })
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Failed to update password'), variant: 'destructive' })
    } finally {
      setPwSaving(false)
    }
  }

  const handleEnableMfa = async () => {
    setMfaBusy(true)
    try {
      await client.post('/auth/mfa/enable')
      setMfaStep('otp')
      toast({ title: `Verification code sent to ${user?.email}` })
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Failed to start MFA setup'), variant: 'destructive' })
    } finally {
      setMfaBusy(false)
    }
  }

  const handleConfirmMfa = async () => {
    if (mfaOtp.length !== 6 || !user?.email) return
    setMfaBusy(true)
    try {
      await client.post('/auth/mfa/confirm', { email: user.email, otp: mfaOtp })
      toast({ title: 'Two-factor authentication enabled' })
      setMfaStep('idle')
      setMfaOtp('')
      await refreshUser()
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Invalid or expired code'), variant: 'destructive' })
    } finally {
      setMfaBusy(false)
    }
  }

  const handleDisableMfa = async () => {
    setMfaBusy(true)
    try {
      await client.post('/auth/mfa/disable')
      toast({ title: 'Two-factor authentication disabled' })
      await refreshUser()
    } catch (err: unknown) {
      toast({ title: readApiError(err, 'Failed to disable MFA'), variant: 'destructive' })
    } finally {
      setMfaBusy(false)
    }
  }

  // ── Onboarding wizard (Google OAuth flow) — preserved unchanged ─────────

  const [wizardStep, setWizardStep] = useState(0)
  const handleWizardPhotoNext = () => setWizardStep(1)

  const handleWizardNameSave = async () => {
    if (!name.trim()) return
    setNameSaving(true)
    try {
      await client.patch('/profile', { name: name.trim() })
      await refreshUser()
      toast({ title: 'Name updated successfully' })
      setWizardStep(2)
    } catch {
      toast({ title: 'Failed to update name', variant: 'destructive' })
    } finally {
      setNameSaving(false)
    }
  }

  if (profileIncomplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <GraduationCap className="h-10 w-10 text-[#4F46E5] mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Welcome to AUCA</h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Let's set up your profile in a few steps</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === wizardStep
                    ? 'w-8 bg-[#4F46E5]'
                    : i < wizardStep
                    ? 'w-2 bg-[#818CF8]'
                    : 'w-2 bg-[#F1F5F9] dark:bg-[#1E293B]'
                }`}
              />
            ))}
          </div>

          {wizardStep === 0 && (
            <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
              <CardHeader>
                <CardTitle className="text-base text-center text-[#0F172A] dark:text-[#F1F5F9]">Upload a profile photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div
                  className="relative group cursor-pointer ring-4 ring-[#FFFFFF] dark:ring-[#111827] rounded-full"
                  onClick={handlePhotoClick}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={getPhotoSrc()} alt={user?.name} />
                    <AvatarFallback className="text-xl bg-[#4F46E5] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {photoUploading
                      ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <Camera className="h-5 w-5 text-white" />
                    }
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Click to upload — JPG, PNG or GIF</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleWizardPhotoNext}>Skip</Button>
                  <Button onClick={handleWizardPhotoNext} disabled={photoUploading}>
                    {getPhotoSrc() ? 'Next' : 'Skip for now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {wizardStep === 1 && (
            <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
              <CardHeader>
                <CardTitle className="text-base text-center text-[#0F172A] dark:text-[#F1F5F9]">What's your full name?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleWizardNameSave()}
                  placeholder="Enter your full name"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setWizardStep(0)}>Back</Button>
                  <Button onClick={handleWizardNameSave} disabled={nameSaving || !name.trim()}>
                    {nameSaving ? 'Saving…' : 'Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {wizardStep === 2 && (
            <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-[#059669]" />
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">You're all set!</h2>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Your profile is ready. You can always update it later.</p>
                </div>
                <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // ── Settings page (tabbed) ───────────────────────────────────────────────

  const TABS: { id: Tab; icon: typeof UserIcon; label: string }[] = [
    { id: 'profile',       icon: UserIcon, label: 'Profile' },
    { id: 'security',      icon: Lock,     label: 'Security' },
    { id: 'notifications', icon: Bell,     label: 'Notifications' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Settings</h1>
        <p className="text-[#64748B] dark:text-[#94A3B8]">Manage your account preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg p-1 self-start w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-colors ${
                active
                  ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] shadow-sm border border-[#E2E8F0] dark:border-[#1E3A5F]'
                  : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <>
          {/* Profile header card with gradient banner */}
          <div className="rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-sm">
            <div className="h-28 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
            <div className="px-6 pb-6 bg-[#FFFFFF] dark:bg-[#111827]">
              <div className="flex items-end gap-4 -mt-12 mb-4">
                <div
                  className="relative group cursor-pointer ring-4 ring-[#FFFFFF] dark:ring-[#111827] rounded-full shrink-0"
                  onClick={handlePhotoClick}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={getPhotoSrc()} alt={user?.name} />
                    <AvatarFallback className="text-xl bg-[#4F46E5] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {photoUploading
                      ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <Camera className="h-5 w-5 text-white" />
                    }
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="mb-2 min-w-0">
                  <h2 className="text-xl font-bold truncate text-[#0F172A] dark:text-[#F1F5F9]">{user?.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {user?.role && (
                      <Badge variant="secondary" className="text-xs text-[#334155] bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1E3A5F]">
                        {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </Badge>
                    )}
                    <Badge className="text-xs bg-[#ECFDF5] text-[#059669] border-[#059669]/20 hover:bg-[#ECFDF5]">
                      Email verified
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Click on your avatar to upload a new profile photo · JPG, PNG or GIF · max 10 MB
              </p>
            </div>
          </div>

          {/* Display Name */}
          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
            <CardHeader>
              <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Display Name</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="name" className="sr-only">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  placeholder="Your full name"
                />
              </div>
              <Button onClick={handleSaveName} disabled={nameSaving || !name.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {nameSaving ? 'Saving…' : 'Save'}
              </Button>
            </CardContent>
          </Card>

          {/* Email Change */}
          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
            <CardHeader>
              <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Email Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Current email</p>
                <p className="font-medium text-[#334155] dark:text-[#F1F5F9]">{user?.email}</p>
              </div>

              {emailStep === 'idle' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="new-email" className="sr-only">New email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRequestEmailChange()}
                      placeholder="Enter new email address"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRequestEmailChange}
                    disabled={emailSending || !newEmail.trim()}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {emailSending ? 'Sending…' : 'Send Code'}
                  </Button>
                </div>
              )}

              {emailStep === 'otp' && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#818CF8]/30 bg-[#EEF2FF] px-4 py-3">
                    <p className="text-sm text-[#4F46E5]">
                      Enter the 6-digit code sent to <strong>{newEmail}</strong>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={emailOtp}
                      onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && handleConfirmEmailChange()}
                      placeholder="000000"
                      className="text-center text-xl tracking-[0.5em] font-mono max-w-[160px]"
                      maxLength={6}
                    />
                    <Button
                      onClick={handleConfirmEmailChange}
                      disabled={emailConfirming || emailOtp.length !== 6}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {emailConfirming ? 'Confirming…' : 'Confirm'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { setEmailStep('idle'); setEmailOtp('') }}
                      className="text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <>
          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
            <CardHeader>
              <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cur-pw" className="text-xs font-semibold mb-1.5 block">Current password</Label>
                <PasswordInput
                  id="cur-pw"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-pw" className="text-xs font-semibold mb-1.5 block">New password</Label>
                <PasswordInput
                  id="new-pw"
                  value={nextPassword}
                  onChange={e => setNextPassword(e.target.value)}
                  showStrength
                />
              </div>
              <div>
                <Label htmlFor="confirm-pw" className="text-xs font-semibold mb-1.5 block">Confirm new password</Label>
                <PasswordInput
                  id="confirm-pw"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-[#DC2626] mt-1">Passwords do not match.</p>
                )}
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex justify-end">
                <Button onClick={handleChangePassword} disabled={!passwordValid || pwSaving}>
                  <Lock className="h-4 w-4 mr-2" />
                  {pwSaving ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
            <CardHeader>
              <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-2">
                Two-Factor Authentication
                {user?.mfaEnabled
                  ? <Badge className="text-xs bg-[#ECFDF5] text-[#059669] border-[#059669]/20 hover:bg-[#ECFDF5]">Enabled</Badge>
                  : <Badge variant="secondary" className="text-xs">Disabled</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                Add an extra layer of security: when MFA is on we email you a 6-digit code at sign-in.
              </p>

              {user?.mfaEnabled ? (
                <Button variant="outline" onClick={handleDisableMfa} disabled={mfaBusy}>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  {mfaBusy ? 'Disabling…' : 'Disable MFA'}
                </Button>
              ) : mfaStep === 'idle' ? (
                <Button onClick={handleEnableMfa} disabled={mfaBusy}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {mfaBusy ? 'Sending code…' : 'Enable MFA'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#818CF8]/30 bg-[#EEF2FF] px-4 py-3">
                    <p className="text-sm text-[#4F46E5]">
                      Enter the 6-digit code sent to <strong>{user?.email}</strong>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      value={mfaOtp}
                      onChange={e => setMfaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && handleConfirmMfa()}
                      placeholder="000000"
                      className="text-center text-xl tracking-[0.5em] font-mono max-w-[160px]"
                      maxLength={6}
                    />
                    <Button onClick={handleConfirmMfa} disabled={mfaBusy || mfaOtp.length !== 6}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {mfaBusy ? 'Confirming…' : 'Confirm'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { setMfaStep('idle'); setMfaOtp('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <Card className="shadow-sm border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#FFFFFF] dark:bg-[#111827]">
          <CardHeader>
            <CardTitle className="text-base text-[#0F172A] dark:text-[#F1F5F9]">Notification Preferences</CardTitle>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">Choose which channels and events trigger a notification. Saved automatically.</p>
          </CardHeader>
          <CardContent className="p-0">
            {prefsLoading && (
              <div className="px-5 py-8 text-sm text-[#64748B] dark:text-[#94A3B8]">Loading preferences…</div>
            )}
            {prefsError && (
              <div className="px-5 py-8 text-sm text-[#DC2626]">Failed to load preferences. Try refreshing the page.</div>
            )}
            {prefs && (
              <>
                {/* Channels group */}
                <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Channels</p>
                </div>
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                  {CHANNEL_TYPES.map(({ key, label, desc }) => (
                    <PrefRow
                      key={key}
                      label={label}
                      desc={desc}
                      checked={!!prefs[key]}
                      onChange={(v) => togglePref(key, v)}
                    />
                  ))}
                </div>

                {/* Events group */}
                <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] border-y border-[#E2E8F0] dark:border-[#1E3A5F]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Events</p>
                </div>
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                  {NOTIFICATION_TYPES.map(({ key, label, desc }) => (
                    <PrefRow
                      key={key}
                      label={label}
                      desc={desc}
                      checked={!!prefs[key]}
                      onChange={(v) => togglePref(key, v)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

// ── Toggle row helper ────────────────────────────────────────────────────────

function PrefRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">{label}</p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{desc}</p>
      </div>
      <label className="relative flex-shrink-0 cursor-pointer mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 rounded-full border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F1F5F9] dark:bg-[#1E293B] peer-checked:bg-[#4F46E5] peer-checked:border-[#4F46E5] transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white border border-[#E2E8F0] shadow-sm peer-checked:translate-x-4 transition-transform" />
      </label>
    </div>
  )
}
