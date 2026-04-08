import { useEffect, useState, useRef } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ChevronRight,
  Phone,
  ArrowLeft,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Trash2

} from "lucide-react";
import Swal from "sweetalert2";

export default function UserBooking() {
const [bookings, setBookings] = useState([]);  const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("newest");

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const suggestionRef = useRef(null);

const [openMenuId, setOpenMenuId] = useState(null);

const [statusFilter, setStatusFilter] = useState("All");

  const navigate = useNavigate();

useEffect(() => {
  const handleClick = () => {
    setOpenMenuId(null);
  };

  document.addEventListener("click", handleClick);
  return () => document.removeEventListener("click", handleClick);
}, []);
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setRejectModal({ open: false, booking: null, reason: "" });
    }
  };

  document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, []);
  useEffect(() => {
    fetchUsers();
  }, []);
useEffect(() => {
  const handleClick = (e) => {
    if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
      setShowSuggestions(false);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

const [rejectModal, setRejectModal] = useState({
  open: false,
  booking: null,
  reason: "",
});

const fetchUsers = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      "http://localhost:5000/api/bookings/owner-bookings",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    // ❌ REMOVE MAP (IMPORTANT)
    setBookings(data); // ✅ store ALL bookings
  } catch (err) {
    console.error(err);
  }
};

const getStatus = (b) => {
  if (!b) return "Unknown"; // ✅ FIX (IMPORTANT)

  if (b.status === "Cancelled") return "Cancelled";
  if (b.status === "Rejected") return "Rejected";

  const now = new Date();
  const pickup = new Date(b.pickupDate);
  const drop = new Date(b.returnDate);

  if (now < pickup) return "Upcoming";
  if (now >= pickup && now <= drop) return "In Progress";
  return "Completed";
};


const filtered = bookings
  .filter((b) => {
    const matchesSearch =
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase());

    const status = getStatus(b);

    const matchesStatus =
      statusFilter === "All" || status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    if (sortBy === "amountLow")
      return (a.payment?.amount || 0) - (b.payment?.amount || 0);

    if (sortBy === "amountHigh")
      return (b.payment?.amount || 0) - (a.payment?.amount || 0);

    if (sortBy === "asc") return a.userName.localeCompare(b.userName);
    if (sortBy === "desc") return b.userName.localeCompare(a.userName);
    if (sortBy === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);

    return new Date(b.createdAt) - new Date(a.createdAt);
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
      `http://localhost:5000/api/bookings/delete/${booking._id}`,
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

const handleSearchChange = (e) => {
  const value = e.target.value;
  setSearch(value);

  if (!value.trim()) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  const filtered = bookings
    .filter(
      (b) =>
        b.userName?.toLowerCase().includes(value.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, 5);

  setSuggestions(filtered);
  setShowSuggestions(true);
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

  } catch {
    alert("Reject failed");
  }
};


  return (
    <div className="bg-gray-100 min-h-screen p-6">

  <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">

{/* HEADER */}
<div className="mb-8">

  {/* TOP */}
  <div className="flex items-center justify-between mb-6">

    {/* LEFT */}
    <div>
      <button
        onClick={() => navigate("/owner")}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-500 text-sm mb-2"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-gray-900">
        Booking Management
      </h1>

      <p className="text-gray-500 text-sm mt-1">
        Track and manage all your bookings
      </p>
    </div>

  </div>

  {/* STATS */}
<div className="flex flex-wrap lg:flex-nowrap gap-3 sm:gap-5 mb-6">
  
  
  {/* TOTAL */}
<div
  onClick={() => setStatusFilter("All")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center md:items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "All"
      ? "ring-2 ring-orange-400 bg-orange-50"
      : "bg-white"
  }`}
>
  {/* ICON */}
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-orange-100">
    <Users className="text-orange-500" size={18} />
  </div>

  {/* TEXT */}
  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold">
      {bookings.length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">Total</p>
  </div>
</div>


  {/* COMPLETED */}
<div
  onClick={() => setStatusFilter("Completed")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center md:items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "Completed"
      ? "ring-2 ring-green-400 bg-green-50"
      : "bg-white"
  }`}
>
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-green-100">
    <CheckCircle className="text-green-600" size={18} />
  </div>

  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
      {bookings.filter(b => getStatus(b) === "Completed").length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">Completed</p>
  </div>
</div>
  {/* UPCOMING */}
<div
  onClick={() => setStatusFilter("Upcoming")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center md:items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "Upcoming"
      ? "ring-2 ring-blue-400 bg-blue-50"
      : "bg-white"
  }`}
>
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-blue-100">
    <ChevronRight className="text-blue-600" size={18} />
  </div>

  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
      {bookings.filter(b => getStatus(b) === "Upcoming").length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">Upcoming</p>
  </div>
</div>
{/* IN PROGRESS */}
<div
  onClick={() => setStatusFilter("In Progress")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "In Progress"
      ? "ring-2 ring-yellow-400 bg-yellow-50"
      : "bg-white"
  }`}
>
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-yellow-100">
    <ArrowUpDown className="text-yellow-600" size={18} />
  </div>

  <div className="flex flex-col items-center lg:items-start w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-yellow-600">
      {bookings.filter(b => getStatus(b) === "In Progress").length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500">In Progress</p>
  </div>
</div>
  {/* CANCELLED */}
<div
  onClick={() => setStatusFilter("Cancelled")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center md:items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "Cancelled"
      ? "ring-2 ring-red-400 bg-red-50"
      : "bg-white"
  }`}
>
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-red-100">
    <XCircle className="text-red-600" size={18} />
  </div>

  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-red-600">
      {bookings.filter(b => getStatus(b) === "Cancelled").length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">Cancelled</p>
  </div>
</div>


{/* REJECTED */}
<div
  onClick={() => setStatusFilter("Rejected")}
  className={`flex-1 min-w-[140px] cursor-pointer border rounded-xl p-3 sm:p-4 transition 
  flex flex-col lg:flex-row items-center md:items-center 
  justify-center md:justify-between text-center md:text-left gap-2 ${
    statusFilter === "Rejected"
      ? "ring-2 ring-red-500 bg-red-50"
      : "bg-white"
  }`}
>
  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-red-200">
    <XCircle className="text-red-700" size={18} />
  </div>

  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-red-700">
      {bookings.filter(b => getStatus(b) === "Rejected").length}
    </h2>
    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">Rejected</p>
  </div>
</div>

</div>
  {/* SEARCH + SORT */}
  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

    {/* SEARCH */}
    <div className="relative w-full md:w-[420px]" ref={suggestionRef}>
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

      <input
        placeholder="Search by user or email..."
        value={search}
        onChange={handleSearchChange}
        className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 shadow-sm"
      />

      {/* SUGGESTIONS */}
      {showSuggestions && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => {
                  setSearch(s.userName);
                  setShowSuggestions(false);
                }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <img
                  src={s.userImage || "/user.png"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{s.userName}</p>
                  <p className="text-xs text-gray-500">{s.userEmail}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-400 text-center">
              No users found
            </div>
          )}
        </div>
      )}
    </div>

    {/* SORT */}
{/* SORT */}
<div className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl shadow-sm">

  <ArrowUpDown size={16} className="text-gray-500" />

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="text-sm bg-transparent outline-none"
  >
    <option value="newest">🆕 Newest</option>
    <option value="oldest">📅 Oldest</option>
    <option value="asc">🔤 A → Z</option>
    <option value="desc">🔡 Z → A</option>
    <option value="amountHigh">💰 Amount High</option>
    <option value="amountLow">💸 Amount Low</option>
  </select>

</div>
  </div>
<div className="flex justify-between items-center mt-3">

<p className="text-sm text-gray-500 flex items-center gap-2">
  {statusFilter !== "All" && (
    <>
      <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-md text-xs">
        {statusFilter}
      </span>
    </>
  )}
</p>

  {/* CLEAR BUTTON */}
  {(statusFilter !== "All" || sortBy !== "newest" || search) && (
    <button
      onClick={() => {
        setStatusFilter("All");
        setSortBy("newest");
        setSearch("");
      }}
      className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
    >
      Clear All ✖
    </button>
  )}
</div>
</div>


{/* TABLE */}
<div className="bg-gray-50 border rounded-2xl p-6 shadow-sm">

<div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
  <table className="w-full text-sm min-w-[1000px] border-separate border-spacing-y-2">

      <thead className="bg-gray-100 border-b text-gray-700">
        <tr>
<th className="pl-6 pr-3 py-3 text-left w-[120px]">Customer ID</th>
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
      <tr key={b._id} className="bg-white shadow-sm hover:shadow-mfd transition rounded-xl">

        {/* ID */}
<td className="pl-6 pr-3 py-4 w-[120px] whitespace-nowrap font-medium text-gray-800">
              #{b.bookingId}
        </td>

        {/* CUSTOMER */}
<td className="px-4 py-4 w-[200px]">
            <div className="flex items-center gap-3 min-w-[200px]">
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
<span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
  status === "Completed"
    ? "bg-green-100 text-green-600"
    : status === "Cancelled"
    ? "bg-red-100 text-red-600"
    : status === "Rejected"
    ? "bg-red-200 text-red-700"
    : status === "Upcoming"
    ? "bg-blue-100 text-blue-600"
    : status === "In Progress"
    ? "bg-yellow-100 text-yellow-600"
    : "bg-gray-100 text-gray-600"
}`}>
  {status === "Completed" && <CheckCircle size={12} />}
  {status === "Cancelled" && <XCircle size={12} />}
  {status === "Rejected" && <XCircle size={12} />}
  {status === "Upcoming" && <ChevronRight size={12} />}
  {status === "In Progress" && <ArrowUpDown size={12} />}

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
            navigate(`/owner/user/${b.userId}`, {
              state: { userId: b.userId, selectedBookingId: b._id },
            });
            setOpenMenuId(null);
          }}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
        >
          <Eye size={16} /> View
        </button>

