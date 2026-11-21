import { useEffect, useState } from 'react'
import { BedDouble } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, FeedbackBanner, LoadingSkeleton, Spinner } from '../../components/Feedback'

const initialRoomForm = { room_number: '', room_type: 'single', capacity: 1, fee_per_month: '' }
const initialAllocationForm = { student_id: '', room_id: '' }

export default function RoomManagement() {
  const [rooms, setRooms] = useState([])
  const [students, setStudents] = useState([])
  const [allocations, setAllocations] = useState([])
  const [roomForm, setRoomForm] = useState(initialRoomForm)
  const [allocationForm, setAllocationForm] = useState(initialAllocationForm)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)
  const [vacatingId, setVacatingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadRooms()
    loadStudents()
    loadAllocations()
  }, [])

  async function loadRooms() {
    setIsLoadingRooms(true)
    try {
      const response = await axiosInstance.get('/rooms')
      setRooms(response.data)
      setAllocationForm((current) => ({ ...current, room_id: response.data.some((room) => room.id === current.room_id && room.status === 'available') ? current.room_id : response.data.find((room) => room.status === 'available')?.id || '' }))
    } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load rooms right now.') } finally { setIsLoadingRooms(false) }
  }

  async function loadStudents() {
    setIsLoadingStudents(true)
    try { const response = await axiosInstance.get('/users/students'); setStudents(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load students right now.') } finally { setIsLoadingStudents(false) }
  }

  async function loadAllocations() {
    setIsLoadingAllocations(true)
    try { const response = await axiosInstance.get('/rooms/allocations'); setAllocations(response.data) } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to load room allocations right now.') } finally { setIsLoadingAllocations(false) }
  }

  function updateForm(setter, event) { setter((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function handleCreateRoom(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!roomForm.room_number.trim()) nextErrors.room_number = 'Room number is required.'
    if (!roomForm.capacity || Number(roomForm.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1.'
    if (roomForm.fee_per_month === '' || Number(roomForm.fee_per_month) < 0) nextErrors.fee_per_month = 'Enter a valid monthly fee.'
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return }
    setFormErrors({}); setMessage({ type: '', text: '' }); setIsCreatingRoom(true)
    try { await axiosInstance.post('/rooms', { ...roomForm, capacity: Number(roomForm.capacity), fee_per_month: Number(roomForm.fee_per_month) }); setRoomForm(initialRoomForm); setMessage({ type: 'success', text: 'Room created successfully.' }); await loadRooms() } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to create room.' }) } finally { setIsCreatingRoom(false) }
  }

  async function handleAllocateRoom(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!allocationForm.student_id) nextErrors.student_id = 'Select a student.'
    if (!allocationForm.room_id) nextErrors.room_id = 'Select an available room.'
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return }
    setFormErrors({}); setMessage({ type: '', text: '' }); setIsAllocating(true)
    try { await axiosInstance.post('/rooms/allocate', allocationForm); setAllocationForm((current) => ({ ...current, student_id: '' })); setMessage({ type: 'success', text: 'Room allocated successfully.' }); await Promise.all([loadRooms(), loadAllocations()]) } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to allocate room.' }) } finally { setIsAllocating(false) }
  }

  async function handleVacate(allocation) {
    if (!window.confirm(`Vacate room ${allocation.room_number} for ${allocation.student_name}?`)) return
    setVacatingId(allocation.id); setMessage({ type: '', text: '' })
    try { await axiosInstance.post(`/rooms/vacate/${allocation.id}`); setMessage({ type: 'success', text: 'Room vacated successfully.' }); await Promise.all([loadAllocations(), loadRooms()]) } catch (requestError) { setMessage({ type: 'error', text: requestError.response?.data?.detail || 'Unable to vacate room.' }) } finally { setVacatingId('') }
  }

  const availableRooms = rooms.filter((room) => room.status === 'available')
  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Hostel operations</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Manage Rooms</h1></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{rooms.length} rooms</span></header>
      {message.text && <FeedbackBanner type={message.type}>{message.text}</FeedbackBanner>}
      {error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <RoomTable rooms={rooms} isLoading={isLoadingRooms} />
      <AllocationTable allocations={allocations} isLoading={isLoadingAllocations} onVacate={handleVacate} vacatingId={vacatingId} />
      <section className="mt-8 grid gap-6 lg:grid-cols-2"><RoomForm form={roomForm} errors={formErrors} isSubmitting={isCreatingRoom} onChange={(event) => updateForm(setRoomForm, event)} onSubmit={handleCreateRoom} /><AllocationForm form={allocationForm} errors={formErrors} students={students} rooms={availableRooms} isLoadingStudents={isLoadingStudents} isSubmitting={isAllocating} onChange={(event) => updateForm(setAllocationForm, event)} onSubmit={handleAllocateRoom} /></section>
    </>
  )
}

function RoomTable({ rooms, isLoading }) {
  return <section className="mt-8"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{isLoading ? <LoadingSkeleton /> : rooms.length === 0 ? <EmptyState icon={BedDouble} title="No rooms yet" message="Create the first room below to start managing hostel capacity." /> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Room', 'Type', 'Occupancy', 'Monthly fee', 'Status'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rooms.map((room) => <tr key={room.id} className="transition hover:bg-amber-50/40"><td className="px-5 py-4 font-bold text-slate-800">{room.room_number}</td><td className="px-5 py-4 capitalize text-slate-600">{room.room_type}</td><td className="px-5 py-4 text-slate-600">{room.occupied_count} / {room.capacity}</td><td className="px-5 py-4 text-slate-600">₹{Number(room.fee_per_month).toLocaleString()}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${room.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{room.status}</span></td></tr>)}</tbody></table></div>}</div></section>
}

function AllocationTable({ allocations, isLoading, onVacate, vacatingId }) {
  return <section className="mt-8"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Current residents</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Room Allocations</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{allocations.length} active</span></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{isLoading ? <LoadingSkeleton /> : allocations.length === 0 ? <EmptyState icon={BedDouble} title="No active allocations" message="Allocated students will appear here once a room is assigned." /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Student', 'Email', 'Room', 'Allocated date', 'Action'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{allocations.map((allocation) => <tr key={allocation.id} className="transition hover:bg-amber-50/40"><td className="px-5 py-4 font-bold text-slate-800">{allocation.student_name}</td><td className="px-5 py-4 text-slate-600">{allocation.student_email}</td><td className="px-5 py-4 text-slate-600">{allocation.room_number} <span className="capitalize text-slate-400">({allocation.room_type})</span></td><td className="px-5 py-4 text-slate-600">{new Date(allocation.allocated_date).toLocaleDateString()}</td><td className="px-5 py-4"><button type="button" onClick={() => onVacate(allocation)} disabled={vacatingId === allocation.id} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">{vacatingId === allocation.id ? <span className="inline-flex items-center gap-2"><Spinner />Vacating...</span> : 'Vacate'}</button></td></tr>)}</tbody></table></div>}</div></section>
}

function RoomForm({ form, errors, isSubmitting, onChange, onSubmit }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"><h2 className="text-xl font-bold text-slate-900">Create a room</h2><p className="mt-1 text-sm text-slate-500">Add a new room to the hostel inventory.</p><form onSubmit={onSubmit} className="mt-6 space-y-4"><Field label="Room number" name="room_number" value={form.room_number} onChange={onChange} placeholder="e.g. A-101" error={errors.room_number} /><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Room type<select name="room_type" value={form.room_type} onChange={onChange} className="form-input"><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option></select></label><Field label="Capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={onChange} error={errors.capacity} /></div><Field label="Fee per month" name="fee_per_month" type="number" min="0" step="0.01" value={form.fee_per_month} onChange={onChange} placeholder="Monthly fee" error={errors.fee_per_month} /><SubmitButton disabled={isSubmitting} busy={isSubmitting}>{isSubmitting ? 'Creating room...' : 'Create room'}</SubmitButton></form></div>
}

function AllocationForm({ form, errors, students, rooms, isLoadingStudents, isSubmitting, onChange, onSubmit }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"><h2 className="text-xl font-bold text-slate-900">Allocate a room</h2><p className="mt-1 text-sm text-slate-500">Assign an available room to a registered student.</p><form onSubmit={onSubmit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-700">Student<select name="student_id" value={form.student_id} onChange={onChange} className="form-input"><option value="">{isLoadingStudents ? 'Loading students...' : 'Select a student'}</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.email})</option>)}</select>{errors.student_id && <ErrorText>{errors.student_id}</ErrorText>}</label><label className="block text-sm font-semibold text-slate-700">Available room<select name="room_id" value={form.room_id} onChange={onChange} className="form-input"><option value="">Select a room</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number} · {room.room_type} ({room.capacity - room.occupied_count} spaces)</option>)}</select>{errors.room_id && <ErrorText>{errors.room_id}</ErrorText>}</label>{rooms.length === 0 && <p className="text-sm text-amber-700">There are no available rooms to allocate.</p>}{!isLoadingStudents && students.length === 0 && <p className="text-sm text-amber-700">No students are available for allocation.</p>}<SubmitButton disabled={isSubmitting || rooms.length === 0 || students.length === 0} busy={isSubmitting} dark>{isSubmitting ? 'Allocating room...' : 'Allocate room'}</SubmitButton></form></div>
}

function Field({ label, name, type = 'text', min, step, value, onChange, placeholder, error }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input type={type} min={min} step={step} name={name} value={value} onChange={onChange} required className="form-input" placeholder={placeholder} />{error && <ErrorText>{error}</ErrorText>}</label> }
function ErrorText({ children }) { return <span className="mt-1 block text-xs font-medium text-rose-600">{children}</span> }
function SubmitButton({ children, disabled, busy, dark = false }) { return <button type="submit" disabled={disabled} className={`w-full rounded-lg px-4 py-3 text-sm font-bold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${dark ? 'bg-slate-800 text-white shadow-slate-200 hover:bg-slate-900' : 'bg-amber-600 text-slate-950 shadow-amber-200 hover:bg-amber-700'}`}>{busy ? <span className="inline-flex items-center justify-center gap-2"><Spinner />{children}</span> : children}</button> }
