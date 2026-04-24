import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
      <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.03)] dark:border-[#1E3A5F] dark:bg-[#111827]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] dark:bg-[#1E3A5F]">
              <GraduationCap className="h-6 w-6 text-[#4F46E5]" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Reset Password</h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code from your email'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pb-4">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0] dark:bg-[#1E3A5F]'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#4F46E5]' : 'bg-[#E2E8F0] dark:bg-[#1E3A5F]'}`} />
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Info banner */}
              <div className="rounded-lg border border-[#818CF8]/30 bg-[#EEF2FF] px-3 py-2.5 dark:bg-[#1E3A5F]/40 dark:border-[#818CF8]/20">
                <p className="text-xs text-[#4F46E5] dark:text-[#818CF8]">
                  We'll send a 6-digit code to your email address. The code expires in 10 minutes.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@auca.ac.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:bg-[#0B1120] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">
                  6-Digit Reset Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  className="border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:bg-[#0B1120] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B] font-mono tracking-widest text-center text-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">
                  New Password
                </Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  showStrength
                  className="border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:bg-[#0B1120] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#334155] dark:text-[#F1F5F9]">
                  Confirm Password
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:ring-[#4F46E5] hover:border-[#CBD5E1] dark:border-[#1E3A5F] dark:bg-[#0B1120] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B]"
                />
              </div>

              {/* Password match hint */}
              {confirmPassword.length > 0 && (
                <p className={`text-xs ${newPassword === confirmPassword ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-lg border border-[#E2E8F0] bg-transparent px-4 py-2.5 text-sm font-medium text-[#334155] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC] dark:border-[#1E3A5F] dark:text-[#94A3B8] dark:hover:bg-[#0B1120]"
              >
                Back
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
            <Link to="/login" className="text-[#4F46E5] hover:text-[#4338CA] hover:underline transition-colors">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
