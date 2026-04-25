import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import client from '@/api/client'
import { PasswordInput } from '@/components/ui/password-input'

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await client.post('/auth/forgot-password', { email })
      toast({ title: 'OTP Sent', description: 'Check your email for the 6-digit reset code.' })
      setStep(2)
    } catch {
      // Backend always returns 200 to prevent enumeration — show success anyway
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 8 characters' })
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/reset-password', { email, otp, newPassword })
      toast({ title: 'Password Reset', description: 'Your password has been updated. Please sign in.' })
      navigate('/login')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed'
      toast({ variant: 'destructive', title: 'Error', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="border-border bg-surface shadow-sm">
          {/* Header */}
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-light">
                <GraduationCap className="h-6 w-6 text-brand" />
              </div>
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code from your email'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-brand' : 'bg-border'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-brand' : 'bg-border'}`} />
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="rounded-md border border-border bg-brand-light px-3 py-2.5">
                  <p className="text-xs text-brand">
                    We'll send a 6-digit code to your email address. The code expires in 10 minutes.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@auca.ac.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-Digit Reset Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                    className="font-mono tracking-widest text-center text-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    showStrength
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Password match hint */}
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${newPassword === confirmPassword ? 'text-status-present' : 'text-status-absent'}`}>
                    {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-brand hover:text-brand-hover hover:underline transition-colors">
                Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
