import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/useAuth";
import { EmptyState, LoadingSkeleton, Spinner } from "../components/Feedback";
import { BedDouble, MessageSquareWarning, Receipt, Users } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState(null);
  const [fees, setFees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [complaintForm, setComplaintForm] = useState({
    category: "Electrical",
    description: "",
  });
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: "",
    visitor_phone: "",
    purpose: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
  const [isSubmittingVisitor, setIsSubmittingVisitor] = useState(false);
  const [error, setError] = useState("");
  const [feesError, setFeesError] = useState("");
  const [complaintsError, setComplaintsError] = useState("");
  const [complaintMessage, setComplaintMessage] = useState("");
  const [visitorsError, setVisitorsError] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [complaintFieldError, setComplaintFieldError] = useState("");
  const [visitorFieldErrors, setVisitorFieldErrors] = useState({});

  useEffect(() => {
    if (!complaintMessage && !visitorMessage) return undefined;
    const timer = setTimeout(() => {
      setComplaintMessage("");
      setVisitorMessage("");
    }, 2500);
    return () => clearTimeout(timer);
  }, [complaintMessage, visitorMessage]);

  useEffect(() => {
    async function loadAllocation() {
      try {
        const response = await axiosInstance.get("/rooms/my-allocation");
        setAllocation(response.data.room ? response.data : null);
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load your room details.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadAllocation();

    async function loadFees() {
      try {
        const response = await axiosInstance.get("/fees/my-fees");
        setFees(response.data);
      } catch (requestError) {
        setFeesError(
          requestError.response?.data?.detail ||
            "Unable to load your fee details.",
        );
      } finally {
        setIsLoadingFees(false);
      }
    }

    loadFees();

    loadComplaints();
    loadVisitors();

    async function loadComplaints() {
      try {
        const response = await axiosInstance.get("/complaints/my-complaints");
        setComplaints(response.data);
      } catch (requestError) {
        setComplaintsError(
          requestError.response?.data?.detail ||
            "Unable to load your complaints.",
        );
      } finally {
        setIsLoadingComplaints(false);
      }
    }

    async function loadVisitors() {
      try {
        const response = await axiosInstance.get("/visitors/my-visitors");
        setVisitors(response.data);
      } catch (requestError) {
        setVisitorsError(
          requestError.response?.data?.detail ||
            "Unable to load your visitors.",
        );
      } finally {
        setIsLoadingVisitors(false);
      }
    }
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  function handleComplaintChange(event) {
    setComplaintForm({
      ...complaintForm,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmitComplaint(event) {
    event.preventDefault();
    if (!complaintForm.description.trim()) {
      setComplaintFieldError("Please describe the issue before submitting.");
      return;
    }
    setComplaintFieldError("");
    setIsSubmittingComplaint(true);
    setComplaintMessage("");
    setComplaintsError("");

    try {
      await axiosInstance.post("/complaints", complaintForm);
      const response = await axiosInstance.get("/complaints/my-complaints");
      setComplaints(response.data);
      setComplaintForm({ category: "Electrical", description: "" });
      setComplaintMessage("Complaint submitted successfully.");
    } catch (requestError) {
      setComplaintsError(
        requestError.response?.data?.detail ||
          "Unable to submit your complaint.",
      );
    } finally {
      setIsSubmittingComplaint(false);
    }
  }

  function handleVisitorChange(event) {
    setVisitorForm({ ...visitorForm, [event.target.name]: event.target.value });
  }

  async function handleSubmitVisitor(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!visitorForm.visitor_name.trim()) nextErrors.visitor_name = "Name is required.";
    if (!visitorForm.visitor_phone.trim()) nextErrors.visitor_phone = "Phone is required.";
    if (!visitorForm.purpose.trim()) nextErrors.purpose = "Purpose is required.";
    if (Object.keys(nextErrors).length) {
      setVisitorFieldErrors(nextErrors);
      return;
    }
    setVisitorFieldErrors({});
    setIsSubmittingVisitor(true);
    setVisitorMessage("");
    setVisitorsError("");

    try {
      await axiosInstance.post("/visitors", visitorForm);
      const response = await axiosInstance.get("/visitors/my-visitors");
      setVisitors(response.data);
      setVisitorForm({ visitor_name: "", visitor_phone: "", purpose: "" });
      setVisitorMessage("Visitor logged successfully.");
    } catch (requestError) {
      setVisitorsError(
        requestError.response?.data?.detail || "Unable to log visitor.",
      );
    } finally {
      setIsSubmittingVisitor(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 sm:px-8 sm:py-12">
      <section className="rounded-2xl bg-gradient-to-br from-amber-600 to-slate-800 p-8 text-white shadow-xl shadow-amber-200/60 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">
          Student portal
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {user.name}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50">
          Your hostel information, requests, and updates will appear here.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
          Your accommodation
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Room
        </h2>

        {isLoading && <LoadingSkeleton rows={2} />}
        {error && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!isLoading && !error && !allocation && <EmptyState icon={BedDouble} title="No room allocated yet" message="Please contact the admin to arrange your accommodation." />}

        {!isLoading && !error && allocation && (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Room number
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {allocation.room.room_number}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Room type
              </p>
              <p className="mt-2 text-xl font-bold capitalize text-slate-900">
                {allocation.room.room_type}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly fee
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                ₹{Number(allocation.room.fee_per_month).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Allocated on
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">
                {new Date(allocation.allocated_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
          Payments and dues
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Fees
        </h2>

        {isLoadingFees && <LoadingSkeleton rows={2} />}
        {feesError && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {feesError}
          </p>
        )}
        {!isLoadingFees && !feesError && fees.length === 0 && <EmptyState icon={Receipt} title="No fee records yet" message="Your hostel charges will appear here when they are created." />}

        {!isLoadingFees && !feesError && fees.length > 0 && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {fees.map((fee) => (
              <article
                key={fee.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:border-amber-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      ₹{Number(fee.amount).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${fee.paid_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                  >
                    {fee.paid_status}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Due date
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Receipt no.
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {fee.receipt_no || "Not paid yet"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
          Help and support
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Complaints
        </h2>

        <form
          onSubmit={handleSubmitComplaint}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Category
            <select
              name="category"
              value={complaintForm.category}
              onChange={handleComplaintChange}
              className="form-input"
            >
              <option>Electrical</option>
              <option>Plumbing</option>
              <option>Wi-Fi</option>
              <option>Cleanliness</option>
              <option>Other</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              name="description"
              value={complaintForm.description}
              onChange={handleComplaintChange}
              required
              rows="3"
              className="form-input resize-none"
              placeholder="Describe the issue..."
            />
            {complaintFieldError && <span className="mt-1 block text-xs font-medium text-rose-600">{complaintFieldError}</span>}
          </label>
          <button
            type="submit"
            disabled={isSubmittingComplaint}
            className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingComplaint ? <span className="inline-flex items-center gap-2"><Spinner />Submitting...</span> : "Raise complaint"}
          </button>
        </form>
        {complaintMessage && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {complaintMessage}
          </p>
        )}
        {complaintsError && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {complaintsError}
          </p>
        )}

        {isLoadingComplaints && <LoadingSkeleton rows={2} />}
        {!isLoadingComplaints &&
          !complaintsError &&
          complaints.length === 0 && (
            <EmptyState icon={MessageSquareWarning} title="No complaints raised yet" message="Use the form above when you need help from the hostel team." />
          )}
        {!isLoadingComplaints && complaints.length > 0 && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:border-amber-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-900">
                    {complaint.category}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${complaint.status === "resolved" ? "bg-emerald-50 text-emerald-700" : complaint.status === "in-progress" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {complaint.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {complaint.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
                  <span>
                    Created{" "}
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                  {complaint.resolved_at && (
                    <span>
                      Resolved{" "}
                      {new Date(complaint.resolved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
          Guests and visits
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Visitors
        </h2>

        <form
          onSubmit={handleSubmitVisitor}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Visitor name
            <input
              name="visitor_name"
              value={visitorForm.visitor_name}
              onChange={handleVisitorChange}
              required
              className="form-input"
              placeholder="Full name"
            />
            {visitorFieldErrors.visitor_name && <span className="mt-1 block text-xs font-medium text-rose-600">{visitorFieldErrors.visitor_name}</span>}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Phone
            <input
              name="visitor_phone"
              value={visitorForm.visitor_phone}
              onChange={handleVisitorChange}
              required
              className="form-input"
              placeholder="Phone number"
            />
            {visitorFieldErrors.visitor_phone && <span className="mt-1 block text-xs font-medium text-rose-600">{visitorFieldErrors.visitor_phone}</span>}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Purpose
            <input
              name="purpose"
              value={visitorForm.purpose}
              onChange={handleVisitorChange}
              required
              className="form-input"
              placeholder="Reason for visit"
            />
            {visitorFieldErrors.purpose && <span className="mt-1 block text-xs font-medium text-rose-600">{visitorFieldErrors.purpose}</span>}
          </label>
          <button
            type="submit"
            disabled={isSubmittingVisitor}
            className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingVisitor ? <span className="inline-flex items-center gap-2"><Spinner />Logging...</span> : "Log visitor"}
          </button>
        </form>
        {visitorMessage && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {visitorMessage}
          </p>
        )}
        {visitorsError && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {visitorsError}
          </p>
        )}
        {isLoadingVisitors && <LoadingSkeleton rows={2} />}
        {!isLoadingVisitors && !visitorsError && visitors.length === 0 && (
          <EmptyState icon={Users} title="No visitor entries yet" message="Log a visitor above to keep your guest records up to date." />
        )}
        {!isLoadingVisitors && visitors.length > 0 && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {visitors.map((visitor) => (
              <article
                key={visitor.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:border-amber-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-900">
                    {visitor.visitor_name}
                  </h3>
                  {visitor.check_out_time ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Checked out
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      Still checked in
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {visitor.visitor_phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Purpose
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {visitor.purpose}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
                  <span>
                    In: {new Date(visitor.check_in_time).toLocaleString()}
                  </span>
                  {visitor.check_out_time && (
                    <span>
                      Out: {new Date(visitor.check_out_time).toLocaleString()}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
