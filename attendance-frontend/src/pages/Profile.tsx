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
            <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Welcome to AUCA</h1>
            <p className="text-muted-foreground text-sm mt-1">Let's set up your profile in a few steps</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === wizardStep ? 'w-8 bg-primary' : i < wizardStep ? 'w-2 bg-primary/60' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 0: Upload Photo */}
          {wizardStep === 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-center">Upload a profile photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div
                  className="relative group cursor-pointer ring-4 ring-background rounded-full"
                  onClick={handlePhotoClick}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={getPhotoSrc()} alt={user?.name} />
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
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
                <p className="text-xs text-muted-foreground">Click to upload — JPG, PNG or GIF</p>
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
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-center">What's your full name?</CardTitle>
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
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
                <div className="text-center">
                  <h2 className="text-lg font-semibold">You're all set!</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your profile is ready. You can always update it later.</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Profile header card with gradient banner */}
      <div className="rounded-xl overflow-hidden border shadow-sm">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary via-sky-500 to-teal-400" />
        {/* Content below banner */}
        <div className="px-6 pb-6 bg-card">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {/* Avatar with click to upload */}
            <div
              className="relative group cursor-pointer ring-4 ring-background rounded-full shrink-0"
              onClick={handlePhotoClick}
            >
              <Avatar className="h-24 w-24">
                <AvatarImage src={getPhotoSrc()} alt={user?.name} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
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
              <h2 className="text-xl font-bold truncate">{user?.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {user?.role && (
                  <Badge variant="secondary" className="text-xs">
                    {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </Badge>
                )}
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  ✓ Email verified
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Click on your avatar to upload a new profile photo · JPG, PNG or GIF · max 10 MB
          </p>
        </div>
      </div>

      {/* Display Name */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Display Name</CardTitle>
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Email Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current email</p>
            <p className="font-medium">{user?.email}</p>
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
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to <strong>{newEmail}</strong>
              </p>
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
      </div>
    </div>
  )
}
