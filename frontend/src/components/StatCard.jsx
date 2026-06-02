import { cn } from '@/lib/utils'

export function StatCard({ label, value, icon: Icon, className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
        {value ?? '—'}
      </p>
    </div>
  )
}