<button
  onClick={() => {
    const status = getStatus(b);

    // ❌ BLOCK INVALID STATES
    if (status === "Completed") {
      return Swal.fire({
        icon: "warning",
        title: "Not Allowed",
        text: "Completed bookings cannot be rejected",
        confirmButtonColor: "#ef4444",
      });
    }

    if (status === "In Progress") {
      return Swal.fire({
        icon: "warning",
        title: "Not Allowed",
        text: "Ongoing bookings cannot be rejected",
        confirmButtonColor: "#ef4444",
      });
    }

    if (status === "Cancelled") {
      return Swal.fire({
        icon: "info",
        title: "Already Cancelled",
        text: "This booking is already cancelled",
      });
    }

    if (status === "Rejected") {
      return Swal.fire({
        icon: "info",
        title: "Already Rejected",
        text: "This booking is already rejected",
      });
    }

    // ✅ ONLY ALLOW UPCOMING
    if (status === "Upcoming") {
      setRejectModal({
        open: true,
        booking: b,
        reason: "",
      });
    }

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
    </div>

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

      <div className="flex items-center gap-2 mb-4">
        <XCircle className="text-red-500" size={20} />
        <h2 className="text-lg font-semibold">Reject Booking</h2>
      </div>

<textarea
  value={rejectModal.reason}
  maxLength={250}   // ✅ ADD THIS
  onChange={(e) =>
    setRejectModal({ ...rejectModal, reason: e.target.value })
  }
  placeholder="Enter rejection reason..."
  className={`w-full border rounded-lg p-3 text-sm focus:ring-2 ${
    !rejectModal.reason || rejectModal.reason.length < 5
      ? "border-red-300 focus:ring-red-400"
      : "focus:ring-red-400"
  }`}
  rows={4}
/>
<div className="flex justify-between mt-1 text-xs">
  <span className="text-gray-400">
    {rejectModal.reason.length}/250
  </span>

  {rejectModal.reason && rejectModal.reason.length < 5 && (
    <span className="text-red-500">
      Minimum 5 characters required
    </span>
  )}

  {rejectModal.reason.length === 250 && (
    <span className="text-orange-500">
      Max limit reached
    </span>
  )}
</div>


      <div className="flex justify-end gap-3 mt-5">

        <button
          onClick={() =>
            setRejectModal({ open: false, booking: null, reason: "" })
          }
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>

<button
  disabled={
    !rejectModal.reason ||
    rejectModal.reason.length < 5 ||
    rejectModal.reason.length > 250
  }
  onClick={handleRejectSubmit}
  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
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