import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { MoreVertical, Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserBookingPayment() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const [statusFilter, setStatusFilter] = useState("all");

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
const [ownerRequest, setOwnerRequest] = useState(null);

  const navigate = useNavigate();

  /* ================= FETCH ================= */
const fetchPayments = async () => {
  const token = await auth.currentUser.getIdToken();

  // ✅ BOOKING PAYMENTS
  const bookingRes = await axios.get(
    "${import.meta.env.VITE_API_URL}/api/bookings/my-bookings",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // ✅ OWNER REQUEST PAYMENTS (NEW API)
  const ownerRes = await axios.get(
    "${import.meta.env.VITE_API_URL}/api/owner/my-payment",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const reservationRes = await axios.get(
  "${import.meta.env.VITE_API_URL}/api/reservations/my-payments",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

  /* ================= TRANSFORM BOOKING ================= */
  const bookingData = bookingRes.data.map((b) => ({
    type: "booking",

    vehicleName: b.name,
    vehicleModel: "",
    vehicleImage: b.image,

    userName: b.userName,
    userImage: "",

    amount: b.payment?.amount,
    method: b.payment?.method,

    paymentStatus: b.payment?.status,
bookingStatus:
  b.status === "Cancelled"
    ? "Cancelled"
    : b.status === "Rejected"   // ✅ ADD THIS LINE
    ? "Rejected"
    : new Date() < new Date(b.pickupDate)
    ? "Upcoming"
    : new Date() >= new Date(b.pickupDate) &&
      new Date() <= new Date(b.returnDate)
    ? "In Progress"
    : "Completed",

    date: b.createdAt,
  }));

  /* ================= TRANSFORM OWNER ================= */
  const ownerData = ownerRes.data.map((r) => ({
    type: "owner",

    vehicleName: "Owner Account",
    vehicleModel: "Upgrade",
    vehicleImage: "/logo.png",

    userName: r.name,
    userImage: r.image,

    amount: r.payment?.amount,
    method: "online",

    paymentStatus: r.payment?.status,
    bookingStatus: r.status,

    date: r.payment?.paidAt || r.createdAt,
  }));
/* ================= TRANSFORM RESERVATION ================= */
const reservationData = reservationRes.data.map((r) => ({
  type: "reservation",

  vehicleName: r.vehicleName,
  vehicleModel: r.vehicleModel,
  vehicleImage: r.vehicleImage,

  userName: r.userName,
  userImage: "",

  amount: r.amount,
  method: r.method,

  paymentStatus: r.paymentStatus,

  bookingStatus:
    r.bookingStatus === "pending"
      ? "Pending"
      : r.bookingStatus === "upcoming"
      ? "Upcoming"
      : r.bookingStatus === "in_rental"
      ? "In Progress"
      : "Completed",

  date: r.date,
}));
  /* ================= MERGE + SORT ================= */
const finalData = [
  ...ownerData,
  ...bookingData,
  ...reservationData // 🔥 IMPORTANT
].sort((a, b) => new Date(b.date) - new Date(a.date));
  setPayments(finalData);
};
  useEffect(() => {
    fetchPayments();
  }, []);
useEffect(() => {
  const fetchOwner = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await axios.get(
        "${import.meta.env.VITE_API_URL}/api/owner/my-request",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOwnerRequest(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  fetchOwner();
}, []);
  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ================= SEARCH ================= */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = payments
      .filter(
        (p) =>
          p.vehicleName?.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };
      const normalizeStatus = (status) => {
  if (!status) return "Pending";
  if (status.toLowerCase() === "success") return "Paid";
  if (status.toLowerCase() === "pending") return "Pending";
  if (status.toLowerCase() === "failed") return "Failed";
  return status;
};
  /* ================= FILTER + SORT ================= */
  const filtered = payments
    .filter((p) => {
      if (statusFilter === "all") return true;

if (statusFilter === "Rejected") {
  return p.bookingStatus === "Rejected";
}

return normalizeStatus(p.paymentStatus) === statusFilter;
    })
    .filter((p) => {
      if (!search) return true;
      return (
        p.vehicleName?.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sort === "old") return new Date(a.date) - new Date(b.date);
      return new Date(b.date) - new Date(a.date);
    });

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const current = filtered.slice(indexOfLast - itemsPerPage, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* ================= STATUS STYLE ================= */
const getStatusStyle = (status) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-600";

    case "Pending":
      return "bg-yellow-100 text-yellow-600"; // 🔥 better than blue

    case "Refunded":
      return "bg-blue-100 text-blue-600"; // ✅ UPDATED (professional)

    case "Failed":
      return "bg-red-100 text-red-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};
const getBookingStyle = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-600";
    case "Cancelled":
      return "bg-red-100 text-red-600";
      case "Rejected":
  return "bg-red-200 text-red-700"; // ✅ ADD HERE
    case "Upcoming":
      return "bg-blue-100 text-blue-600";
    case "In Progress":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};
  
const handleOwnerPayment = async () => {
  try {

    const token = await auth.currentUser.getIdToken();

    // CREATE ORDER
    const { data: order } = await axios.post(
      "${import.meta.env.VITE_API_URL}/api/owner/payment/create-order",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const options = {
      key: "YOUR_RAZORPAY_KEY",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,

      handler: async function (response) {
        await axios.post(
          "${import.meta.env.VITE_API_URL}/api/owner/payment/verify",
          response,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert("Payment Successful ✅");
        fetchPayments();
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error(err);
    alert("Payment failed ❌");
  }
};

  return (
    <div className="bg-gray-100 min-h-screen p-6">


<div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* TOP BAR */}
<div className="flex flex-col gap-4 mb-6">

<h2 className="text-2xl font-semibold">All Payments</h2>

<div className="flex gap-3 flex-wrap items-center justify-between w-full">

  {/* LEFT SIDE (SEARCH + FILTERS) */}
  <div className="flex gap-3 flex-wrap items-center">

    {/* SEARCH */}
    <div className="relative" ref={suggestionRef}>
      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

      <input
        placeholder="Search user / vehicle..."
        value={search}
        onChange={handleSearchChange}
        className="pl-10 pr-4 py-3 border rounded-xl w-80 text-sm"
      />
    </div>

    {/* STATUS */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-4 py-3 border rounded-xl text-sm"
    >
      <option value="all">All Status</option>
      <option value="Paid">Paid</option>
      <option value="Pending">Pending</option>
      <option value="Refunded">Refunded</option>
      <option value="Rejected">Rejected</option>
    </select>

    {/* SORT */}
    <div className="relative">
      <ArrowUpDown className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="pl-9 pr-3 py-2 border rounded-lg"
      >
        <option value="new">Newest</option>
        <option value="old">Oldest</option>
      </select>
    </div>
  </div>

  {/* 🔥 RIGHT SIDE BUTTON */}
  {ownerRequest?.status === "approved" && !ownerRequest?.isActivated && (
    <button
      onClick={() => handleOwnerPayment()}
      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
    >
      ⚡ Pay Owner Upgrade
    </button>
  )}

</div>
        </div>

        {/* TABLE */}
<div className="bg-gray-50 border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">
            All Payments ({filtered.length})
          </h3>

          <div className="overflow-x-auto">
<table className="min-w-[900px] w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
<th className="px-4 py-3 text-left min-w-[140px]">Vehicle</th>
<th className="p-3 text-left whitespace-nowrap">Amount</th>
<th className="p-3 text-left whitespace-nowrap">Method</th>
<th className="p-3 text-left whitespace-nowrap">Date</th>
<th className="p-3 text-left whitespace-nowrap">Payment</th>
<th className="p-3 text-left whitespace-nowrap">Booking</th>        
     </tr>
              </thead>

              <tbody>
                {current.map((p, i) => (
<tr key={i} className="border-b hover:bg-gray-100">

  {/* VEHICLE */}
  <td className="p-3 whitespace-nowrap">
<div className="flex gap-2 items-center min-w-[140px]">
          <img
      src={p.vehicleImage}
className="w-16 h-14 rounded-md object-cover shrink-0"      />
      <div>
<p className="font-medium text-gray-800">
              {p.vehicleName}
        </p>
           <p className="text-xs text-gray-500">
                            {p.method}
                          </p>
        
  <p className="text-xs text-gray-500">
  {p.type === "owner"
  ? "Owner Upgrade"
  : p.type === "reservation"
  ? "Reservation"
  : p.vehicleModel}

  {p.type === "owner" && (
    <>
      <span className="text-gray-400">•</span>
      <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-600">
        Owner
      </span>
    </>
  )}
</p>
      </div>
    </div>
  </td>

  
  {/* AMOUNT */}
<td className="px-2 py-2 font-semibold whitespace-nowrap">    ₹{p.amount}
  </td>

  {/* METHOD */}
  <td className="p-3 capitalize whitespace-nowrap">
    {p.method}
  </td>

  {/* DATE */}
  <td className="p-3 text-xs whitespace-nowrap">
    {new Date(p.date).toDateString()}
  </td>

  {/* PAYMENT STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">  
    <span
className={`px-3 py-1 text-xs rounded-full ${getStatusStyle(
  normalizeStatus(p.paymentStatus)
)}`}
>
  {normalizeStatus(p.paymentStatus)}
</span>
  </td>

  {/* BOOKING STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">
        <span
      className={`px-3 py-1 text-xs rounded-full inline-block ${getBookingStyle(
        p.bookingStatus
      )}`}
    >
      {p.type === "owner"
  ? "-"
  : p.bookingStatus === "Rejected"
  ? "❌ Rejected"
  : p.bookingStatus}
    </span>
  </td>

</tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* PAGINATION */}
 <div className="flex justify-between items-center mt-6 text-sm text-gray-600">

  {/* LEFT TEXT */}
  <p>
    Showing{" "}
    {filtered.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1}{" "}
    to {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
    {filtered.length}
  </p>

  {/* RIGHT BUTTONS */}
  <div className="flex items-center gap-2">

    {/* PREV */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className={`px-4 py-1 rounded-lg border ${
        currentPage === 1
          ? "text-gray-400 border-gray-200 cursor-not-allowed"
          : "hover:bg-gray-100"
      }`}
    >
      Prev
    </button>

    {/* PAGE NUMBERS */}
    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`w-8 h-8 rounded-md ${
          currentPage === i + 1
            ? "bg-teal-600 text-white"
            : "border hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    {/* NEXT */}
    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className={`px-4 py-1 rounded-lg border ${
        currentPage === totalPages
          ? "text-gray-400 border-gray-200 cursor-not-allowed"
          : "hover:bg-gray-100"
      }`}
    >
      Next
    </button>

  </div>
</div>

        </div>
      </div>
    </div>
  );
}