import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import client from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Save, Mail, CheckCircle, GraduationCap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const profileIncomplete = searchParams.get('complete') === 'true'
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Name section
  const [name, setName] = useState(user?.name ?? '')
  const [nameSaving, setNameSaving] = useState(false)

  // Photo section
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now())

  // Email change section
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailConfirming, setEmailConfirming] = useState(false)

  const getPhotoSrc = () => {
    if (user?.photoUrl) {
      return `${client.defaults.baseURL?.replace('/api/v1', '')}${user.photoUrl}?t=${photoTimestamp}`
    }
    return undefined
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to send verification code'
      toast({ title: msg, variant: 'destructive' })
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid or expired code'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setEmailConfirming(false)
    }
  }

  // Onboarding wizard state
  const [wizardStep, setWizardStep] = useState(0) // 0 = photo, 1 = name, 2 = done

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

  // Onboarding wizard for new Google users
  if (profileIncomplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <GraduationCap className="h-10 w-10 text-[#4F46E5] mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Welcome to AUCA</h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">Let's set up your profile in a few steps</p>
          </div>

          {/* Progress dots */}
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

          {/* Step 0: Upload Photo */}
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

          {/* Step 1: Set Name */}
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

          {/* Step 2: Done */}
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">Profile & Settings</h1>
        <p className="text-[#64748B] dark:text-[#94A3B8]">Manage your account information</p>
      </div>

      {/* Profile header card with gradient banner */}
      <div className="rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-sm">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
        {/* Content below banner */}
        <div className="px-6 pb-6 bg-[#FFFFFF] dark:bg-[#111827]">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {/* Avatar with click to upload */}
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
            {/* Name + badges */}
            <div className="mb-2 min-w-0">
              <h2 className="text-xl font-bold truncate text-[#0F172A] dark:text-[#F1F5F9]">{user?.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {user?.role && (
                  <Badge variant="secondary" className="text-xs text-[#334155] bg-[#F1F5F9] dark:bg-[#1E293B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1E3A5F]">
                    {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </Badge>
                )}
                <Badge className="text-xs bg-[#ECFDF5] text-[#059669] border-[#059669]/20 hover:bg-[#ECFDF5]">
                  ✓ Email verified
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
