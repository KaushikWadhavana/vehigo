import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import { MoreVertical, Eye, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
const [dateFilter, setDateFilter] = useState("all");
const [sortBy, setSortBy] = useState("newest");
const [customRange, setCustomRange] = useState({ from: null, to: null });

const navigate = useNavigate();
const [openMenu, setOpenMenu] = useState(null);
const [selectedBooking, setSelectedBooking] = useState(null);

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

useEffect(() => {
  const handleClick = () => setOpenMenu(null);
  window.addEventListener("click", handleClick);
  return () => window.removeEventListener("click", handleClick);
}, []);



  /* ================= AUTH ================= */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);
useEffect(() => {
  setCurrentPage(1);
}, [filter, dateFilter, sortBy]);
  /* ================= FETCH BOOKINGS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const token = await user.getIdToken();

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBookings(res.data);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [user]);


    /* ================= STATUS STYLE ================= */
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
  /* ================= FILTER ================= */
const filteredBookings = bookings
  .filter((b) => {
    const status = getStatus(b);

    if (filter === "cancelled") return status === "Cancelled";
    if (filter === "rejected") return status === "Rejected"; // ✅ ADD THIS
    if (filter === "completed") return status === "Completed";
    if (filter === "upcoming") return status === "Upcoming";
    if (filter === "inprogress") return status === "In Progress";

    return true;
  })
