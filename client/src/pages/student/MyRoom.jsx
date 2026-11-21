import { useEffect, useState } from 'react'
import { BedDouble } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { EmptyState, LoadingSkeleton } from '../../components/Feedback'

export default function MyRoom() {
  const [allocation, setAllocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAllocation() {
      try {
        const response = await axiosInstance.get('/rooms/my-allocation')
        setAllocation(response.data.room ? response.data : null)
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          setError(requestError.response?.data?.detail || 'Unable to load your room details.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadAllocation()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">Your accommodation</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My Room</h1>
      {isLoading && <LoadingSkeleton rows={2} />}
      {error && <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {!isLoading && !error && !allocation && <EmptyState icon={BedDouble} title="No room allocated yet" message="Please contact the admin to arrange your accommodation." />}
      {!isLoading && !error && allocation && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RoomDetail label="Room number" value={allocation.room.room_number} amber />
          <RoomDetail label="Room type" value={allocation.room.room_type} />
          <RoomDetail label="Monthly fee" value={`₹${Number(allocation.room.fee_per_month).toLocaleString()}`} />
          <RoomDetail label="Allocated on" value={new Date(allocation.allocated_date).toLocaleDateString()} />
        </div>
      )}
    </section>
  )
}

function RoomDetail({ label, value, amber = false }) {
  return (
    <div className={`rounded-xl p-5 ${amber ? 'bg-amber-50' : 'bg-slate-50'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${amber ? 'text-amber-600' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-2 text-xl font-bold capitalize text-slate-900">{value}</p>
    </div>
  )
}
