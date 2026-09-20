import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/useAuth'
import { FeedbackBanner, Spinner } from '../components/Feedback'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLoginField(name, value) {
  switch (name) {
    case 'email':
      if (!value.trim()) return 'Email is required.'
      if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.'
      return ''
    case 'password':
      if (!value.trim()) return 'Password is required.'
      return ''
    default:
      return ''
  }
}

function validateLoginForm(formData) {
  const nextErrors = {}

  Object.keys(formData).forEach((fieldName) => {
    const errorMessage = validateLoginField(fieldName, formData[fieldName])
    if (errorMessage) nextErrors[fieldName] = errorMessage
  })

  return nextErrors
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData({ ...formData, [name]: value })

    setFieldErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors }
      const errorMessage = validateLoginField(name, value)

      if (errorMessage) {
        updatedErrors[name] = errorMessage
      } else {
        delete updatedErrors[name]
      }

      return updatedErrors
    })
  }

  function handleBlur(event) {
    const { name, value } = event.target
    const errorMessage = validateLoginField(name, value)

    setFieldErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors }

      if (errorMessage) {
        updatedErrors[name] = errorMessage
      } else {
        delete updatedErrors[name]
      }

      return updatedErrors
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateLoginForm(formData)

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setError('')
    setIsSubmitting(true)

    try {
      const response = await axiosInstance.post('/auth/login', formData)
      const { access_token: token, user } = response.data
      login(user, token)
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-screen min-w-0 flex-col items-center justify-start overflow-hidden px-4 pb-12 pt-16 sm:px-8 sm:pt-20">
      <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=85" alt="Hostel Management System" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/55" />
      <h1 className="relative z-10 max-w-3xl text-center text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Hostel Management System</h1>
      <section className="relative z-10 mt-8 w-full max-w-md rounded-xl border border-white/60 bg-white/95 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-sm sm:mt-10 sm:p-10">
          <div className="mb-9">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Access your hostel dashboard and stay up to date.</p>
          </div>

          {error && <div className="mb-5"><FeedbackBanner>{error}</FeedbackBanner></div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                className={fieldErrors.email ? 'form-input border-red-400' : 'form-input'}
                placeholder="you@example.com"
              />
              {fieldErrors.email && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.email}</span>}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                className={fieldErrors.password ? 'form-input border-red-400' : 'form-input'}
                placeholder="Your password"
              />
              {fieldErrors.password && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.password}</span>}
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <span className="inline-flex items-center justify-center gap-2"><Spinner />Signing in...</span> : 'Sign in'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            New to the system? <Link to="/register" className="font-bold text-amber-700 hover:text-amber-800">Create an account</Link>
          </p>
      </section>
    </main>
  )
}