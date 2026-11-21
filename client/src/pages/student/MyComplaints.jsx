import { useEffect, useState } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, LoadingSkeleton, Spinner } from '../../components/Feedback'

const initialForm = { category: 'Electrical', description: '' }

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [complaintForm, setComplaintForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadComplaints()
  }, [])

  async function loadComplaints() {
    try {
      const response = await axiosInstance.get('/complaints/my-complaints')
      setComplaints(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load your complaints.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(event) {
    setComplaintForm({ ...complaintForm, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!complaintForm.description.trim()) {
      setFieldError('Please describe the issue before submitting.')
      return
    }
    setFieldError('')
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      await axiosInstance.post('/complaints', complaintForm)
      await loadComplaints()
      setComplaintForm(initialForm)
      setMessage('Complaint submitted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to submit your complaint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Help and support</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My Complaints</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <label className="block text-sm font-semibold text-slate-700">Category<select name="category" value={complaintForm.category} onChange={handleChange} className="form-input"><option>Electrical</option><option>Plumbing</option><option>Wi-Fi</option><option>Cleanliness</option><option>Other</option></select></label>
        <label className="block text-sm font-semibold text-slate-700">Description<textarea name="description" value={complaintForm.description} onChange={handleChange} required rows="3" className="form-input resize-none" placeholder="Describe the issue..." />{fieldError && <span className="mt-1 block text-xs font-medium text-rose-600">{fieldError}</span>}</label>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <span className="inline-flex items-center gap-2"><Spinner />Submitting...</span> : 'Raise complaint'}</button>
      </form>
      {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {isLoading && <LoadingSkeleton rows={2} />}
      {!isLoading && !error && complaints.length === 0 && <EmptyState icon={MessageSquareWarning} title="No complaints raised yet" message="Use the form above when you need help from the hostel team." />}
      {!isLoading && !error && complaints.length > 0 && <div className="mt-7 grid gap-4 md:grid-cols-2">{complaints.map((complaint) => <ComplaintCard key={complaint.id} complaint={complaint} />)}</div>}
    </section>
  )
}

function ComplaintCard({ complaint }) {
  const statusClass = complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : complaint.status === 'in-progress' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'
  return <article className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:border-amber-100 hover:shadow-md"><div className="flex items-start justify-between gap-4"><h2 className="font-bold text-slate-900">{complaint.category}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{complaint.status}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{complaint.description}</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400"><span>Created {new Date(complaint.created_at).toLocaleDateString()}</span>{complaint.resolved_at && <span>Resolved {new Date(complaint.resolved_at).toLocaleDateString()}</span>}</div></article>
}
