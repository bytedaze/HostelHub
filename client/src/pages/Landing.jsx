import { ArrowRight, BedDouble, CircleDollarSign, MessageSquareWarning, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { title: 'Room Allocation', text: 'Find your room details and keep occupancy organized.', icon: BedDouble },
  { title: 'Fee Management', text: 'Track dues, payments, and receipts in one place.', icon: CircleDollarSign },
  { title: 'Complaint Management', text: 'Raise issues and follow their progress clearly.', icon: MessageSquareWarning },
  { title: 'Visitor Management', text: 'Log guests and keep every visit accounted for.', icon: Users },
]

export default function Landing() {
  return (
    <main>
      <section className="relative isolate flex min-h-[calc(100vh-73px)] items-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1560185127-6a8c0f2f8c3d?auto=format&fit=crop&w=1800&q=85" alt="HostelHub – Smart Hostel Management  System" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-900/25" />
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl text-white">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">One calm place for hostel life</p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">HostelHub – Smart Hostel Management  System</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">Make everyday hostel operations simpler, clearer, and more connected for students and administrators.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-slate-950/30 transition hover:bg-amber-400">Login <ArrowRight size={17} /></Link>
              <Link to="/register" className="rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">Register</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">Everything in one view</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">A smoother hostel experience</h2></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon size={22} strokeWidth={1.8} /></div><h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  )
}