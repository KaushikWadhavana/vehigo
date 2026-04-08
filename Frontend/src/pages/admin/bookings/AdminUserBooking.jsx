import { useEffect, useState } from "react";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ChevronRight,
  Phone,
  ArrowLeft,
  MoreVertical,   // ✅ ADD THIS
  Eye,            // ✅ ALSO NEEDED
  XCircle,        // ✅ ALSO NEEDED
  Trash2          // ✅ ALSO NEEDED
} from "lucide-react";
import Swal from "sweetalert2";

export default function AdminUserBooking() {
const [bookings, setBookings] = useState([]);  const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("newest");

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  const navigate = useNavigate();

const [openMenuId, setOpenMenuId] = useState(null);

const [rejectModal, setRejectModal] = useState({
  open: false,
  booking: null,
  reason: "",
});

useEffect(() => {
  const handleClick = () => setOpenMenuId(null);
  document.addEventListener("click", handleClick);
  return () => document.removeEventListener("click", handleClick);
}, []);

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      fetchUsers();
    }
  });

  return () => unsubscribe();
}, []);

const fetchUsers = async () => {
  try {
    if (!auth.currentUser) return;

    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      "http://localhost:5000/api/bookings/admin-bookings",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setBookings(data);

  } catch (err) {
    console.error(err);
  }
};

const getStatus = (b) => {
  if (!b) return "Unknown";

  if (b.status === "Cancelled") return "Cancelled";
  if (b.status === "Rejected") return "Rejected"; // ✅ ADD THIS

  const now = new Date();
  const pickup = new Date(b.pickupDate);
  const drop = new Date(b.returnDate);

  if (now < pickup) return "Upcoming";
  if (now >= pickup && now <= drop) return "In Progress";
  return "Completed";
};

const filtered = bookings
  .filter(
    (b) =>
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (sortBy === "amountLow")
  return (a.payment?.amount || 0) - (b.payment?.amount || 0);

if (sortBy === "amountHigh")
  return (b.payment?.amount || 0) - (a.payment?.amount || 0);

    if (sortBy === "asc") return a.userName.localeCompare(b.userName);
    if (sortBy === "desc") return b.userName.localeCompare(a.userName);
    if (sortBy === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);

    return new Date(b.createdAt) - new Date(a.createdAt); // newest
  });


  const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentBookings = filtered.slice(indexOfFirst, indexOfLast);
const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleClick = (user) => {
    Swal.fire({
      title: user.name,
      html: `
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Phone:</b> ${user.phone || "No phone"}</p>
      `,
      confirmButtonColor: "#f97316",
      confirmButtonText: "View Details",
    }).then((res) => {
      if (res.isConfirmed) {
        navigate(`/owner/user/${user.id}`);
      }
    });
  };
