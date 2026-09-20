import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from 'lucide-react'

export function Spinner({ className = 'h-4 w-4' }) {
  return <LoaderCircle aria-hidden="true" className={`animate-spin ${className}`} />
}

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 p-6" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-200" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {action}
    </div>
  )
}

export function FeedbackBanner({ type = 'error', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  const classes = type === 'success'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-rose-50 text-rose-700'

  return (
    <p role="status" className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${classes}`}>
      <Icon aria-hidden="true" size={17} />
      <span>{children}</span>
    </p>
  )
}
