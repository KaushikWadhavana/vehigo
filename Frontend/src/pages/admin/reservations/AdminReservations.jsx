import { useEffect, useState } from "react";
import { auth } from "../../../firebase";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Filter,
  MapPin,
  User,
  Car,
  Clock,
  ArrowUpDown,
  Home,
} from "lucide-react";
import Swal from "sweetalert2";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("desc"); // latest
  const [openMenu, setOpenMenu] = useState(null);

  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropOptions, setDropOptions] = useState([]);
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const [showPickupOptions, setShowPickupOptions] = useState(false);
  const [showDropOptions, setShowDropOptions] = useState(false);
const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectId, setRejectId] = useState(null);
const [rejectReason, setRejectReason] = useState("");
const [rejectError, setRejectError] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const navigate = useNavigate();

const handleView = (r) => {

  if (r.approvalStatus === "approved") {
    Swal.fire("Already Approved","This is already approved","warning");
    return;
  }

  if (r.approvalStatus === "rejected") {
    Swal.fire("Rejected","This request is rejected","error");
    return;
  }

navigate("/admin/reservations/new", {
  state: { reservation: r }
});
};
  useEffect(() => {
    const closeMenus = (e) => {
      if (!e.target.closest(".menu-container")) {
        setOpenMenu(null);
      }

      if (!e.target.closest(".search-container")) {
        setShowSearchSuggestions(false);
      }

      if (!e.target.closest(".sort-container")) {
        setShowSort(false);
      }
    };

    document.addEventListener("click", closeMenus);

    return () => document.removeEventListener("click", closeMenus);
  }, []);

  useEffect(() => {
    const loadLocations = async () => {

const uid = auth.currentUser.uid;

const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/reservations/locations/${uid}`
);
  const data = await res.json();

  setPickupOptions(data.pickupLocations || []);
  setDropOptions(data.dropLocations || []);
};

    const loadReservations = async () => {
 
      const params = new URLSearchParams({
        status,
        pickupLocation,
        dropLocation,
        startDate,
        endDate,
        sort,
        search,
      });

 const token = await auth.currentUser.getIdToken();

const uid = auth.currentUser.uid;

const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/reservations/owner/${uid}?${params}`
);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReservations(data);
      } else {
        setReservations([]);
      }
    };

    loadLocations();
    loadReservations();
}, [status, pickupLocation, dropLocation, startDate, endDate, sort, search]);
  const getSuggestions = (value) => {
    if (!value) {
      setSearchSuggestions([]);
      return;
    }

    const term = value.toLowerCase();

    const suggestions = reservations
      .filter((r) => {
        const vehicle = `${r.vehicle?.brand} ${r.vehicle?.model}`.toLowerCase();
        const customer = `${r.customer?.name}`.toLowerCase();
        const pickup = `${r.pickup?.location}`.toLowerCase();
        const drop = `${r.drop?.location}`.toLowerCase();

        return (
          vehicle.includes(term) ||
          customer.includes(term) ||
          pickup.includes(term) ||
          drop.includes(term)
        );
      })
      .slice(0, 5);

    setSearchSuggestions(suggestions);
  };
  // ✅ FILTER + SORT (CLIENT SIDE)
const filteredReservations = reservations
  .filter((r) => {
    const term = search.toLowerCase();

    const matchSearch =
      !search ||
      `${r.vehicle?.brand} ${r.vehicle?.model}`
        .toLowerCase()
        .includes(term) ||
      r.customer?.name?.toLowerCase().includes(term) ||
      r.pickup?.location?.toLowerCase().includes(term) ||
      r.drop?.location?.toLowerCase().includes(term);

    const matchStatus = !status || r.approvalStatus === status;

    const matchPickup =
      !pickupLocation ||
r.pickup?.location
  ?.toLowerCase()
  .trim()
  .includes(pickupLocation.toLowerCase().trim());

    const matchDrop =
      !dropLocation ||
  r.drop?.location
  ?.toLowerCase()
  .trim()
  .includes(dropLocation.toLowerCase().trim());

    const date = new Date(r.pickup?.date);

    const matchStart = !startDate || date >= new Date(startDate);
    const matchEnd = !endDate || date <= new Date(endDate);

    return (
      matchSearch &&
      matchStatus &&
      matchPickup &&
      matchDrop &&
      matchStart &&
      matchEnd
    );
  })