const handleDelete = async (booking) => {
  const confirm = await Swal.fire({
    title: "Delete Booking?",
    text: "This will permanently delete",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
  });

  if (!confirm.isConfirmed) return;

  try {
    const token = await auth.currentUser.getIdToken();

    await fetch(
      `http://localhost:5000/api/bookings/admin-delete/${booking._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setBookings((prev) =>
      prev.filter((b) => b._id !== booking._id)
    );

    Swal.fire("Deleted!", "Booking removed", "success");
  } catch (err) {
    Swal.fire("Error", "Delete failed", "error");
  }
};

const handleRejectSubmit = async () => {
  const { booking, reason } = rejectModal;

  if (!reason.trim()) return;

  try {
    const token = await auth.currentUser.getIdToken();

    await fetch(
      `http://localhost:5000/api/bookings/owner-action/${booking._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "reject",
          reason,
        }),
      }
    );

    setBookings((prev) =>
      prev.map((b) =>
        b._id === booking._id
          ? { ...b, status: "Rejected", rejectReason: reason }
          : b
      )
    );

    setRejectModal({ open: false, booking: null, reason: "" });

    Swal.fire("Rejected!", "Booking rejected successfully", "success");

  } catch {
    Swal.fire("Error", "Reject failed", "error");
  }
};

  return (
    <div className="min-h-screen w-full px-4 sm:px-8 lg:px-16 py-8 bg-gray-100 dark:bg-black">
      
      {/* BACK */}
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow hover:text-orange-500"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
            Booking Users
          </h1>
          <p className="text-gray-500">Users who booked your vehicles</p>
        </div>

        <div className="bg-white rounded-2xl px-6 py-3 shadow flex items-center gap-3">
          <Users className="text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-lg">{bookings.length}</p>
          </div>
        </div>
      </div>

<div className="flex flex-col sm:flex-row gap-3 mb-6">

  {/* SEARCH */}
  <div className="relative flex-1">
    <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
    <input
      placeholder="Search user..."
      className="pl-10 pr-4 py-3 w-full rounded-2xl border bg-white shadow focus:ring-2 focus:ring-orange-400"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* SORT */}
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="px-4 py-3 rounded-2xl border bg-white shadow"
  >
    <option value="newest">Newest</option>
    <option value="oldest">Oldest</option>
    <option value="asc">A → Z</option>
    <option value="desc">Z → A</option>
    <option value="amountHigh">Amount High</option>
<option value="amountLow">Amount Low</option>
  </select>

</div>

      {/* GRID */}
{/* TABLE */}
<div className="bg-white rounded-2xl shadow overflow-hidden">

<div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
  <table className="w-full text-sm min-w-[1000px]">

      <thead className="bg-gray-50 border-b text-gray-600">
        <tr>
