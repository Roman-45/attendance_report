import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ─── Strength calculation ───────────────────────────────────────────────────

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' }
  if (score === 2) return { score, label: 'Fair', color: 'bg-orange-400' }
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

// ─── PasswordInput ──────────────────────────────────────────────────────────

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show the strength meter bar below the input (use on Signup / Reset) */
  showStrength?: boolean
}

export function PasswordInput({ showStrength = false, className, value, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const strength = showStrength ? getStrength(String(value ?? '')) : null

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          {...props}
          type={visible ? 'text' : 'password'}
          value={value}
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && strength && strength.label && (
        <div className="space-y-1">
          {/* 5-segment bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((seg) => (
              <div
                key={seg}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  seg <= strength.score ? strength.color : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className={cn(
            'text-xs font-medium',
            strength.score <= 1 && 'text-destructive',
            strength.score === 2 && 'text-orange-500',
            strength.score === 3 && 'text-yellow-500',
            strength.score >= 4 && 'text-green-600',
          )}>
            {strength.label}
          </p>
        </div>
      )}
    </div>
  )
}
