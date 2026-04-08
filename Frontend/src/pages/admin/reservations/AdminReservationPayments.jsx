import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../../firebase";
import { MoreVertical, Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { XCircle,
  CheckCircle,
  ChevronRight,
 } from "lucide-react";
export default function AdminReservationPayments(){
      const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const [statusFilter, setStatusFilter] = useState("all");

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  /* ================= FETCH ================= */
  const fetchPayments = async () => {
 

const uid = auth.currentUser.uid;

const res = await axios.get(
  `http://localhost:5000/api/reservations/owner/${uid}`
);
    setPayments(res.data);
  };

  useEffect(() => {
    fetchPayments();
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
useEffect(() => {
  setCurrentPage(1);
}, [sort, search, statusFilter]);
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
        p.customer?.name?.toLowerCase().includes(value.toLowerCase()) ||
`${p.vehicle?.brand} ${p.vehicle?.model}`
  ?.toLowerCase()
  .includes(value.toLowerCase())
     )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  /* ================= FILTER + SORT ================= */
  const filtered = payments
    .filter((p) => {
      if (statusFilter === "all") return true;
      return (p.payment?.status || "") === statusFilter;
    })
    .filter((p) => {
      if (!search) return true;
      return (
p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
`${p.vehicle?.brand} ${p.vehicle?.model}`
  ?.toLowerCase()
  .includes(search.toLowerCase())
 );
    })
.sort((a, b) => {
  const d1 = a.payment?.paymentDate
    ? new Date(a.payment.paymentDate).getTime()
    : a.createdAt
    ? new Date(a.createdAt).getTime()
    : 0;

  const d2 = b.payment?.paymentDate
    ? new Date(b.payment.paymentDate).getTime()
    : b.createdAt
    ? new Date(b.createdAt).getTime()
    : 0;

  if (sort === "old") return d1 - d2; // oldest first
  return d2 - d1; // newest first
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
        return "bg-blue-100 text-blue-600";
      case "Refunded":
        return "bg-purple-100 text-purple-600";
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

    case "Rejected":   // ✅ ADD THIS
      return "bg-red-200 text-red-700";

    case "Upcoming":
      return "bg-blue-100 text-blue-600";

    case "In Progress":
      return "bg-yellow-100 text-yellow-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};
  
  return (
    <div className="bg-gray-100 min-h-screen p-6">

 

{/* HEADER */}
<div className="max-w-7xl mx-auto mb-6">

  <div className="bg-white rounded-2xl shadow-sm border px-6 py-5 text-center">

    {/* TITLE */}
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
      Reservation Payments
    </h1>

    {/* SUBTITLE */}
    <p className="text-sm text-gray-500 mt-1">
      Manage and track all user transactions easily
    </p>

    {/* BREADCRUMB */}
    <div className="flex justify-center items-center gap-2 mt-3 text-sm">
      <span
        onClick={() => navigate("/admin")}
        className="cursor-pointer text-gray-500 hover:text-gray-800 transition"
      >
        Home
      </span>

      <span className="text-gray-300">•</span>

      <span className="text-gray-700 font-medium">
        Reservation Payments
      </span>
    </div>

    {/* OPTIONAL LINE */}
    <div className="mt-4 h-[1px] bg-gray-100 w-full"></div>

  </div>

</div>
<div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* TOP BAR */}
<div className="flex flex-col gap-4 mb-6">

<h2 className="text-2xl font-semibold">All Payments</h2>

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

              {showSuggestions && (
                <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 overflow-hidden">

                  {suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSearch(s.customer?.name || `${s.vehicle?.brand} ${s.vehicle?.model}`);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <img
                          src={s.customer?.image || s.vehicle?.image}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {s.customer?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.vehicle?.brand} {s.vehicle?.model}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-gray-400 text-center">
                      No matching payments found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
className="px-4 py-3 border rounded-xl text-sm"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
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
        </div>

        {/* TABLE */}
<div className="bg-gray-50 border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">
            All Payments ({filtered.length})
          </h3>

          <div className="overflow-x-auto">
<table className="min-w-[1100px] w-full text-sm">

              <thead className="border-b text-gray-600">
                <tr>
<th className="p-3 text-left whitespace-nowrap">Vehicle</th>
<th className="p-3 text-left whitespace-nowrap">User</th>
<th className="p-3 text-left whitespace-nowrap">Amount</th>
<th className="p-3 text-left whitespace-nowrap">Method</th>
<th className="p-3 text-left whitespace-nowrap">Date</th>
<th className="p-3 text-left whitespace-nowrap">Payment</th>
<th className="p-3 text-left whitespace-nowrap">Reservation</th>             </tr>
              </thead>

              <tbody>
                {current.map((p, i) => (
<tr key={i} className="border-b hover:bg-gray-100 h-[70px]">

  {/* VEHICLE */}
  <td className="p-3 whitespace-nowrap">
<div className="flex items-center gap-3 min-w-[260px]">      <img
        src={p.vehicle?.image}        className="w-12 h-12 rounded-lg object-cover shrink-0"
      />
      <div>
<p className="font-medium">
  {p.vehicle?.brand || "Vehicle"} {p.vehicle?.model || ""}
</p>

<p className="text-xs text-gray-500">
  {p.vehicle?.category || "Category"}
</p>
      </div>
    </div>
  </td>

  {/* USER */}
  <td className="p-3 whitespace-nowrap">
<div className="flex items-center gap-3 min-w-[200px]">     
    <img
  src={
    p.customer?.image ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  }
  className="w-10 h-10 rounded-full object-cover border"
/>

<p className="font-semibold text-gray-800">
  {p.customer?.name || "Unknown User"}
</p>

    </div>
  </td>

  {/* AMOUNT */}
  <td className="p-3 font-semibold whitespace-nowrap">
₹{p.pricing?.total || p.totalAmount}
  </td>

  {/* METHOD */}
  <td className="p-3 capitalize whitespace-nowrap">
{p.payment?.method || "Not Selected"}
  </td>

  {/* DATE */}
  <td className="p-3 text-xs whitespace-nowrap">
{p.payment?.paymentDate
  ? new Date(p.payment.paymentDate).toLocaleDateString("en-IN")
  : p.payment?.method === "pickup"
  ? "At Pickup"
  : "Not Paid"}
  </td>

  {/* PAYMENT STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">    
    <span
  className={`px-3 py-1 text-xs rounded-full ${
    p.payment?.status === "Paid"
      ? "bg-green-100 text-green-600"
      : p.payment?.method === "pickup"
      ? "bg-blue-100 text-blue-600"
      : "bg-gray-100 text-gray-500"
  }`}
>
  {!p.payment?.method && "Not Selected"}

  {p.payment?.method === "razorpay" &&
    p.payment?.status === "Paid" &&
    "Paid Online"}

  {p.payment?.method === "pickup" &&
    (p.payment?.status === "Paid"
      ? "Paid at Pickup"
      : "Pay at Pickup")}
</span>

  </td>

  {/* BOOKING STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">
<span
  className={`px-3 py-1 text-xs rounded-full ${
    p.status === "completed"
      ? "bg-green-100 text-green-600"
      : p.status === "in_rental"
      ? "bg-yellow-100 text-yellow-600"
      : p.status === "upcoming"
      ? "bg-blue-100 text-blue-600"
      : "bg-gray-100 text-gray-600"
  }`}
>
  {p.status === "in_rental" ? "In Rental" : p.status}
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