.sort((a, b) => {
  const d1 = new Date(a.createdAt);
  const d2 = new Date(b.createdAt);

  if (sort === "asc") {
    return d1 - d2; // oldest first
  }

  return d2 - d1; // latest first
});
useEffect(() => {
  setCurrentPage(1);
}, [search, status, pickupLocation, dropLocation, startDate, endDate, sort]);
const indexOfLast = currentPage * itemsPerPage;
const currentReservations = filteredReservations.slice(
  indexOfLast - itemsPerPage,
  indexOfLast
);


const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

const submitReject = async () => {

  if (!rejectReason || rejectReason.trim().length < 5) {
    Swal.fire("Validation", "Minimum 5 characters required", "warning");
    return;
  }

  if (rejectReason.length > 250) {
    Swal.fire("Validation", "Maximum 250 characters allowed", "warning");
    return;
  }

  try {
    const token = await auth.currentUser.getIdToken();

    await fetch(`${import.meta.env.VITE_API_URL}/api/reservations/reject/${rejectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: rejectReason })
    });

    Swal.fire("Rejected", "Reservation rejected", "success");

    setShowRejectModal(false);
    setRejectReason("");

    window.location.reload();

  } catch (err) {
    Swal.fire("Error", "Something went wrong", "error");
  }
};


return (
    <div className="w-full px-6 space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar size={22} />
          Reservations
        </h1>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            to="/admin"
            className="hover:text-blue-600 flex items-center gap-1"
          >
            <Home size={14} />
            Home
          </Link>

          <span>›</span>

          <span>Reservations</span>
        </div>
      </div>

      {/* TOOLBAR */}

<div className="bg-white rounded-2xl shadow p-5 space-y-4">

  {/* TITLE */}
  <h2 className="text-xl font-semibold">
    All Reservations ({filteredReservations.length})
  </h2>

  {/* TOP BAR */}
  <div className="flex flex-wrap gap-3 items-center">

    {/* SEARCH */}
    <div className="relative w-80 search-container">
      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

      <input
        placeholder="Search vehicle / user / location..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowSearchSuggestions(true);
          getSuggestions(e.target.value);
        }}
        className="pl-10 pr-4 py-3 border rounded-xl text-sm w-full"
      />

      {showSearchSuggestions && searchSuggestions.length > 0 && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50">
          {searchSuggestions.map((s) => (
            <div
              key={s._id}
              onClick={() => {
                setSearch(`${s.vehicle?.brand} ${s.vehicle?.model}`);
                setShowSearchSuggestions(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <p className="text-sm font-medium">
                {s.vehicle?.brand} {s.vehicle?.model}
              </p>
              <p className="text-xs text-gray-400">
                {s.customer?.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* STATUS */}
    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="px-4 py-3 border rounded-xl text-sm"
    >
   <option value="">All</option>
<option value="pending">Pending</option>
<option value="approved">Approved</option>
<option value="rejected">Rejected</option>
    </select>

    {/* SORT */}
    <div className="relative">
      <ArrowUpDown className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="pl-9 pr-3 py-3 border rounded-xl text-sm"
      >
        <option value="desc">Latest</option>
<option value="asc">Oldest</option>

      </select>
    </div>

    {/* ALL FILTER BUTTON */}
    <button
      onClick={() => setShowAllFilters(!showAllFilters)}
      className="flex items-center gap-2 border px-4 py-3 rounded-xl text-sm hover:bg-gray-50"
    >
      <Filter size={16} />
      All Filters
    </button>

  </div>

  {/* FILTER PANEL */}
{showAllFilters && (
  <div className="border-t pt-4">

    {/* GRID FIX */}
    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4 items-center">

      {/* DATE */}
      <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white w-full max-w-[320px]">
        <Calendar size={16} className="text-gray-400" />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="text-sm outline-none w-full"
        />

        <span className="text-gray-400">-</span>

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="text-sm outline-none w-full"
        />
      </div>

      {/* PICKUP */}
      <div className="relative w-full max-w-[350px]">
        <input
          placeholder="Pickup location"
          value={pickupLocation}
          onFocus={() => setShowPickupOptions(true)}
          onChange={(e) => {
            setPickupLocation(e.target.value);
            setShowPickupOptions(true);
          }}
          className="w-full px-4 py-2 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-orange-400 outline-none"
        />

        {showPickupOptions && pickupLocation && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-xl shadow z-50 max-h-40 overflow-y-auto">
            {pickupOptions
              .filter((loc) =>
                loc.toLowerCase().includes(pickupLocation.toLowerCase())
              )
              .slice(0, 5)
              .map((loc) => (
                <div
                  key={loc}
                  onClick={() => {
                    setPickupLocation(loc);
                    setShowPickupOptions(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  📍 {loc}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* DROP */}
      <div className="relative w-full max-w-[350px]">
        <input
          placeholder="Drop location"
          value={dropLocation}
          onFocus={() => setShowDropOptions(true)}
          onChange={(e) => {
            setDropLocation(e.target.value);
            setShowDropOptions(true);
          }}
          className="w-full px-4 py-2 border rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-orange-400 outline-none"
        />

        {showDropOptions && dropLocation && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-xl shadow z-50 max-h-40 overflow-y-auto">
            {dropOptions
              .filter((loc) =>
                loc.toLowerCase().includes(dropLocation.toLowerCase())
              )
              .slice(0, 5)
              .map((loc) => (
                <div
                  key={loc}
                  onClick={() => {
                    setDropLocation(loc);
                    setShowDropOptions(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  📍 {loc}
                </div>
              ))}
          </div>
        )}
      </div>

    </div>

    {/* CLEAR BUTTON */}
    <div className="mt-3">
      <button
        onClick={() => {
          setSearch("");
          setStatus("");
          setPickupLocation("");
          setDropLocation("");
          setStartDate("");
          setEndDate("");
        }}
        className="text-red-500 text-sm"
      >
        Clear Filters
      </button>
    </div>

  </div>
)}

</div>
      {/* RESERVATION LIST */}

      <div className="bg-gray-50 border rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            {/* HEADER */}
            <thead className="border-b text-gray-600">
              <tr>
               <th className="p-3 text-left w-[25%]">Vehicle</th>
<th className="p-3 text-left w-[20%]">Customer</th>
<th className="p-3 text-center w-[15%]">Pickup</th>
<th className="p-3 text-center w-[15%]">Drop</th>
<th className="p-3 text-center w-[10%]">Approval Status</th>
<th className="p-3 text-center w-[15%]">Action</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    No reservations found
                  </td>
                </tr>
              )}

              {currentReservations.map((r) => {
                const pickupDate = new Date(r.pickup.date);
                const dropDate = new Date(r.drop.date);

                return (
<tr className="border-b hover:bg-gray-50 align-middle">

  {/* VEHICLE */}
  <td className="px-3 py-4 align-middle">
    <div className="flex items-center gap-3 min-w-[240px]">
      <img
        src={r.vehicle?.image}
        className="w-14 h-12 rounded-lg object-cover"
      />
      <div className="leading-tight">
        <p className="font-semibold text-sm">
          {r.vehicle?.brand} {r.vehicle?.model}
        </p>
        <p className="text-xs text-gray-400">
          #{r._id?.slice(-5)}
        </p>
      </div>
    </div>
  </td>

  {/* CUSTOMER */}
  <td className="px-3 py-4 align-middle">
    <div className="flex items-center gap-3 min-w-[240px]">
      <img
       src={
  r.customer?.image ||
  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
}
        className="w-10 h-10 rounded-full"
      />
      <div className="leading-tight">
        <p className="font-semibold text-sm">{r.customer?.name}</p>
        <p className="text-xs text-gray-500">
          {r.customer?.email}
        </p>
        <p className="text-xs text-gray-400">
          {r.customer?.phone}
        </p>
        <p
     className={`text-[10px] ${
  r.createdBy?.role === "admin"
    ? "text-green-600"
    : "text-blue-500"
}`}
        >
   {r.createdBy?.role === "admin"
  ? "Admin Booking"
  : "User Request"}
        </p>
      </div>
    </div>
  </td>

  {/* PICKUP */}
  <td className="px-3 py-4 text-center align-middle">
    <div className="leading-tight">
      <p className="text-sm">{r.pickup?.location}</p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(r.pickup?.date).toLocaleDateString()}
      </p>
    </div>
  </td>

  {/* DROP */}
  <td className="px-3 py-4 text-center align-middle">
    <div className="leading-tight">
      <p className="text-sm">{r.drop?.location}</p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(r.drop?.date).toLocaleDateString()}
      </p>
    </div>
  </td>

  {/* APPROVAL */}
  <td className="px-3 py-4 text-center align-middle">
    <span
      className={`px-3 py-1 text-xs rounded-full inline-block ${
        r.approvalStatus === "approved"
          ? "bg-green-100 text-green-600"
          : r.approvalStatus === "rejected"
          ? "bg-red-100 text-red-600"
          : "bg-yellow-100 text-yellow-600"
      }`}
    >
      {r.approvalStatus}
    </span>
  </td>

  {/* ACTION */}
  <td className="px-3 py-4 text-center align-middle relative menu-container">
    <button
      className="p-1 rounded hover:bg-gray-100"
      onClick={() => setOpenMenu(r._id)}
    >
      <MoreVertical size={18} />
    </button>

    {openMenu === r._id && (
      <div className="absolute right-2 mt-2 w-40 bg-white border rounded-lg shadow z-20">
        <div
          onClick={() => {
            handleView(r);
            setOpenMenu(null);
          }}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          <Eye size={16} className="text-blue-500" />
          View
        </div>

        <div
onClick={() => {

  const isPaidOnline =
    r.payment?.method === "razorpay" &&
    r.payment?.status === "Paid";

  const isPickupPending =
    r.payment?.method === "pickup" &&
    r.payment?.status === "Pending";

  const isApprovalPending =
    r.approvalStatus === "pending";

  // ❌ BLOCK → ONLINE PAID
  if (isPaidOnline) {
    Swal.fire(
      "Not Allowed",
      "User already paid online. You cannot reject this booking.",
      "error"
    );
    return;
  }

  // ⚠️ WARNING → PICKUP SELECTED BUT NOT APPROVED
  if (isPickupPending && isApprovalPending) {
    Swal.fire({
      title: "Not Approved Yet",
      text: "User selected pickup payment and booking is still pending approval.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject Anyway",
    }).then((result) => {
      if (result.isConfirmed) {
        setRejectId(r._id);
        setShowRejectModal(true);
      }
    });

    setOpenMenu(null);
    return;
  }

  // ⚠️ WARNING → ONLY APPROVAL PENDING
  if (isApprovalPending) {
    Swal.fire({
      title: "Pending Approval",
      text: "This booking is not approved yet. Are you sure you want to reject?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject",
    }).then((result) => {
      if (result.isConfirmed) {
        setRejectId(r._id);
        setShowRejectModal(true);
      }
    });

    setOpenMenu(null);
    return;
  }

  // ✅ NORMAL FLOW
  setRejectId(r._id);
  setShowRejectModal(true);
  setOpenMenu(null);
}}
          className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer text-sm"
        >
          ✖ Reject
        </div>
      </div>
    )}
  </td>

</tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-6 text-sm text-gray-600">

  {/* LEFT TEXT */}
  <p>
    Showing{" "}
    {reservations.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1}{" "}
    to {Math.min(currentPage * itemsPerPage, reservations.length)} of{" "}
{filteredReservations.length}
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
        className={`w-8 h-8 rounded-md flex items-center justify-center ${
          currentPage === i + 1
            ? "bg-orange-500 text-white"
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

{showRejectModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[400px] rounded-xl p-5 space-y-4">

      <h2 className="text-lg font-semibold text-red-600">
        Reject Booking
      </h2>

      <textarea
        placeholder="Enter rejection reason..."
        value={rejectReason}
        onChange={(e) => {
          setRejectReason(e.target.value);
          setRejectError("");
        }}
        className="w-full border rounded-lg p-3 text-sm"
        maxLength={250}
      />

      <p className="text-xs text-gray-400">
        {rejectReason.length}/250
      </p>

      {rejectError && (
        <p className="text-xs text-red-500">{rejectError}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason("");
          }}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          Cancel
        </button>

        <button
          onClick={submitReject}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
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
