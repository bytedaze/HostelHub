import { DoorOpen, LayoutDashboard, MessageSquareWarning, Users, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Overview', to: '/admin-dashboard', icon: LayoutDashboard, end: true },
  { label: 'Rooms', to: '/admin-dashboard/rooms', icon: DoorOpen },
  { label: 'Fees', to: '/admin-dashboard/fees', icon: Wallet },
  { label: 'Complaints', to: '/admin-dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Visitors', to: '/admin-dashboard/visitors', icon: Users },
]

export default function AdminSidebar() {
  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/40 lg:block lg:space-y-1 lg:overflow-visible lg:p-3">
        {links.map(({ label, to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition lg:w-full ${isActive ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon aria-hidden="true" size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
