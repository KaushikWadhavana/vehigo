import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  Trash2,
} from "lucide-react";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("user");
  const [sort, setSort] = useState("new");
  const [date, setDate] = useState("all");
  const [menuOpen, setMenuOpen] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchCustomers = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await axios.get(
      "http://localhost:5000/api/admin/customers",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, sort, role, date },
      }
    );

    setCustomers(res.data);
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers();
  }, [search, sort, role, date]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
      setMenuOpen(null);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ================= DELETE ================= */
  const deleteUser = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete user?",
      text: "This will remove the user",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    const token = await auth.currentUser.getIdToken();

    await axios.delete(
      `http://localhost:5000/api/admin/customers/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    fetchCustomers();
  };

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  /* ================= SEARCH ================= */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = customers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(value.toLowerCase()) ||
          c.email?.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">

      {/* HEADER */}
     <div className="max-w-8xl mx-auto mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Customers
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          <Link to="/admin" className="hover:text-black">
            Home
          </Link>
          <span className="mx-2">›</span>
          Customers
        </p>
      </div>

      <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* TOP BAR */}
        <div className="flex justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">All Customers</h2>
{/* ROLE FILTER BUTTONS */}
<div className="flex border rounded-lg overflow-hidden">
  <button
    onClick={() => setRole("user")}
    className={`px-4 py-2 text-sm ${
      role === "user"
        ? "bg-teal-600 text-white"
        : "bg-white text-gray-600"
    }`}
  >
    Renter
  </button>

  <button
    onClick={() => setRole("owner")}
    className={`px-4 py-2 text-sm ${
      role === "owner"
        ? "bg-teal-600 text-white"
        : "bg-white text-gray-600"
    }`}
  >
    Owner
  </button>
</div>
          <div className="flex gap-2 flex-wrap">

            {/* SEARCH */}
            <div className="relative" ref={suggestionRef}>
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

              <input
                placeholder="Search..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-3 py-2 border rounded-lg"
              />

              {showSuggestions && (
                <div className="absolute mt-1 w-full bg-white border rounded-lg shadow z-50">

                  {suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <div
                        key={s._id}
                        onClick={() => {
                          setSearch(s.name);
                          setShowSuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      >
                        <img
                          src={
                            s.profileImage ||
                            `https://ui-avatars.com/api/?name=${s.name}`
                          }
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">{s.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-gray-400">
                      No results
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* DATE */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
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
            All Customers ({customers.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">

              <thead className="border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Joined</th>
                </tr>
              </thead>

              <tbody>
                {currentCustomers.map((c) => {
                  const image =
                    c.profileImage ||
                    `https://ui-avatars.com/api/?name=${c.name}`;

                  return (
                    <tr key={c._id} className="border-b hover:bg-gray-100">

                      {/* CUSTOMER */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={image}
                            className="w-12 h-12 rounded-lg object-cover"
                          />

                          <div>
                            <p className="font-semibold text-gray-800">
                              {c.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {c.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="p-3">{c.email}</td>

                      {/* ROLE */}
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            c.role === "owner"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {c.role === "owner" ? "Owner" : "Renter"}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="p-3 text-xs">
                        {new Date(c.createdAt).toDateString()}
                      </td>

                      {/* ACTION */}
                
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">

            <p>
              Showing {indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, customers.length)} of {customers.length}
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