<th className="px-4 py-3 text-left w-[120px]">Customer ID</th>
<th className="px-4 py-3 text-left w-[200px]">Customer</th>
<th className="px-4 py-3 text-left w-[250px]">Email</th>
<th className="px-4 py-3 text-left w-[180px]">Booked On</th>
<th className="px-4 py-3 text-left w-[140px]">Status</th>
<th className="px-4 py-3 text-left w-[160px]">Payment</th>
<th className="px-4 py-3 text-left w-[140px]">Action</th>
        </tr>
      </thead>

 <tbody>
  {currentBookings.map((b, i) => {
    const status = getStatus(b);

    return (
      <tr key={b._id} className="border-b hover:bg-gray-50">

        {/* ID */}
<td className="px-4 py-4 w-[120px] whitespace-nowrap">
            #{b.bookingId}
        </td>

        {/* CUSTOMER */}
<td className="px-4 py-4 w-[200px]">
            <div className="flex items-center gap-3 min-w-0">
            <img
              src={b.userImage || "/user.png"}
              className="w-10 h-10 rounded-full object-cover"
            />
<p className="font-medium truncate max-w-[180px]">              {b.userName}
            </p>
          </div>
        </td>

        {/* EMAIL */}
<td className="px-4 py-4 w-[250px]">
            <p className="truncate max-w-[250px]">
            {b.userEmail}
          </p>
        </td>

        {/* DATE */}
<td className="px-4 py-4 w-[180px] whitespace-nowrap">
            {new Date(b.createdAt).toLocaleString()}
        </td>

        {/* STATUS */}
<td className="px-4 py-4 w-[140px]">
<span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
  status === "Completed"
    ? "bg-green-100 text-green-600"
    : status === "Cancelled"
    ? "bg-red-100 text-red-600"
    : status === "Rejected"
    ? "bg-red-200 text-red-700"   // ✅ ADD THIS
    : status === "Upcoming"
    ? "bg-blue-100 text-blue-600"
    : "bg-yellow-100 text-yellow-600"
}`}>
            {status}
          </span>
        </td>

        {/* PAYMENT */}
<td className="px-4 py-4 w-[160px]">
  <div className="flex flex-col gap-1">

    <span className="font-semibold whitespace-nowrap">
      ₹ {b.payment?.amount || 0}
    </span>

    <span
      className={`text-xs px-3 py-1 rounded-full w-fit whitespace-nowrap ${
b.payment?.status === "Paid"
  ? "bg-green-100 text-green-600"
  : b.payment?.status === "Refunded"
  ? "bg-blue-100 text-blue-600"
  : "bg-yellow-100 text-yellow-600"
      }`}
    >
{b.payment?.status === "Refunded"
  ? "Refunded"
  : b.payment?.status || "Pending"}
    </span>

  </div>
</td>

        {/* ACTION */}
<td className="px-4 py-4 w-[100px] relative">
  <div className="flex justify-center">

    {/* BUTTON */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === b._id ? null : b._id);
      }}
      className="p-2 rounded-lg hover:bg-gray-100"
    >
      <MoreVertical size={18} className="text-gray-600" />
    </button>

    {/* DROPDOWN */}
    {openMenuId === b._id && (
      <div
        className="absolute right-4 top-12 w-44 bg-white border rounded-xl shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >

        {/* VIEW */}
        <button
          onClick={() => {
            navigate(`/admin/user/${b.userId}`, {
              state: { userId: b.userId, selectedBookingId: b._id },
            });
            setOpenMenuId(null);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
        >
          <Eye size={16} /> View
        </button>

        {/* REJECT */}
        <button
          onClick={() => {
const status = getStatus(b);

// ✅ ALREADY REJECTED
if (status === "Rejected") {
  return Swal.fire({
    icon: "info",
    title: "Already Rejected",
    text: "This booking has already been rejected",
  });
}

// ❌ NOT ALLOWED CASE
if (status !== "Upcoming") {
  return Swal.fire({
    icon: "warning",
    title: "Not Allowed",
    text: "Only upcoming bookings can be rejected",
  });
}
            setRejectModal({
              open: true,
              booking: b,
              reason: "",
            });

            setOpenMenuId(null);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          <XCircle size={16} /> Reject
        </button>

        {/* DELETE */}
        <button
          onClick={() => {
            handleDelete(b);
            setOpenMenuId(null);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          <Trash2 size={16} /> Delete
        </button>

      </div>
    )}
  </div>
</td>

      </tr>
    );
  })}
</tbody>
    </table>
  </div>

  {/* PAGINATION */}
  <div className="p-4 flex justify-between items-center text-sm text-gray-500">

    <div>
      Showing {indexOfFirst + 1} to{" "}
      {Math.min(indexOfLast, filtered.length)} of{" "}
      {filtered.length}
    </div>

    <div className="flex gap-2">

      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-3 py-1 rounded ${
            currentPage === i + 1
              ? "bg-teal-600 text-white"
              : "border"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() =>
          setCurrentPage((p) => Math.min(p + 1, totalPages))
        }
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>

    </div>
  </div>

</div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="text-center mt-16 text-gray-400">
          <Users size={50} className="mx-auto mb-4 opacity-40" />
          <p>No users found</p>
        </div>
      )}
      {/* MODAL */}
      {rejectModal.open && (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    onClick={() =>
      setRejectModal({ open: false, booking: null, reason: "" })
    }
  >
    <div
      className="bg-white rounded-2xl w-[420px] p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >

      <h2 className="text-lg font-semibold mb-4">
        Reject Booking
      </h2>

      <textarea
        value={rejectModal.reason}
        maxLength={250}
        onChange={(e) =>
          setRejectModal({ ...rejectModal, reason: e.target.value })
        }
        placeholder="Enter rejection reason..."
        className="w-full border rounded-lg p-3 text-sm"
        rows={4}
      />

      <div className="flex justify-between text-xs mt-1">
        <span>{rejectModal.reason.length}/250</span>
        {rejectModal.reason.length < 5 && (
          <span className="text-red-500">Min 5 chars</span>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={() =>
            setRejectModal({ open: false, booking: null, reason: "" })
          }
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          disabled={
            !rejectModal.reason ||
            rejectModal.reason.length < 5
          }
          onClick={handleRejectSubmit}
          className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
        >
          Reject
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}