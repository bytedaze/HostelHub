import { useEffect, useState } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, FeedbackBanner, LoadingSkeleton } from '../../components/Feedback'

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  async function loadComplaints() {
    try { const response = await axiosInstance.get('/complaints'); setComplaints(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load complaints right now.') } finally { setIsLoading(false) }
  }

  async function updateStatus(complaint, status) {
    if (complaint.status === status) return
    setUpdatingId(complaint.id); setMessage({ type: '', text: '' })
    try { await axiosInstance.put(`/complaints/${complaint.id}/status`, { status }); setMessage({ type: 'success', text: 'Complaint status updated successfully.' }); await loadComplaints() } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to update complaint status.' }) } finally { setUpdatingId('') }
  }

  useEffect(() => {
    axiosInstance.get('/complaints')
      .then((response) => setComplaints(response.data))
      .catch((requestError) => setError(requestError.response?.data?.detail || 'Unable to load complaints right now.'))
      .finally(() => setIsLoading(false))
  }, [])

  return <><header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Resident support</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Complaints</h1></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{complaints.length} records</span></header>{message.text && <FeedbackBanner type={message.type}>{message.text}</FeedbackBanner>}{error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<section className="mt-8"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{isLoading ? <LoadingSkeleton /> : complaints.length === 0 ? <EmptyState icon={MessageSquareWarning} title="No complaints submitted" message="Student support requests will appear here when they are raised." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Student', 'Email', 'Phone', 'Category', 'Description', 'Status', 'Created date', 'Update'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{complaints.map((complaint) => <tr key={complaint.id} className="align-top transition hover:bg-amber-50/40"><td className="px-5 py-4 font-bold text-slate-800">{complaint.student_name}</td><td className="px-5 py-4 text-slate-600">{complaint.student_email}</td><td className="px-5 py-4 text-slate-600">{complaint.student_phone || '-'}</td><td className="px-5 py-4 font-semibold text-slate-700">{complaint.category}</td><td className="max-w-xs px-5 py-4 leading-6 text-slate-600">{complaint.description}</td><td className="px-5 py-4"><StatusBadge status={complaint.status} /></td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{new Date(complaint.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><select value={complaint.status} onChange={(event) => updateStatus(complaint, event.target.value)} disabled={updatingId === complaint.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60"><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option></select></td></tr>)}</tbody></table></div>}</div></section></>
}

function StatusBadge({ status }) { const classes = status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : status === 'in-progress' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}>{status}</span> }
