import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, LoadingSkeleton } from '../../components/Feedback'

export default function MyFees() {
  const [fees, setFees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFees() {
      try {
        const response = await axiosInstance.get('/fees/my-fees')
        setFees(response.data)
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Unable to load your fee details.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFees()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Payments and dues</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My Fees</h1>
      {isLoading && <LoadingSkeleton rows={2} />}
      {error && <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!isLoading && !error && fees.length === 0 && <EmptyState icon={Receipt} title="No fee records yet" message="Your hostel charges will appear here when they are created." />}
      {!isLoading && !error && fees.length > 0 && (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {fees.map((fee) => (
            <article key={fee.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:border-amber-100 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">₹{Number(fee.amount).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${fee.paid_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{fee.paid_status}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <FeeDetail label="Due date" value={new Date(fee.due_date).toLocaleDateString()} />
                <FeeDetail label="Receipt no." value={fee.receipt_no || 'Not paid yet'} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function FeeDetail({ label, value }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>
}
