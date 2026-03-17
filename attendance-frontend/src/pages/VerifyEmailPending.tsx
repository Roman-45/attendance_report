import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MailCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import client from '@/api/client'

export default function VerifyEmailPending() {
  const { state } = useLocation()
  const email = (state as { email?: string })?.email ?? ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter the 6-digit code from your email.' })
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/verify-email', { email, otp })
      toast({ title: 'Account Activated!', description: 'Your email has been verified. You can now sign in.' })
      navigate('/login')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Verification failed. Please check the code and try again.'
      toast({ variant: 'destructive', title: 'Error', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MailCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{' '}
            {email ? <span className="font-medium text-foreground">{email}</span> : 'your email address'}.
            {' '}Enter it below to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Didn't receive the code? Check your spam folder.
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Back to Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
