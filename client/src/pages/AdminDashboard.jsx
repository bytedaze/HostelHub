import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/useAuth";
import { EmptyState, FeedbackBanner, LoadingSkeleton, Spinner } from "../components/Feedback";
import { BedDouble, MessageSquareWarning, Receipt, Users } from "lucide-react";

const initialRoomForm = {
  room_number: "",
  room_type: "single",
  capacity: 1,
  fee_per_month: "",
};
const initialFeeForm = { student_id: "", amount: "", due_date: "" };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [fees, setFees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [allocationForm, setAllocationForm] = useState({
    student_id: "",
    room_id: "",
  });
  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isCreatingFee, setIsCreatingFee] = useState(false);
  const [payingFeeId, setPayingFeeId] = useState("");
  const [updatingComplaintId, setUpdatingComplaintId] = useState("");
  const [checkingOutVisitorId, setCheckingOutVisitorId] = useState("");
  const [vacatingId, setVacatingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!formMessage.text) return undefined;
    const timer = setTimeout(() => setFormMessage({ type: "", text: "" }), 2500);
    return () => clearTimeout(timer);
  }, [formMessage]);

  useEffect(() => {
    fetchRooms();
    fetchStudents();
    fetchAllocations();
    fetchFees();
    fetchComplaints();
    fetchVisitors();
  }, []);

  async function fetchRooms() {
    setIsLoadingRooms(true);
    setPageError("");
    try {
      const response = await axiosInstance.get("/rooms");
      setRooms(response.data);
      setAllocationForm((current) => ({
        ...current,
        room_id: response.data.some(
          (room) => room.id === current.room_id && room.status === "available",
        )
          ? current.room_id
          : response.data.find((room) => room.status === "available")?.id || "",
      }));
    } catch (error) {
      setPageError(
        error.response?.data?.detail || "Unable to load rooms right now.",
      );
    } finally {
      setIsLoadingRooms(false);
    }
  }

  async function fetchStudents() {
    setIsLoadingStudents(true);
    try {
      const response = await axiosInstance.get("/users/students");
      setStudents(response.data);
    } catch (error) {
      setPageError(
        error.response?.data?.detail || "Unable to load students right now.",
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }

  async function fetchAllocations() {
    setIsLoadingAllocations(true);
    try {
      const response = await axiosInstance.get("/rooms/allocations");
      setAllocations(response.data);
    } catch (error) {
      setPageError(
        error.response?.data?.detail ||
          "Unable to load room allocations right now.",
      );
    } finally {
      setIsLoadingAllocations(false);
    }
  }

  async function fetchFees() {
    setIsLoadingFees(true);
    try {
      const response = await axiosInstance.get("/fees");
      setFees(response.data);
    } catch (error) {
      setPageError(
        error.response?.data?.detail || "Unable to load fees right now.",
      );
    } finally {
      setIsLoadingFees(false);
    }
  }

  async function fetchComplaints() {
    setIsLoadingComplaints(true);
    try {
      const response = await axiosInstance.get("/complaints");
      setComplaints(response.data);
    } catch (error) {
      setPageError(
        error.response?.data?.detail || "Unable to load complaints right now.",
      );
    } finally {
      setIsLoadingComplaints(false);
    }
  }

  async function fetchVisitors() {
    setIsLoadingVisitors(true);
    try {
      const response = await axiosInstance.get("/visitors");
      setVisitors(response.data);
    } catch (error) {
      setPageError(
        error.response?.data?.detail || "Unable to load visitors right now.",
      );
    } finally {
      setIsLoadingVisitors(false);
    }
  }

  function handleRoomChange(event) {
    setRoomForm({ ...roomForm, [event.target.name]: event.target.value });
  }
  function handleAllocationChange(event) {
    setAllocationForm({
      ...allocationForm,
      [event.target.name]: event.target.value,
    });
  }
  function handleFeeChange(event) {
    setFeeForm({ ...feeForm, [event.target.name]: event.target.value });
  }

  async function handleCreateRoom(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!roomForm.room_number.trim()) nextErrors.room_number = "Room number is required.";
    if (!roomForm.capacity || Number(roomForm.capacity) < 1) nextErrors.capacity = "Capacity must be at least 1.";
    if (roomForm.fee_per_month === "" || Number(roomForm.fee_per_month) < 0) nextErrors.fee_per_month = "Enter a valid monthly fee.";
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return; }
    setFormErrors({});
    setFormMessage({ type: "", text: "" });
    setIsCreatingRoom(true);
    try {
      await axiosInstance.post("/rooms", {
        ...roomForm,
        capacity: Number(roomForm.capacity),
        fee_per_month: Number(roomForm.fee_per_month),
      });
      setRoomForm(initialRoomForm);
      setFormMessage({ type: "success", text: "Room created successfully." });
      await fetchRooms();
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to create room.",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function handleAllocateRoom(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!allocationForm.student_id) nextErrors.student_id = "Select a student.";
    if (!allocationForm.room_id) nextErrors.room_id = "Select an available room.";
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return; }
    setFormErrors({});
    setFormMessage({ type: "", text: "" });
    setIsAllocating(true);
    try {
      await axiosInstance.post("/rooms/allocate", allocationForm);
      setAllocationForm((current) => ({ ...current, student_id: "" }));
      setFormMessage({ type: "success", text: "Room allocated successfully." });
      await fetchRooms();
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to allocate room.",
      });
    } finally {
      setIsAllocating(false);
    }
  }

  async function handleCreateFee(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!feeForm.student_id) nextErrors.fee_student_id = "Select a student.";
    if (!feeForm.amount || Number(feeForm.amount) <= 0) nextErrors.amount = "Enter an amount greater than 0.";
    if (!feeForm.due_date) nextErrors.due_date = "Choose a due date.";
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return; }
    setFormErrors({});
    setFormMessage({ type: "", text: "" });
    setIsCreatingFee(true);
    try {
      await axiosInstance.post("/fees", {
        ...feeForm,
        amount: Number(feeForm.amount),
        due_date: `${feeForm.due_date}T00:00:00`,
      });
      setFeeForm(initialFeeForm);
      setFormMessage({ type: "success", text: "Fee created successfully." });
      await fetchFees();
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to create fee.",
      });
    } finally {
      setIsCreatingFee(false);
    }
  }

  async function handlePayFee(fee) {
    setPayingFeeId(fee.id);
    setFormMessage({ type: "", text: "" });
    try {
      await axiosInstance.put(`/fees/${fee.id}/pay`);
      setFormMessage({
        type: "success",
        text: "Fee marked as paid successfully.",
      });
      await fetchFees();
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to mark fee as paid.",
      });
    } finally {
      setPayingFeeId("");
    }
  }

  async function handleComplaintStatusChange(complaint, nextStatus) {
    if (complaint.status === nextStatus) return;
    setUpdatingComplaintId(complaint.id);
    setFormMessage({ type: "", text: "" });
    try {
      await axiosInstance.put(`/complaints/${complaint.id}/status`, {
        status: nextStatus,
      });
      setFormMessage({
        type: "success",
        text: "Complaint status updated successfully.",
      });
      await fetchComplaints();
    } catch (error) {
      setFormMessage({
        type: "error",
        text:
          error.response?.data?.detail || "Unable to update complaint status.",
      });
    } finally {
      setUpdatingComplaintId("");
    }
  }

  async function handleCheckoutVisitor(visitor) {
    setCheckingOutVisitorId(visitor.id);
    setFormMessage({ type: "", text: "" });
    try {
      await axiosInstance.put(`/visitors/${visitor.id}/checkout`);
      setFormMessage({
        type: "success",
        text: "Visitor checked out successfully.",
      });
      await fetchVisitors();
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to check out visitor.",
      });
    } finally {
      setCheckingOutVisitorId("");
    }
  }

  async function handleVacate(allocation) {
    const confirmed = window.confirm(
      `Vacate room ${allocation.room_number} for ${allocation.student_name}?`,
    );
    if (!confirmed) return;

    setVacatingId(allocation.id);
    setFormMessage({ type: "", text: "" });
    try {
      await axiosInstance.post(`/rooms/vacate/${allocation.id}`);
      setFormMessage({ type: "success", text: "Room vacated successfully." });
      await Promise.all([fetchAllocations(), fetchRooms()]);
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.detail || "Unable to vacate room.",
      });
    } finally {
      setVacatingId("");
    }
  }

  if (!user) return <Navigate to="/login" replace />;
  const availableRooms = rooms.filter((room) => room.status === "available");

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 sm:px-8 sm:py-12">
      <section className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-8 text-white shadow-xl shadow-slate-300/60 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
          Admin portal
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {user.name}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
          Manage rooms and keep hostel operations moving smoothly.
        </p>
      </section>
      {formMessage.text && <div className="mt-6"><FeedbackBanner type={formMessage.type}>{formMessage.text}</FeedbackBanner></div>}

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
              Hostel operations
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Manage Rooms
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {rooms.length} rooms
          </span>
        </div>
        {pageError && (
          <p className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </p>
        )}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          {isLoadingRooms ? (
            <LoadingSkeleton />
          ) : rooms.length === 0 ? (
            <EmptyState icon={BedDouble} title="No rooms yet" message="Create the first room below to start managing hostel capacity." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Room</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Occupancy</th>
                    <th className="px-5 py-4 font-semibold">Monthly fee</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="transition hover:bg-amber-50/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {room.room_number}
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-600">
                        {room.room_type}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {room.occupied_count} / {room.capacity}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        ₹{Number(room.fee_per_month).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${room.status === "available" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {room.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
              Current residents
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Room Allocations
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {allocations.length} active
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          {isLoadingAllocations ? (
            <LoadingSkeleton />
          ) : allocations.length === 0 ? (
            <EmptyState icon={BedDouble} title="No active allocations" message="Allocated students will appear here once a room is assigned." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Room</th>
                    <th className="px-5 py-4 font-semibold">Allocated date</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.map((allocation) => (
                    <tr
                      key={allocation.id}
                      className="transition hover:bg-amber-50/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {allocation.student_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {allocation.student_email}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {allocation.room_number}{" "}
                        <span className="capitalize text-slate-400">
                          ({allocation.room_type})
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(
                          allocation.allocated_date,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleVacate(allocation)}
                          disabled={vacatingId === allocation.id}
                          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {vacatingId === allocation.id ? <span className="inline-flex items-center gap-2"><Spinner />Vacating...</span> : "Vacate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Create a room</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a new room to the hostel inventory.
          </p>
          <form onSubmit={handleCreateRoom} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Room number
              <input
                name="room_number"
                value={roomForm.room_number}
                onChange={handleRoomChange}
                required
                className="form-input"
                placeholder="e.g. A-101"
              />
              {formErrors.room_number && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.room_number}</span>}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Room type
                <select
                  name="room_type"
                  value={roomForm.room_type}
                  onChange={handleRoomChange}
                  className="form-input"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Capacity
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={roomForm.capacity}
                  onChange={handleRoomChange}
                  required
                  className="form-input"
                />
                {formErrors.capacity && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.capacity}</span>}
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Fee per month
              <input
                type="number"
                name="fee_per_month"
                min="0"
                step="0.01"
                value={roomForm.fee_per_month}
                onChange={handleRoomChange}
                required
                className="form-input"
                placeholder="Monthly fee"
              />
              {formErrors.fee_per_month && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.fee_per_month}</span>}
            </label>
            <button
              type="submit"
              disabled={isCreatingRoom}
              className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingRoom ? <span className="inline-flex items-center justify-center gap-2"><Spinner />Creating room...</span> : "Create room"}
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Allocate a room</h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign an available room to a registered student.
          </p>
          <form onSubmit={handleAllocateRoom} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Student
              <select
                name="student_id"
                value={allocationForm.student_id}
                onChange={handleAllocationChange}
                required
                className="form-input"
              >
                <option value="">
                  {isLoadingStudents
                    ? "Loading students..."
                    : "Select a student"}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              {formErrors.student_id && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.student_id}</span>}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Available room
              <select
                name="room_id"
                value={allocationForm.room_id}
                onChange={handleAllocationChange}
                required
                className="form-input"
              >
                <option value="">Select a room</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} · {room.room_type} (
                    {room.capacity - room.occupied_count} spaces)
                  </option>
                ))}
              </select>
              {formErrors.room_id && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.room_id}</span>}
            </label>
            {availableRooms.length === 0 && (
              <p className="text-sm text-amber-700">
                There are no available rooms to allocate.
              </p>
            )}
            {!isLoadingStudents && students.length === 0 && (
              <p className="text-sm text-amber-700">
                No students are available for allocation.
              </p>
            )}
            <button
              type="submit"
              disabled={
                isAllocating ||
                availableRooms.length === 0 ||
                students.length === 0
              }
              className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAllocating ? <span className="inline-flex items-center justify-center gap-2"><Spinner />Allocating room...</span> : "Allocate room"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
              Payments and dues
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Fee Management
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {fees.length} records
          </span>
        </div>
        {pageError && (
          <p className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </p>
        )}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          {isLoadingFees ? (
            <LoadingSkeleton />
          ) : fees.length === 0 ? (
            <EmptyState icon={Receipt} title="No fee records yet" message="Create a fee below to begin tracking student payments." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Due date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Receipt</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee) => (
                    <tr key={fee.id} className="transition hover:bg-amber-50/40">
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {fee.student_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {fee.student_email}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        ₹{Number(fee.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(fee.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${fee.paid_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {fee.paid_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {fee.receipt_no || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {fee.paid_status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handlePayFee(fee)}
                            disabled={payingFeeId === fee.id}
                            className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {payingFeeId === fee.id ? <span className="inline-flex items-center gap-2"><Spinner />Updating...</span> : "Mark as Paid"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
              Resident support
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Complaints
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {complaints.length} records
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          {isLoadingComplaints ? (
            <LoadingSkeleton />
          ) : complaints.length === 0 ? (
            <EmptyState icon={MessageSquareWarning} title="No complaints submitted" message="Student support requests will appear here when they are raised." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created date</th>
                    <th className="px-5 py-4 font-semibold">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className="align-top transition hover:bg-amber-50/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {complaint.student_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {complaint.student_email}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {complaint.category}
                      </td>
                      <td className="max-w-xs px-5 py-4 leading-6 text-slate-600">
                        {complaint.description}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${complaint.status === "resolved" ? "bg-emerald-50 text-emerald-700" : complaint.status === "in-progress" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={complaint.status}
                          onChange={(event) =>
                            handleComplaintStatusChange(
                              complaint,
                              event.target.value,
                            )
                          }
                          disabled={updatingComplaintId === complaint.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
              Guests and visits
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Visitors
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {visitors.length} entries
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          {isLoadingVisitors ? (
            <LoadingSkeleton />
          ) : visitors.length === 0 ? (
            <EmptyState icon={Users} title="No visitor entries yet" message="Visitor check-ins will appear here as students log guests." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Visitor</th>
                    <th className="px-5 py-4 font-semibold">Phone</th>
                    <th className="px-5 py-4 font-semibold">Purpose</th>
                    <th className="px-5 py-4 font-semibold">Check-in</th>
                    <th className="px-5 py-4 font-semibold">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitors.map((visitor) => (
                    <tr
                      key={visitor.id}
                      className="align-top transition hover:bg-amber-50/40"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {visitor.student_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.student_email}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {visitor.visitor_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.visitor_phone}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.purpose}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {new Date(visitor.check_in_time).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {visitor.check_out_time ? (
                          <span className="text-slate-600">
                            {new Date(visitor.check_out_time).toLocaleString()}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCheckoutVisitor(visitor)}
                            disabled={checkingOutVisitorId === visitor.id}
                            className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {checkingOutVisitorId === visitor.id ? <span className="inline-flex items-center gap-2"><Spinner />Checking out...</span> : "Checkout"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">Create a fee</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a fee record for a registered student.
        </p>
        <form
          onSubmit={handleCreateFee}
          className="mt-6 grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Student
            <select
              name="student_id"
              value={feeForm.student_id}
              onChange={handleFeeChange}
              required
              className="form-input"
            >
              <option value="">
                {isLoadingStudents ? "Loading students..." : "Select a student"}
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
            {formErrors.fee_student_id && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.fee_student_id}</span>}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Amount
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              value={feeForm.amount}
              onChange={handleFeeChange}
              required
              className="form-input"
              placeholder="Amount"
            />
            {formErrors.amount && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.amount}</span>}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Due date
            <input
              type="date"
              name="due_date"
              value={feeForm.due_date}
              onChange={handleFeeChange}
              required
              className="form-input"
            />
            {formErrors.due_date && <span className="mt-1 block text-xs font-medium text-rose-600">{formErrors.due_date}</span>}
          </label>
          <button
            type="submit"
            disabled={isCreatingFee || students.length === 0}
            className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingFee ? <span className="inline-flex items-center gap-2"><Spinner />Creating...</span> : "Create Fee"}
          </button>
        </form>
      </section>
    </main>
  );
}
