import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { House } from 'lucide-react'
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'
import StudentLayout from './components/StudentLayout'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import AdminDashboard from './pages/AdminDashboard'
import ComplaintManagement from './pages/admin/ComplaintManagement'
import FeeManagement from './pages/admin/FeeManagement'
import RoomManagement from './pages/admin/RoomManagement'
import VisitorManagement from './pages/admin/VisitorManagement'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import MyComplaints from './pages/student/MyComplaints'
import MyFees from './pages/student/MyFees'
import MyRoom from './pages/student/MyRoom'
import MyVisitors from './pages/student/MyVisitors'
import Landing from './pages/Landing'

function NotFound() {
	const { user } = useAuth()
	const destination = user ? (user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard') : '/'

	return (
		<main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16 sm:px-8">
			<section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
					<House aria-hidden="true" size={28} />
				</div>
				<p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">404 error</p>
				<h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Page Not Found</h1>
				<p className="mt-3 text-sm leading-6 text-slate-500">The page you requested does not exist or may have moved.</p>
				<NavigateButton destination={destination} label={user ? 'Back to dashboard' : 'Back to home'} />
			</section>
		</main>
	)
}

function NavigateButton({ destination, label }) {
	return <Link to={destination} className="mt-8 inline-flex rounded-lg bg-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700">{label}</Link>
}


function AppContent() {
	const { pathname } = useLocation()
	const isAuthPage = pathname === '/login' || pathname === '/register'
	const isStudentArea = pathname.startsWith('/student-dashboard')
	const isAdminArea = pathname.startsWith('/admin-dashboard')

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			{!isAuthPage && !isStudentArea && !isAdminArea && <Navbar showLogout={pathname !== '/'} />}
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/student-dashboard" element={<StudentLayout />}>
					<Route index element={<StudentDashboard />} />
					<Route path="room" element={<MyRoom />} />
					<Route path="fees" element={<MyFees />} />
					<Route path="complaints" element={<MyComplaints />} />
					<Route path="visitors" element={<MyVisitors />} />
				</Route>
				<Route path="/admin-dashboard" element={<AdminLayout />}>
					<Route index element={<AdminDashboard />} />
					<Route path="rooms" element={<RoomManagement />} />
					<Route path="fees" element={<FeeManagement />} />
					<Route path="complaints" element={<ComplaintManagement />} />
					<Route path="visitors" element={<VisitorManagement />} />
				</Route>
				<Route path="*" element={<NotFound />} />
			</Routes>
		</div>
	)
}

export default function App() {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	)
}