.filter((b) => {
  const created = new Date(b.createdAt);
  const now = new Date(); // ✅ MOVE HERE

  if (dateFilter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return created >= weekAgo;
  }
    if (dateFilter === "month") {
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }

    if (dateFilter === "30days") {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      return created >= d;
    }

    if (dateFilter === "custom" && customRange.from && customRange.to) {
      return (
        created >= new Date(customRange.from) &&
        created <= new Date(customRange.to)
      );
    }

    return true;
  })
  .sort((a, b) => {
    if (sortBy === "priceLow") return a.totalAmount - b.totalAmount;
    if (sortBy === "priceHigh") return b.totalAmount - a.totalAmount;
    if (sortBy === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);

    // newest default
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentBookings = filteredBookings.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);


  const handleCustomDate = async () => {
  const { value: formValues } = await Swal.fire({
    title: "Select Date Range",
    html:
      '<input type="date" id="from" class="swal2-input">' +
      '<input type="date" id="to" class="swal2-input">',
    focusConfirm: false,
    preConfirm: () => {
      return {
        from: document.getElementById("from").value,
        to: document.getElementById("to").value
      };
    }
  });

  if (formValues) {
    setCustomRange(formValues);
    setDateFilter("custom");
  }
};

const handleStartRide = async () => {
  const status = getStatus(selectedBooking || {});

  if (status === "Completed") {
    Swal.fire("Ride Finished", "This ride is already completed", "info");
    return;
  }

  if (status === "Upcoming") {
    Swal.fire("Too Early", "Ride not started yet", "warning");
    return;
  }

  // ✅ ONLY allow if In Progress
  if (status === "In Progress") {
    Swal.fire({
      title: "Ride Started!",
      text: "Enjoy your journey 🚗",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    setSelectedBooking(null);
  }
};
const handleDelete = async (id) => {
  const booking = bookings.find((b) => b._id === id);
if (!booking) return;
  // ❌ BLOCK IF COMPLETED
  if (getStatus(booking) === "Completed") {
    Swal.fire({
      title: "Not Allowed",
      text: "Ride already completed. Cannot cancel.",
      icon: "error",
    });
    return;
  }

  const policy = getCancelPolicyMessage(booking);

const isPickup = booking.payment?.method !== "razorpay";

const confirm = await Swal.fire({
  title: "Cancel Booking?",
  text: isPickup
    ? "You didn't pay online. No refund required."
    : policy?.message || "Are you sure you want to cancel?",
  icon: isPickup ? "info" : policy?.refund ? "info" : "warning",
  showCancelButton: true,
  confirmButtonColor: "#ef4444",
});

  if (!confirm.isConfirmed) return;

  try {
    const token = await auth.currentUser.getIdToken();

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/bookings/cancel/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setBookings((prev) =>
      prev.map((b) =>
        b._id === id ? { ...b, status: "Cancelled" } : b
      )
    );

Swal.fire({
  title: "Cancelled!",
  text: isPickup
    ? "Booking cancelled. No payment was made."
    : policy?.message || "Booking cancelled successfully.",
  icon: isPickup ? "info" : policy?.refund ? "success" : "warning",
});
setSelectedBooking(null);
  } catch {
    Swal.fire("Error", "Cancel failed", "error");
  }
};


const getCancelPolicyMessage = (booking) => {
  const now = new Date();
  const pickup = new Date(booking.pickupDate);
  const drop = new Date(booking.returnDate);

  // ✅ BEFORE START
  if (now < pickup) {
    return {
      message: "Refund will be processed in 7 days ⏳",
      refund: true,
    };
  }

  // ❌ DURING RIDE
  if (now >= pickup && now <= drop) {
    return {
      message: "No refund. Ride already started 🚫",
      refund: false,
    };
  }

  return null; // ✅ IMPORTANT FIX
};


const badgeColor = (status) => {
  switch (status) {
    case "Cancelled":
      return "bg-red-100 text-red-600";
    case "Rejected":
      return "bg-red-200 text-red-700"; // ✅ ADD
    case "Completed":
      return "bg-green-100 text-green-600";
    case "Upcoming":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-yellow-100 text-yellow-600";
  }
};

return (
  <>
  <div className="bg-gray-100 min-h-screen p-4 md:p-8">

    {/* MAIN CARD */}
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">
            My Bookings
          </h1>

          {/* FILTER BUTTONS */}
          <div className="flex flex-wrap gap-2">
            {["all", "upcoming", "inprogress", "completed", "cancelled", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm border
                ${
                  filter === f
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f === "all"
                  ? "All Bookings"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT FILTERS */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => {
              if (e.target.value === "custom") handleCustomDate();
              else setDateFilter(e.target.value);
            }}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="30days">Last 30 Days</option>
  
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest</option>
            <option value="priceLow">Price Low → High</option>
            <option value="priceHigh">Price High → Low</option>
          </select>
        </div>
      </div>

      {/* INNER SECTION */}
<div className="bg-gray-50 border rounded-xl p-4 overflow-visible">

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            All Bookings{" "}
            <span className="text-sm bg-gray-300 px-2 py-0.5 rounded-full">
              {filteredBookings.length}
            </span>
          </h2>

          <button 
           onClick={() => navigate("/listing")}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            + Add Booking
          </button>
        </div>

        {/* TABLE SCROLL */}
        <div className="overflow-x-auto relative">

          <table className="min-w-[1100px] w-full text-sm">

            <thead className="text-gray-600 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left min-w-[300px]">Vehicle Name</th>
                <th className="px-4 py-3 text-left">Rental Type</th>
                <th className="px-4 py-3 text-left">Pickup</th>
                <th className="px-4 py-3 text-left">Dropoff</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Payment</th>
<th className="px-4 py-3 text-left">Action</th> 
              </tr>
            </thead>

            <tbody>
              {currentBookings.map((b, i) => {
                const status = getStatus(b);

                return (
                  <tr key={b._id} className="border-b hover:bg-gray-100">

                    <td className="px-4 py-4">#{b.bookingId}</td>

                    <td className="px-4 py-4">
                      <div className="flex gap-3 items-center">
<img
  src={b.image || "/no-image.png"}
  onError={(e) => (e.target.src = "/no-image.png")}
  className="w-24 h-20 rounded-lg object-cover"
/>
                        <div>
                          <p className="font-medium ">{b.name}</p>
                          <p className="text-xs text-gray-500">
                            {b.deliveryType}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 min-w-[120px]">{b.planType}</td>

          <td className="px-4 py-4 text-xs min-w-[200px]">

    {new Date(b.pickupDate).toLocaleString()}

  <p className="text-gray-500">
    {b.pickupLocation}
  </p>
</td>

                    <td className="px-4 py-4 text-xs min-w-[200px] ">
                      {new Date(b.returnDate).toLocaleString()}
                      <br />
                      <span className="text-gray-500">
                        {b.returnLocation}
                      </span>
                    </td>

                <td className="px-4 py-4 font-semibold">
  ₹{b.totalAmount}

  {b.tollAmount > 0 && (
    <p className="text-xs text-orange-500">
      + Toll ₹{b.tollAmount}
    </p>
  )}
</td>

                    <td className="px-4 py-4  min-w-[130px] ">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${badgeColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    {/* 🔥 ADD THIS */}
<td className="px-4 py-4  min-w-[160px]">
  <span
    className={`px-2 py-1 rounded-full text-xs ${
b.payment?.status === "Paid"
  ? "bg-green-100 text-green-600"
  : b.payment?.status === "Refunded"
  ? "bg-blue-100 text-blue-600"
  : "bg-yellow-100 text-yellow-600"
    }`}
  >
{b.status === "Cancelled" && b.payment?.method !== "razorpay" ? (
  <span className="text-gray-500">No online payment</span>
) : (
  <>
    {b.payment?.method === "razorpay" ? "Online" : "Pickup"} -{" "}
{b.payment?.status === "Refunded"
  ? "Refunded"
  : b.payment?.status || "Pending"}
  </>
)}
  </span>
</td>

<td className="px-4 py-4 relative">
  <button
    onClick={(e) => {
      e.stopPropagation();
      setOpenMenu(openMenu === b._id ? null : b._id);
    }}
    className="text-gray-500 hover:text-black"
  >
    <MoreVertical size={18} />
  </button>

  {openMenu === b._id && (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-xl z-[9999]"
    >
      {/* ALWAYS SHOW VIEW */}
      <button
        onClick={() => {
          setSelectedBooking(b);
          setOpenMenu(null);
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
      >
        <Eye size={16} /> View
      </button>

      {/* 🔥 CONDITIONAL ACTION */}
      {getStatus(b) === "Cancelled" && (
        <div className="px-4 py-2 text-sm text-gray-400">
          ❌ You cancelled this booking
        </div>
      )}
      {getStatus(b) === "Rejected" && (
  <div className="px-4 py-2 text-sm text-gray-400">
    ❌ Booking was rejected
  </div>
)}

      {getStatus(b) === "Completed" && (
        <div className="px-4 py-2 text-sm text-gray-400">
          ✅ Ride already completed
        </div>
      )}

      {/* SHOW DELETE ONLY IF ACTIVE */}
      {getStatus(b) !== "Cancelled" &&
        getStatus(b) !== "Completed" &&
        getStatus(b) !== "Rejected" && (
          <button
            onClick={() => handleDelete(b._id)}
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-500 text-sm flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
    </div>
  )}
</td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

<div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">

  {/* LEFT TEXT */}
  <div>
    Showing {indexOfFirst + 1} to{" "}
    {Math.min(indexOfLast, filteredBookings.length)} of{" "}
    {filteredBookings.length} entries
  </div>

  {/* PAGINATION BUTTONS */}
  <div className="flex items-center gap-2">

    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded-md disabled:opacity-50"
    >
      Prev
    </button>

    {/* PAGE NUMBERS */}
    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded-md ${
          currentPage === i + 1
            ? "bg-teal-600 text-white"
            : "border"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded-md disabled:opacity-50"
    >
      Next
    </button>

  </div>
</div>

      </div>
    </div>
  </div>
{selectedBooking && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    {/* MODAL CONTAINER */}
    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

      {/* HEADER (COMPACT + BALANCED) */}
      <div className="flex items-center gap-4 px-6 py-4 border-b">

        <img
          src={selectedBooking?.image || "/no-image.png"}
          onError={(e) => (e.target.src = "/no-image.png")}
          className="w-20 h-16 rounded-lg object-cover"
        />

        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-800">
            {selectedBooking.name}
          </h2>
          <p className="text-xs text-gray-500">
            📍 {selectedBooking.mainLocation}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-semibold text-red-500">
            ₹{selectedBooking.totalAmount}
          </p>
        </div>
      </div>

      {/* SCROLLABLE CONTENT (MAIN FIX) */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">


     {/* PERSONAL DETAILS */}
        <div className="bg-gray-50 p-5 rounded-xl border">
          <h3 className="font-semibold mb-4">Personal Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 text-sm">

            <div>
              <p className="text-xs text-gray-400">User</p>
              <p className="font-medium">{selectedBooking.userName}</p>
              <p className="text-gray-600">{selectedBooking.userPhone}</p>
              <p className="text-gray-600">{selectedBooking.userEmail}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="font-medium">
                {selectedBooking.userAddress || "No address available"}
              </p>
            </div>

          </div>
        </div>
        
        {/* BOOKING DETAILS */}
        <div className="bg-gray-50 p-5 rounded-xl border">
          <h3 className="font-semibold mb-4">Booking Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 text-sm">

            {/* LEFT */}
            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-400">Booking Type</p>
                <p className="font-medium">{selectedBooking.deliveryType}</p>
              </div>

       <div>
  <p className="text-xs text-gray-400">Extra Service</p>

  <div className="font-medium space-y-1">

    {/* NORMAL EXTRAS */}
    {selectedBooking.extras?.length > 0 ? (
      selectedBooking.extras.map((e) => (
        <div key={e.key} className="flex justify-between text-sm">
          <span>{e.title}</span>

          <span>
            {e.type === "dynamic"
              ? selectedBooking.tollAmount > 0
                ? `₹${selectedBooking.tollAmount}`   // ✅ OWNER UPDATED
                : "To be added"                    // ✅ USER SELECTED BUT NOT UPDATED
              : `₹${e.price}`}
          </span>
        </div>
      ))
    ) : (
      <p>None</p>
    )}

  </div>
</div>

              <div>
                <p className="text-xs text-gray-400">Dropoff</p>
                <p className="font-medium">{selectedBooking.returnLocation}</p>
                <p className="text-xs text-gray-400">
                  {new Date(selectedBooking.returnDate).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Booked On</p>
                <p className="font-medium">
                  {new Date(selectedBooking.createdAt).toLocaleString()}
                </p>
              </div>

            </div>

            {/* RIGHT */}
            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-400">Rental Type</p>
                <p className="font-medium capitalize">
                  {selectedBooking.planType}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="font-medium">{selectedBooking.pickupLocation}</p>
                <p className="text-xs text-gray-400">
                  {new Date(selectedBooking.pickupDate).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Status</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${badgeColor(getStatus(selectedBooking))}`}>
                  {getStatus(selectedBooking)}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400">Payment</p>
                <span className="text-sm font-medium">
                  {selectedBooking.payment?.method === "razorpay"
                    ? "Online"
                    : "Pickup"}{" "}
                  - {selectedBooking.payment?.status || "Pending"}
                </span>
              </div>

            </div>

          </div>
        </div>
{selectedBooking.status === "Rejected" && selectedBooking.rejectReason && (
  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700">
    <b>Reason:</b> {selectedBooking.rejectReason}
  </div>
)}

{/* ===== PRICE BREAKDOWN ===== */}
<div className="bg-gray-50 p-5 rounded-xl border">
  <h3 className="font-semibold mb-4">Price Details</h3>

  <div className="space-y-2 text-sm">

    <div className="flex justify-between">
      <span>Base Price</span>
      <span>₹{selectedBooking.basePrice}</span>
    </div>

    <div className="flex justify-between">
      <span>Delivery Charge</span>
      <span>₹{selectedBooking.deliveryCharge}</span>
    </div>

    <div className="flex justify-between">
      <span>Tax</span>
      <span>₹{selectedBooking.taxAmount}</span>
    </div>

    <div className="flex justify-between text-orange-600">
      <span>Refundable Deposit</span>
      <span>₹{selectedBooking.refundableDeposit}</span>
    </div>

    {/* ✅ EXTRA SERVICES */}
{selectedBooking.extras?.length > 0 && (
  <div className="flex justify-between">
    <span>Extras</span>
    <span>
      ₹
      {selectedBooking.extras.reduce((sum, e) => {
        if (e.type === "dynamic") return sum;

        // ✅ CALCULATE DAYS
        const start = new Date(selectedBooking.pickupDate);
        const end = new Date(selectedBooking.returnDate);

        const days = Math.max(
          1,
          Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        );

        if (e.type === "per_day") {
          return sum + days * (e.price || 0);
        }

        return sum + (e.price || 0);
      }, 0)}
    </span>
  </div>
)}

    {/* ✅ TOLL (ONLY IF SELECTED) */}
{selectedBooking.extras?.some(e => e.type === "dynamic") && (
  <div className="flex justify-between font-medium text-orange-500">
    <span>Toll Charges</span>
    <span>
      {selectedBooking.tollAmount > 0
        ? `₹${selectedBooking.tollAmount}`
        : "To be added"}
    </span>
  </div>
)}

    {/* ✅ TOTAL */}
    <div className="flex justify-between font-bold border-t pt-3 mt-3 text-lg">
      <span>Total</span>
      <span>₹{selectedBooking.totalAmount}</span>
    </div>

  </div>
</div>
   

      </div>

      {/* FOOTER (STICKY + PROFESSIONAL) */}
      <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white">

        {getStatus(selectedBooking) === "Cancelled" && (
          <span className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm">
            Cancelled
          </span>
        )}
        {getStatus(selectedBooking) === "Rejected" && (
  <span className="px-4 py-2 bg-red-200 text-red-700 rounded-lg text-sm">
    Rejected
  </span>
)}

        {getStatus(selectedBooking) === "Completed" && (
          <span className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm">
            Completed
          </span>
        )}

        {getStatus(selectedBooking) !== "Cancelled" &&
          getStatus(selectedBooking) !== "Completed" &&
          getStatus(selectedBooking) !== "Rejected" &&
          (
            <>
              <button
                onClick={() => handleDelete(selectedBooking._id)}
                className="bg-black text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleStartRide}
                className="bg-orange-400 text-white px-4 py-2 rounded-lg"
              >
                Start Ride
              </button>
            </>
        )}
        {getStatus(selectedBooking) === "Rejected" && (
  <span className="px-4 py-2 bg-red-200 text-red-700 rounded-lg text-sm">
    Rejected
  </span>
)}

        <button
          onClick={() => setSelectedBooking(null)}
          className="px-4 py-2 border rounded-lg"
        >
          Close
        </button>

      </div>

    </div>
  </div>
)}
</>
);



}