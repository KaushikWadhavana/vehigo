import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { Search, ArrowUpDown, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminOwnerPayments() {

  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FETCH ================= */
  const fetchData = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await axios.get(
      "http://localhost:5000/api/owner/payments",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setData(res.data);
  };

  useEffect(() => {
    fetchData();
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
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = data
      .filter(
        (d) =>
          d.name?.toLowerCase().includes(value.toLowerCase()) ||
          d.payment?.paymentId?.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  /* ================= FILTER ================= */
  const filtered = data
    .filter((d) => d.payment?.paymentId)
    .filter((d) => {
      if (!search) return true;
      return (
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.payment?.paymentId?.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sort === "old")
        return new Date(a.payment?.paidAt) - new Date(b.payment?.paidAt);
      return new Date(b.payment?.paidAt) - new Date(a.payment?.paidAt);
    });

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const current = filtered.slice(indexOfLast - itemsPerPage, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* ================= STATUS STYLE ================= */
  const getStatus = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-600";
      case "pending":
        return "bg-blue-100 text-blue-600";
      case "failed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">

      {/* HEADER */}
    <div className="max-w-8xl mx-auto mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Owner Payments
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          <span
            onClick={() => navigate("/admin")}
            className="cursor-pointer hover:text-black"
          >
            Home
          </span>
          <span className="mx-2">›</span>
          Owner Payments
        </p>
      </div>

      <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* TOP BAR */}
        <div className="flex justify-between mb-6 flex-wrap gap-3">

          <h2 className="text-2xl font-semibold">
            All Owner Payments
          </h2>

          <div className="flex gap-2">

            {/* SEARCH */}
            <div className="relative" ref={suggestionRef}>
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

              <input
                placeholder="Search name / payment id..."
                value={search}
                onChange={handleSearch}
                className="pl-9 pr-3 py-2 border rounded-lg"
              />

              {showSuggestions && (
                <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 overflow-hidden">

       {suggestions.length > 0 ? (

  suggestions.map((s) => (
    <div
      key={s._id}
      onClick={() => {
        setSearch(s.name);
        setShowSuggestions(false);
      }}
      className="flex items-center gap-3 px-3 py-2 cursor-pointer 
      hover:bg-gray-100 transition"
    >

      <img
        src={
          s.image ||
          `https://ui-avatars.com/api/?name=${s.name}&background=0D8ABC&color=fff`
        }
        className="w-8 h-8 rounded-full object-cover border"
      />

      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {s.name}
        </span>

        <span className="text-xs text-gray-500">
          {s.payment?.paymentId}
        </span>
      </div>

    </div>
  ))

) : (

  <div className="px-4 py-4 text-center">

    <p className="text-sm font-medium text-gray-500">
      No matching owners found
    </p>


  </div>

)}
                </div>
              )}
            </div>

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
    All Owner Payments ({filtered.length})
  </h3>

  <div className="overflow-x-auto">
    <table className="min-w-[1000px] w-full text-sm">

      {/* HEADER */}
      <thead className="border-b text-gray-600">
        <tr>
          <th className="p-3 text-left">Owner</th>
          <th className="p-3 text-left">Payment ID</th>
          <th className="p-3 text-left">Order ID</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Status</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {current.map((d) => (
          <tr key={d._id} className="border-b hover:bg-gray-100 transition">

            {/* OWNER */}
            <td className="p-3">
              <div className="flex items-center gap-3">

                <img
                  src={
                    d.image ||
                    `https://ui-avatars.com/api/?name=${d.name}&background=0D8ABC&color=fff`
                  }
                  className="w-11 h-11 rounded-full object-cover border"
                />

                <div>
                  <p className="font-semibold text-gray-800">
                    {d.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {d.email}
                  </p>
                </div>

              </div>
            </td>

            {/* PAYMENT ID */}
            <td className="p-3 font-medium text-gray-700">
              {d.payment?.paymentId}
            </td>

            {/* ORDER ID */}
            <td className="p-3 text-gray-600">
              {d.payment?.orderId}
            </td>

            {/* AMOUNT */}
            <td className="p-3 font-semibold text-gray-800">
              ₹{d.payment?.amount}
            </td>

            {/* DATE */}
            <td className="p-3 text-xs text-gray-500">
              {d.payment?.paidAt
                ? new Date(d.payment.paidAt).toDateString()
                : "-"}
            </td>

            {/* STATUS */}
            <td className="p-3">
              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  d.payment?.status === "success"
                    ? "bg-green-100 text-green-600"
                    : d.payment?.status === "pending"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {d.payment?.status}
              </span>
            </td>

            {/* ACTION */}

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