import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { FeedbackBanner, Spinner } from '../components/Feedback'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegisterField(name, value) {
  switch (name) {
    case 'name': {
      const trimmedValue = value.trim()
      if (!trimmedValue) return 'Name is required.'
      if (trimmedValue.length < 2) return 'Name must be at least 2 characters.'
      if (!/^[A-Za-z\s]+$/.test(trimmedValue)) return 'Name should only contain letters.'
      return ''
    }
    case 'email':
      if (!value.trim()) return 'Email is required.'
      if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.'
      return ''
    case 'password':
      if (!value) return 'Password is required.'
      if (value.length < 6) return 'Password must be at least 6 characters.'
      return ''
    case 'phone': {
      const trimmedValue = value.trim()
      if (!trimmedValue) return 'Phone is required.'
      if (!/^\d{10}$/.test(trimmedValue)) return 'Phone number must be 10 digits.'
      return ''
    }
    case 'role':
      if (!value || !['student', 'admin'].includes(value)) return 'Please select a role.'
      return ''
    default:
      return ''
  }
}

function validateRegisterForm(formData) {
  const nextErrors = {}

  Object.keys(formData).forEach((fieldName) => {
    const errorMessage = validateRegisterField(fieldName, formData[fieldName])
    if (errorMessage) nextErrors[fieldName] = errorMessage
  })

  return nextErrors
}

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData({ ...formData, [name]: value })

    setFieldErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors }
      const errorMessage = validateRegisterField(name, value)

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
    const errorMessage = validateRegisterField(name, value)

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

    const nextErrors = validateRegisterForm(formData)

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setMessage({ type: '', text: '' })
    setIsSubmitting(true)

    try {
      await axiosInstance.post('/auth/register', formData)
      setMessage({ type: 'success', text: 'Account created successfully. Redirecting...' })
      setTimeout(() => navigate('/login'), 900)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Registration failed. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-screen min-w-0 flex-col items-center justify-start overflow-hidden px-4 pb-12 pt-16 sm:px-8 sm:pt-20">
      <img src="https://images.unsplash.com/photo-1560185127-6a8c0f2f8c3d?auto=format&fit=crop&w=1600&q=85" alt="Hostel Management System" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/55" />
      <h1 className="relative z-10 max-w-3xl text-center text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Hostel Management System</h1>
      <section className="relative z-10 mt-8 w-full max-w-md rounded-xl border border-white/60 bg-white/95 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-sm sm:mt-10 sm:p-10">
          <div className="mb-9">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">Get started</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Join your hostel community in a few quick steps.</p>
          </div>

          {message.text && (
            <div className="mb-5"><FeedbackBanner type={message.type}>{message.text}</FeedbackBanner></div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(fieldErrors.name)}
                className={fieldErrors.name ? 'form-input border-red-400' : 'form-input'}
                placeholder="Your full name"
              />
              {fieldErrors.name && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.name}</span>}
            </label>
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
                minLength={6}
                aria-invalid={Boolean(fieldErrors.password)}
                className={fieldErrors.password ? 'form-input border-red-400' : 'form-input'}
                placeholder="At least 6 characters"
              />
              {fieldErrors.password && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.password}</span>}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Phone
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className={fieldErrors.phone ? 'form-input border-red-400' : 'form-input'}
                  placeholder="Phone number"
                />
                {fieldErrors.phone && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.phone}</span>}
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Role
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldErrors.role)}
                  className={fieldErrors.role ? 'form-input border-red-400' : 'form-input'}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                {fieldErrors.role && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldErrors.role}</span>}
              </label>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <span className="inline-flex items-center justify-center gap-2"><Spinner />Creating account...</span> : 'Create account'}</button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-amber-700 hover:text-amber-800">Sign in</Link></p>
      </section>
    </main>
  )
}