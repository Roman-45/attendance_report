import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, ArrowRight, Crown, Upload, LayoutGrid,
  CheckCircle2, AlertCircle, Loader2, Lock
} from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'
import { useToast } from '@/hooks/use-toast'
import client from '@/api/client'

interface InvitationInfo {
  name: string
  email: string
  role: string
}

type PageState = 'loading' | 'valid' | 'invalid' | 'success'

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState<PageState>('loading')
  const [info, setInfo] = useState<InvitationInfo | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Validate the invitation token on mount
  useEffect(() => {
    if (!token) {
      setState('invalid')
      return
    }
    client.get(`/auth/invitation?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setInfo(res.data.data)
        setState('valid')
      })
      .catch(() => {
        setState('invalid')
      })
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' })
      return
    }
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Password must be at least 8 characters' })
      return
    }
    setSubmitting(true)
    try {
      const { data } = await client.post('/auth/accept-invitation', { token, password })
      const authData = data.data
      // Store tokens and redirect
      localStorage.setItem('accessToken', authData.token)
      if (authData.refreshToken) {
        localStorage.setItem('refreshToken', authData.refreshToken)
      }
      setState('success')
      toast({ title: 'Account activated!', description: 'Redirecting to your dashboard...' })
      setTimeout(() => navigate('/'), 1500)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to activate account'
      toast({ variant: 'destructive', title: 'Activation failed', description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-10 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#4F46E5]/50 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#D97706]/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <GraduationCap className="h-5 w-5 text-[#F1F5F9]" />
          </div>
          <span className="text-[#F1F5F9] font-semibold text-lg tracking-tight">AUCA Attendance</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-[#F1F5F9] leading-tight mb-4">
            You've been invited<br />
            <span className="text-[#FCD34D]">as a Team Leader.</span>
          </h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed mb-8 max-w-xs">
            Set your password to activate your account and start managing your team.
          </p>
          <div className="flex flex-col gap-3">
            {([
              { icon: Crown, label: 'Lead and manage your team' },
              { icon: Upload, label: 'Import members via Excel' },
              { icon: LayoutGrid, label: 'Assign classroom seats' },
            ] as const).map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-full bg-white/[0.08] backdrop-blur px-4 py-2.5 w-fit">
                <div className="h-7 w-7 rounded-full bg-[#D97706]/30 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#FCD34D]" />
                </div>
                <span className="text-sm text-[#94A3B8]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#64748B] relative z-10">
          © {new Date().getFullYear()} Adventist University of Central Africa
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-[#F8FAFC]">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] shadow-lg shadow-[#4F46E5]/30">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">AUCA Attendance</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          {/* Loading state */}
          {state === 'loading' && (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] border-border/50 shadow-xl shadow-black/5">
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5] mx-auto mb-4" />
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Validating your invitation...</p>
              </CardContent>
            </Card>
          )}

          {/* Invalid token state */}
          {state === 'invalid' && (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] border-border/50 shadow-xl shadow-black/5">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-7 w-7 text-[#DC2626]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Invalid Invitation</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">
                  This invitation link is invalid or has already been used.
                  Please contact your administrator for a new invitation.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Valid — set password form */}
          {state === 'valid' && info && (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] border-border/50 shadow-xl shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Set Your Password</CardTitle>
                <CardDescription>Complete your account setup to get started</CardDescription>
              </CardHeader>
              <CardContent>
                {/* User info (read-only) */}
                <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 mb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Name</span>
                    <span className="text-sm font-medium">{info.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Email</span>
                    <span className="text-sm font-medium">{info.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Role</span>
                    <Badge className="bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Team Leader
                    </Badge>
                  </div>
                </div>

                <form onSubmit={handleAccept} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      <Lock className="h-3 w-3 inline mr-1" />
                      New Password
                    </Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      showStrength
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-[#DC2626]">Passwords do not match</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={submitting || password.length < 8 || password !== confirmPassword}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Activating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Activate Account <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Success state */}
          {state === 'success' && (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] border-border/50 shadow-xl shadow-black/5">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[#ECFDF5] dark:bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7 text-[#059669]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Account Activated!</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Redirecting to your dashboard...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5] mx-auto mt-4" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
