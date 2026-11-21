import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, FeedbackBanner, LoadingSkeleton, Spinner } from '../../components/Feedback'

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [checkingOutId, setCheckingOutId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  async function loadVisitors() {
    try { const response = await axiosInstance.get('/visitors'); setVisitors(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load visitors right now.') } finally { setIsLoading(false) }
  }

  async function checkout(visitor) {
    setCheckingOutId(visitor.id); setMessage({ type: '', text: '' })
    try { await axiosInstance.put(`/visitors/${visitor.id}/checkout`); setMessage({ type: 'success', text: 'Visitor checked out successfully.' }); await loadVisitors() } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to check out visitor.' }) } finally { setCheckingOutId('') }
  }


  useEffect(() => {
    axiosInstance.get('/visitors')
      .then((response) => setVisitors(response.data))
      .catch((requestError) => setError(requestError.response?.data?.detail || 'Unable to load visitors right now.'))
      .finally(() => setIsLoading(false))
  }, [])
  return <><header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Guests and visits</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Visitors</h1></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{visitors.length} entries</span></header>{message.text && <FeedbackBanner type={message.type}>{message.text}</FeedbackBanner>}{error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<section className="mt-8"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{isLoading ? <LoadingSkeleton /> : visitors.length === 0 ? <EmptyState icon={Users} title="No visitor entries yet" message="Visitor check-ins will appear here as students log guests." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Student', 'Email', 'Visitor', 'Phone', 'Purpose', 'Check-in', 'Check-out'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visitors.map((visitor) => <tr key={visitor.id} className="align-top transition hover:bg-amber-50/40"><td className="px-5 py-4 font-bold text-slate-800">{visitor.student_name}</td><td className="px-5 py-4 text-slate-600">{visitor.student_email}</td><td className="px-5 py-4 font-semibold text-slate-700">{visitor.visitor_name}</td><td className="px-5 py-4 text-slate-600">{visitor.visitor_phone}</td><td className="px-5 py-4 text-slate-600">{visitor.purpose}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{new Date(visitor.check_in_time).toLocaleString()}</td><td className="whitespace-nowrap px-5 py-4">{visitor.check_out_time ? <span className="text-slate-600">{new Date(visitor.check_out_time).toLocaleString()}</span> : <button type="button" onClick={() => checkout(visitor)} disabled={checkingOutId === visitor.id} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">{checkingOutId === visitor.id ? <span className="inline-flex items-center gap-2"><Spinner />Checking out...</span> : 'Checkout'}</button>}</td></tr>)}</tbody></table></div>}</div></section></>
}
