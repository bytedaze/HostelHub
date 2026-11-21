import { DoorOpen, MessageSquareWarning, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const summaryCards = [
  { label: 'Room', description: 'View your room allocation', to: '/student-dashboard/room', icon: DoorOpen },
  { label: 'Fees', description: 'Check payments and dues', to: '/student-dashboard/fees', icon: Wallet },
  { label: 'Complaints', description: 'Raise or track an issue', to: '/student-dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Visitors', description: 'Manage your visitor log', to: '/student-dashboard/visitors', icon: Users },
]

export default function StudentDashboard() {
  const { user } = useAuth()

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-amber-600 to-slate-800 p-8 text-white shadow-xl shadow-amber-200/60 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Student portal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome, {user.name}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50">Your hostel information, requests, and updates will appear here.</p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {summaryCards.map(({ label, description, to, icon: Icon }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
              <Icon aria-hidden="true" size={24} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">{label}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </section>
    </>
  )
}
