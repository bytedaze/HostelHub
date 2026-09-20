import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white shadow-sm shadow-amber-200">
            HM
          </span>
          <span className="truncate text-sm font-bold tracking-tight sm:text-base">
            Hostel Management System
          </span>
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}