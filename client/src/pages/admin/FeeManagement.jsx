import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, FeedbackBanner, LoadingSkeleton, Spinner } from '../../components/Feedback'

const initialForm = { student_id: '', amount: '', due_date: '' }

export default function FeeManagement() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [payingId, setPayingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => { loadFees(); loadStudents() }, [])

  async function loadFees() {
    setIsLoading(true)
    try { const response = await axiosInstance.get('/fees'); setFees(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load fees right now.') } finally { setIsLoading(false) }
  }

  async function loadStudents() {
    setIsLoadingStudents(true)
    try { const response = await axiosInstance.get('/users/students'); setStudents(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load students right now.') } finally { setIsLoadingStudents(false) }
  }

  async function handleCreate(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.student_id) nextErrors.student_id = 'Select a student.'
    if (!form.amount || Number(form.amount) <= 0) nextErrors.amount = 'Enter an amount greater than 0.'
    if (!form.due_date) nextErrors.due_date = 'Choose a due date.'
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return }
    setFormErrors({}); setMessage({ type: '', text: '' }); setIsCreating(true)
    try { await axiosInstance.post('/fees', { ...form, amount: Number(form.amount), due_date: `${form.due_date}T00:00:00` }); setForm(initialForm); setMessage({ type: 'success', text: 'Fee created successfully.' }); await loadFees() } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to create fee.' }) } finally { setIsCreating(false) }
  }

  async function handlePay(fee) {
    setPayingId(fee.id); setMessage({ type: '', text: '' })
    try { await axiosInstance.put(`/fees/${fee.id}/pay`); setMessage({ type: 'success', text: 'Fee marked as paid successfully.' }); await loadFees() } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to mark fee as paid.' }) } finally { setPayingId('') }
  }

  function handleChange(event) { setForm({ ...form, [event.target.name]: event.target.value }) }
  return <><header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Payments and dues</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Fee Management</h1></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{fees.length} records</span></header>{message.text && <FeedbackBanner type={message.type}>{message.text}</FeedbackBanner>}{error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<FeeTable fees={fees} isLoading={isLoading} onPay={handlePay} payingId={payingId} /><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"><h2 className="text-xl font-bold text-slate-900">Create a fee</h2><p className="mt-1 text-sm text-slate-500">Add a fee record for a registered student.</p><form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end"><label className="block text-sm font-semibold text-slate-700">Student<select name="student_id" value={form.student_id} onChange={handleChange} className="form-input"><option value="">{isLoadingStudents ? 'Loading students...' : 'Select a student'}</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.email})</option>)}</select>{formErrors.student_id && <ErrorText>{formErrors.student_id}</ErrorText>}</label><Field label="Amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="Amount" error={formErrors.amount} /><Field label="Due date" name="due_date" type="date" value={form.due_date} onChange={handleChange} error={formErrors.due_date} /><button type="submit" disabled={isCreating || students.length === 0} className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">{isCreating ? <span className="inline-flex items-center gap-2"><Spinner />Creating...</span> : 'Create Fee'}</button></form></section></>
}

function FeeTable({ fees, isLoading, onPay, payingId }) {
  return <section className="mt-8"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{isLoading ? <LoadingSkeleton /> : fees.length === 0 ? <EmptyState icon={Receipt} title="No fee records yet" message="Create a fee below to begin tracking student payments." /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Student', 'Email', 'Phone', 'Amount', 'Due date', 'Status', 'Receipt', 'Action'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{fees.map((fee) => <tr key={fee.id} className="transition hover:bg-amber-50/40"><td className="px-5 py-4 font-bold text-slate-800">{fee.student_name}</td><td className="px-5 py-4 text-slate-600">{fee.student_email}</td><td className="px-5 py-4 text-slate-600">{fee.student_phone || '-'}</td><td className="px-5 py-4 font-semibold text-slate-700">₹{Number(fee.amount).toLocaleString()}</td><td className="px-5 py-4 text-slate-600">{new Date(fee.due_date).toLocaleDateString()}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${fee.paid_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{fee.paid_status}</span></td><td className="px-5 py-4 text-slate-600">{fee.receipt_no || '—'}</td><td className="px-5 py-4">{fee.paid_status === 'pending' && <button type="button" onClick={() => onPay(fee)} disabled={payingId === fee.id} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">{payingId === fee.id ? <span className="inline-flex items-center gap-2"><Spinner />Updating...</span> : 'Mark as Paid'}</button>}</td></tr>)}</tbody></table></div>}</div></section>
}

function Field({ label, name, type, min, step, value, onChange, placeholder, error }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input type={type} min={min} step={step} name={name} value={value} onChange={onChange} required className="form-input" placeholder={placeholder} />{error && <ErrorText>{error}</ErrorText>}</label> }
function ErrorText({ children }) { return <span className="mt-1 block text-xs font-medium text-rose-600">{children}</span> }
