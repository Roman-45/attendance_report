import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, ShieldCheck, ClipboardList, TrendingUp, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PasswordInput } from '@/components/ui/password-input'
import { GoogleLogin } from '@react-oauth/google'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, verifyMfa, googleLogin } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.mfaRequired) {
        setMfaRequired(true)
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
      toast({ variant: 'destructive', title: 'Sign in failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyMfa(email, otp)
      navigate('/')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid OTP'
      toast({ variant: 'destructive', title: 'Verification failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return
    setLoading(true)
    try {
      const { profileIncomplete } = await googleLogin(credentialResponse.credential)
      navigate(profileIncomplete ? '/profile?complete=true' : '/')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Google sign-in failed'
      toast({ variant: 'destructive', title: 'Google sign-in failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-10 bg-brand relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/auca-logo.jpg"
            alt="AUCA Innovation Center"
            className="h-12 w-12 rounded-md object-cover ring-1 ring-white/30 shadow-sm"
          />
          <span className="text-brand-foreground font-semibold text-lg tracking-tight">
            AUCA Attendance
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="font-display text-5xl font-medium text-brand-foreground leading-[1.1] tracking-tight mb-4">
            Attendance &amp; Marks<br />
            <span className="text-white/75">Managed in one place.</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-xs">
            Track attendance, record grades, and generate reports — all from a single dashboard built for AUCA.
          </p>
          <div className="flex flex-col gap-3">
            {([
              { icon: ClipboardList, label: 'Live attendance tracking' },
              { icon: TrendingUp,    label: 'Grade & mark management' },
              { icon: Bell,          label: 'Absence alerts & notifications' },
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

        <div className="text-xs text-white/65 relative z-10 flex items-center gap-2">
          <span>© {new Date().getFullYear()} Adventist University of Central Africa</span>
          <span className="text-white/40">·</span>
          <span>Supported by Mastercard Foundation</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <img
            src="/auca-logo.jpg"
            alt="AUCA"
            className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
          />
          <span className="font-semibold text-lg text-foreground">AUCA Attendance</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          <Card className="border-border bg-surface shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>
                {mfaRequired ? 'Two-factor verification' : 'Welcome back'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {mfaRequired
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Sign in to your account to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!mfaRequired ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@auca.ac.rw"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-brand hover:text-brand-hover hover:underline underline-offset-4 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Signing in…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Sign In <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="relative flex items-center gap-3 my-5">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-subtle-foreground">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast({ variant: 'destructive', title: 'Google sign-in failed' })}
                      width="100%"
                      text="signin_with"
                      shape="rectangular"
                    />
                  </div>

                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-brand hover:text-brand-hover hover:underline underline-offset-4 transition-colors">
                      Create account
                    </Link>
                  </p>
                </>
              ) : (
                <form onSubmit={handleMfa} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md bg-brand-light border border-border px-3 py-2 text-sm text-brand">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Code sent to <strong>{email}</strong></span>
                  </div>
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
                      className="text-center text-xl tracking-[0.5em] font-mono"
                      required
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Verifying…
                      </span>
                    ) : 'Verify & Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setMfaRequired(false); setOtp('') }}
                  >
                    ← Back to sign in
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
