import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import client from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Save, Mail, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
            <Avatar className="h-24 w-24">
              <AvatarImage src={getPhotoSrc()} alt={user?.name} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePhotoClick}
              disabled={photoUploading}
            >
              {photoUploading ? 'Uploading…' : 'Change Photo'}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 10 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </CardContent>
      </Card>

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
