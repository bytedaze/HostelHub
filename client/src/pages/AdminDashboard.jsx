import { DoorOpen, MessageSquareWarning, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const summaryCards = [
  { label: 'Rooms', description: 'Manage rooms and allocations', to: '/admin-dashboard/rooms', icon: DoorOpen },
  { label: 'Fees', description: 'Track student payments', to: '/admin-dashboard/fees', icon: Wallet },
  { label: 'Complaints', description: 'Review and update requests', to: '/admin-dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Visitors', description: 'Monitor guest check-ins', to: '/admin-dashboard/visitors', icon: Users },
]

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-8 text-white shadow-xl shadow-slate-300/60 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Admin portal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome, {user.name}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Manage rooms and keep hostel operations moving smoothly.</p>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {summaryCards.map(({ label, description, to, icon: Icon }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:bg-amber-100"><Icon aria-hidden="true" size={24} /></span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">{label}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </section>
    </>
  )
}
