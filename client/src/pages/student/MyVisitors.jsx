import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, LoadingSkeleton, Spinner } from '../../components/Feedback'

const initialForm = { visitor_name: '', visitor_phone: '', purpose: '' }

export default function MyVisitors() {
  const [visitors, setVisitors] = useState([])
  const [visitorForm, setVisitorForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadVisitors()
  }, [])

  async function loadVisitors() {
    try {
      const response = await axiosInstance.get('/visitors/my-visitors')
      setVisitors(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load your visitors.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(event) {
    setVisitorForm({ ...visitorForm, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!visitorForm.visitor_name.trim()) nextErrors.visitor_name = 'Name is required.'
    if (!visitorForm.visitor_phone.trim()) nextErrors.visitor_phone = 'Phone is required.'
    if (!visitorForm.purpose.trim()) nextErrors.purpose = 'Purpose is required.'
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }
    setFieldErrors({})
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      await axiosInstance.post('/visitors', visitorForm)
      await loadVisitors()
      setVisitorForm(initialForm)
      setMessage('Visitor logged successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to log visitor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Guests and visits</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My Visitors</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
        <VisitorField label="Visitor name" name="visitor_name" value={visitorForm.visitor_name} onChange={handleChange} placeholder="Full name" error={fieldErrors.visitor_name} />
        <VisitorField label="Phone" name="visitor_phone" value={visitorForm.visitor_phone} onChange={handleChange} placeholder="Phone number" error={fieldErrors.visitor_phone} />
        <VisitorField label="Purpose" name="purpose" value={visitorForm.purpose} onChange={handleChange} placeholder="Reason for visit" error={fieldErrors.purpose} />
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <span className="inline-flex items-center gap-2"><Spinner />Logging...</span> : 'Log visitor'}</button>
      </form>
      {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {isLoading && <LoadingSkeleton rows={2} />}
      {!isLoading && !error && visitors.length === 0 && <EmptyState icon={Users} title="No visitor entries yet" message="Log a visitor above to keep your guest records up to date." />}
      {!isLoading && !error && visitors.length > 0 && <div className="mt-7 grid gap-4 md:grid-cols-2">{visitors.map((visitor) => <VisitorCard key={visitor.id} visitor={visitor} />)}</div>}
    </section>
  )
}

function VisitorField({ label, name, value, onChange, placeholder, error }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} value={value} onChange={onChange} required className="form-input" placeholder={placeholder} />{error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}</label>
}

function VisitorCard({ visitor }) {
  return <article className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:border-amber-100 hover:shadow-md"><div className="flex items-start justify-between gap-4"><h2 className="font-bold text-slate-900">{visitor.visitor_name}</h2>{visitor.check_out_time ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Checked out</span> : <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Still checked in</span>}</div><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><VisitorDetail label="Phone" value={visitor.visitor_phone} /><VisitorDetail label="Purpose" value={visitor.purpose} /></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400"><span>In: {new Date(visitor.check_in_time).toLocaleString()}</span>{visitor.check_out_time && <span>Out: {new Date(visitor.check_out_time).toLocaleString()}</span>}</div></article>
}

function VisitorDetail({ label, value }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>
}
