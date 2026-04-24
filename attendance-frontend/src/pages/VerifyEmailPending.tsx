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
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-10 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#4F46E5]/50 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#4F46E5]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#0284C7]/15 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <GraduationCap className="h-5 w-5 text-[#F1F5F9]" />
          </div>
          <span className="text-[#F1F5F9] font-semibold text-lg tracking-tight">AUCA Attendance</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-[#F1F5F9] leading-tight mb-4">
            Almost there!<br />
            <span className="text-[#BAE6FD]">Verify your email.</span>
          </h2>
          <p className="text-[#94A3B8] text-sm leading-relaxed mb-8 max-w-xs">
            Enter the 6-digit code we sent to your email to activate your account and start using the system.
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#059669]/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
              </div>
              <span className="text-xs text-[#94A3B8]">Register</span>
            </div>
            <div className="h-px w-6 bg-[#475569]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0284C7]/40 flex items-center justify-center ring-2 ring-[#0284C7]/50">
                <MailCheck className="h-4 w-4 text-[#BAE6FD]" />
              </div>
              <span className="text-xs text-[#F1F5F9] font-medium">Verify</span>
            </div>
            <div className="h-px w-6 bg-[#475569]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#334155] flex items-center justify-center">
                <span className="text-xs text-[#64748B]">3</span>
              </div>
              <span className="text-xs text-[#64748B]">Done</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {([
              { icon: ClipboardList, label: 'Live attendance tracking' },
              { icon: TrendingUp, label: 'Grade & mark management' },
              { icon: Bell, label: 'Absence alerts & notifications' },
            ] as const).map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-full bg-white/[0.08] backdrop-blur px-4 py-2.5 w-fit">
                <div className="h-7 w-7 rounded-full bg-[#4F46E5]/30 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#BAE6FD]" />
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
            <GraduationCap className="h-4 w-4 text-[#F1F5F9]" />
          </div>
          <span className="font-bold text-lg">AUCA Attendance</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          {!verified ? (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] shadow-xl shadow-black/5">
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                    <MailCheck className="h-7 w-7 text-[#4F46E5]" />
                  </div>
                </div>
                <CardTitle className="text-lg text-center">Verify Your Email</CardTitle>
                <CardDescription className="text-center">
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
                    <div className="flex items-center gap-2 rounded-lg bg-[#EEF2FF] border border-[#818CF8]/30 px-3 py-2 text-sm text-[#4F46E5]">
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

                <p className="mt-5 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Didn't receive the code? Check your spam folder.
                </p>
                <p className="mt-2 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <Link to="/login" className="text-[#4F46E5] hover:text-[#4338CA] underline-offset-4 transition-colors">
                    ← Back to Sign In
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:border-[#1E3A5F] dark:bg-[#111827] shadow-xl shadow-black/5">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[#ECFDF5] dark:bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7 text-[#059669]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Verified!</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Your account is now active. Redirecting to sign in...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5] mx-auto" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
