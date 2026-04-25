import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, ArrowRight, ClipboardList, TrendingUp, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import client from '@/api/client'
import { PasswordInput } from '@/components/ui/password-input'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/context/AuthContext'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { googleLogin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Passwords do not match' })
      return
    }
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Must be at least 8 characters' })
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/register', { name, email, password, role })
      navigate('/verify-email-pending', { state: { email } })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'
      toast({ variant: 'destructive', title: 'Registration failed', description: message })
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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Google sign-up failed'
      toast({ variant: 'destructive', title: 'Google sign-up failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
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
            Join AUCA<br />
            <span className="text-white/70">Start tracking today.</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-xs">
            Create your account to access attendance records, marks, and reports all in one place.
          </p>
          <div className="flex flex-col gap-3">
            {([
              { icon: ClipboardList, label: 'Real-time attendance records' },
              { icon: TrendingUp,    label: 'Track your academic progress' },
              { icon: Bell,          label: 'Get notified about absences' },
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

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
            <GraduationCap className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">AUCA Attendance</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          <Card className="border-border bg-surface shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Create your account</CardTitle>
              <CardDescription className="text-muted-foreground">Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Sign-Up — shown first as the quick option */}
              <div className="flex justify-center mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast({ variant: 'destructive', title: 'Google sign-up failed' })}
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>

              <div className="relative flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-subtle-foreground">or sign up with email</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
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
                  <Label htmlFor="role">I am a…</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as 'STUDENT' | 'INSTRUCTOR')}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    showStrength
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <PasswordInput
                    id="confirm"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
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
                      Creating account…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand hover:text-brand-hover hover:underline underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
