import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { MoreVertical, Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPayments() {
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
    const token = await auth.currentUser.getIdToken();

const bookingRes = await axios.get(
  "http://localhost:5000/api/bookings/admin-payments",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const reservationRes = await axios.get(
  "http://localhost:5000/api/reservations/admin-payments",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

// ✅ GET RESERVATION ARRAY
const reservationData = reservationRes.data.data || [];

// ✅ FORMAT RESERVATION SAME AS BOOKING
const formattedReservations = reservationData.map((r) => ({
  transactionId: r.transactionId,
  name: r.userName,
  image: r.userImage,
  amount: r.amount,
  method: r.method,
  date: r.date,
  status: r.paymentStatus, // 🔥 IMPORTANT
  type: "reservation",
}));

// ✅ FINAL MERGE
const finalData = [
  ...bookingRes.data,
  ...formattedReservations
].sort((a, b) => new Date(b.date) - new Date(a.date));

setPayments(finalData);
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
          p.name?.toLowerCase().includes(value.toLowerCase()) ||
          p.transactionId?.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  /* ================= FILTER + SORT ================= */
  const filtered = payments
    .filter((p) => {
      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    })
    .filter((p) => {
      if (!search) return true;
      return (
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(search.toLowerCase())
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
      case "Completed":
        return "bg-green-100 text-green-600";
      case "Pending":
        return "bg-blue-100 text-blue-600";
      case "Refunded":
        return "bg-purple-100 text-purple-600";
      case "Failed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">


<div className="max-w-8xl mx-auto mb-4">

  <div className="sticky top-0 z-10 bg-gray-100 pb-3">

    {/* TITLE */}
    <h1 className="text-2xl font-semibold text-gray-800">
      Payments
    </h1>

    {/* BREADCRUMB */}
    <div className="flex items-center text-sm text-gray-500 mt-1">
      <span
        onClick={() => navigate("/owner")}
        className="cursor-pointer hover:text-gray-800 transition"
      >
        Home
      </span>

      <span className="mx-2 text-gray-400">›</span>

      <span className="text-gray-600">
        Payments
      </span>
    </div>

  </div>

</div>
      <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* TOP BAR */}
        <div className="flex justify-between mb-6 flex-wrap gap-3">

          <h2 className="text-2xl font-semibold">
            All Payments
          </h2>

          <div className="flex gap-2 flex-wrap">

            {/* SEARCH */}
            <div className="relative" ref={suggestionRef}>
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

              <input
                placeholder="Search transaction / user..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-3 py-2 border rounded-lg"
              />

              {showSuggestions && (
<div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 overflow-hidden">

                  {suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
           <div
  key={i}
  onClick={() => {
    setSearch(s.name);
    setShowSuggestions(false);
  }}
  className="flex items-center gap-3 px-3 py-2 cursor-pointer 
  hover:bg-gray-100 transition"
>

  {/* IMAGE */}
  <img
    src={
      s.image ||
      `https://ui-avatars.com/api/?name=${s.name}&background=0D8ABC&color=fff`
    }
    className="w-8 h-8 rounded-full object-cover border"
  />

  {/* TEXT */}
  <div className="flex flex-col">

    {/* NAME */}
    <span className="text-sm font-medium text-gray-800">
      {s.name}
    </span>

    {/* TRANSACTION */}
    <span className="text-xs text-gray-500">
      {s.transactionId}
    </span>

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
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
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

        {/* TABLE CARD */}
        <div className="bg-gray-50 border rounded-xl p-4">

          <h3 className="font-semibold mb-4">
            All Payments ({filtered.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">

              <thead className="border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">Transaction</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {current.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-gray-100">

<td className="p-3 font-medium max-w-[180px]">
  <div className="truncate">
  {p.transactionId}
</div>

{/* ✅ TYPE BADGE */}
<div className="mt-1">
  {p.type === "reservation" && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
      Reservation
    </span>
  )}

  {!p.type && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600">
      Booking
    </span>
  )}
</div>
</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
<img
  src={
    p.image ||
    `https://ui-avatars.com/api/?name=${p.name}`
  }
  className="w-10 h-10 rounded-full object-cover border"
/>
                        <p className="font-semibold text-gray-800">
                          {p.name}
                        </p>
                      </div>
                    </td>

                    <td className="p-3 font-semibold">
                      ₹{p.amount}
                    </td>

                    <td className="p-3 capitalize">
                      {p.method}
                    </td>

                    <td className="p-3 text-xs">
                      {new Date(p.date).toDateString()}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${getStatusStyle(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </td>



                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">

            <p>
              Showing{" "}
              {filtered.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}{" "}
              to {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
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
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
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