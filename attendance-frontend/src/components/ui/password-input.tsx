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

  if (score <= 1) return { score, label: 'Weak', color: 'bg-[#DC2626]' }
  if (score === 2) return { score, label: 'Fair', color: 'bg-[#EA580C]' }
  if (score === 3) return { score, label: 'Good', color: 'bg-[#D97706]' }
  return { score, label: 'Strong', color: 'bg-[#059669]' }
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors"
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
                  seg <= strength.score ? strength.color : 'bg-[#F1F5F9] dark:bg-[#1E293B]'
                )}
              />
            ))}
          </div>
          <p className={cn(
            'text-xs font-medium',
            strength.score <= 1 && 'text-[#DC2626]',
            strength.score === 2 && 'text-[#EA580C]',
            strength.score === 3 && 'text-[#D97706]',
            strength.score >= 4 && 'text-[#059669]',
          )}>
            {strength.label}
          </p>
        </div>
      )}
    </div>
  )
}
