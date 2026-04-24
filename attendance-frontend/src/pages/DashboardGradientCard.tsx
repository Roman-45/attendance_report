import type { LucideIcon } from 'lucide-react'

interface GradientStatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  gradient: string
  shadow: string
}

export function GradientStatCard({ label, value, icon: Icon, gradient, shadow }: GradientStatCardProps) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-white/75 text-sm font-medium truncate">{label}</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
        </div>
        <div className="rounded-full bg-white/20 p-2.5 shrink-0 ml-3">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}
