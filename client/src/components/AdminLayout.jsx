import { Navigate, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '../context/useAuth'

export default function AdminLayout() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  return (
    <>
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10 lg:flex-row lg:items-start">
        <AdminSidebar />
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </>
  )
}
