import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  GraduationCap, MailCheck, ShieldCheck, ArrowRight,
  ClipboardList, TrendingUp, Bell, CheckCircle2, Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import client from '@/api/client'

export default function VerifyEmailPending() {
  const { state } = useLocation()
  const emailFromState = (state as { email?: string })?.email ?? ''
  const [email, setEmail] = useState(emailFromState)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter the 6-digit code from your email.' })
      return
    }
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter your email address.' })
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/verify-email', { email: email.trim(), otp })
      setVerified(true)
      toast({ title: 'Account Activated!', description: 'Redirecting to sign in...' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Verification failed. Please check the code and try again.'
      toast({ variant: 'destructive', title: 'Error', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-10 bg-brand relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 backdrop-blur">
            <GraduationCap className="h-5 w-5 text-brand-foreground" />
          </div>
          <span className="text-brand-foreground font-semibold text-lg tracking-tight">AUCA Attendance</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-semibold text-brand-foreground leading-tight mb-4">
            Almost there!<br />
            <span className="text-white/70">Verify your email.</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-xs">
            Enter the 6-digit code we sent to your email to activate your account and start using the system.
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-brand-foreground" />
              </div>
              <span className="text-xs text-white/70">Register</span>
            </div>
            <div className="h-px w-6 bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center ring-2 ring-white/30">
                <MailCheck className="h-4 w-4 text-brand-foreground" />
              </div>
              <span className="text-xs text-brand-foreground font-medium">Verify</span>
            </div>
            <div className="h-px w-6 bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xs text-white/60">3</span>
              </div>
              <span className="text-xs text-white/60">Done</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {([
              { icon: ClipboardList, label: 'Live attendance tracking' },
              { icon: TrendingUp, label: 'Grade & mark management' },
              { icon: Bell, label: 'Absence alerts & notifications' },
            ] as const).map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-md bg-white/10 backdrop-blur px-4 py-2.5 w-fit">
                <div className="h-7 w-7 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-brand-foreground" />
                </div>
                <span className="text-sm text-brand-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60 relative z-10">
          © {new Date().getFullYear()} Adventist University of Central Africa
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
            <GraduationCap className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">AUCA Attendance</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          {!verified ? (
            <Card className="border-border bg-surface shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-md bg-brand-light flex items-center justify-center">
                    <MailCheck className="h-7 w-7 text-brand" />
                  </div>
                </div>
                <CardTitle className="text-center">Verify Your Email</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  We sent a 6-digit code to{' '}
                  {email ? <span className="font-medium text-foreground">{email}</span> : 'your email address'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  {/* Show email input if not provided via state */}
                  {!emailFromState && (
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@auca.ac.rw"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {email && (
                    <div className="flex items-center gap-2 rounded-md bg-brand-light border border-border px-3 py-2 text-sm text-brand">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Code sent to <strong>{email}</strong></span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      autoFocus
                      className="text-center text-xl tracking-[0.5em] font-mono"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Verify Email <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Didn't receive the code? Check your spam folder.
                </p>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-brand hover:text-brand-hover underline-offset-4 transition-colors">
                    ← Back to Sign In
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-surface shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-md bg-status-present-bg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7 text-status-present" />
                </div>
                <h3 className="mb-2">Email Verified!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your account is now active. Redirecting to sign in...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-brand mx-auto" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
