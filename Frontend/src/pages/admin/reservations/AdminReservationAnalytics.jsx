import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../../firebase";
import {
  MoreVertical,
  Search,
  ArrowUpDown,
  DollarSign,
  Package,
  Car,
  Bike,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";


import { CartesianGrid, YAxis } from "recharts";

export default function AdminReservationAnalytics() {
  const [payments, setPayments] = useState([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const [statusFilter, setStatusFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [monthlyData, setMonthlyData] = useState([]);
const [carData, setCarData] = useState([]);
const COLORS = [
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // orange
  "#3b82f6", // blue
  "#a855f7", // purple
];
const navigate = useNavigate();

  /* ================= FETCH ================= */
  const fetchPayments = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await axios.get(
      "${import.meta.env.VITE_API_URL}E_API_URL}/api/reservations/admin-payments",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
const data = res.data.data.map((r) => ({
  vehicleName: r.vehicleName,
  vehicleModel: "Reservation",
  vehicleImage: r.vehicleImage,

  userName: r.userName,
  userImage: r.userImage,

  addedBy: r.addedBy,

  amount: Number(r.amount) || 0,
  method: r.method,

  paymentStatus: r.paymentStatus,
  bookingStatus: r.bookingStatus,

  date: r.date,
}));

setPayments(data);
setTotalReservations(res.data.totalReservations); // ✅ IMPORTANT
  };
useEffect(() => {
  fetchPayments();
  fetchAnalytics(); // ✅ ADD THIS
}, []);
  const fetchAnalytics = async () => {
  const token = await auth.currentUser.getIdToken();

const [monthlyRes, carRes] = await Promise.all([
  axios.get("${import.meta.env.VITE_API_URL}/api/reservations/analytics/monthly-reservations", {
    headers: { Authorization: `Bearer ${token}` },
  }),
  axios.get("${import.meta.env.VITE_API_URL}/api/reservations/analytics/top-vehicles", {
    headers: { Authorization: `Bearer ${token}` },
  }),
]);

  setMonthlyData(monthlyRes.data);
  setCarData(carRes.data);
};

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
          p.userName?.toLowerCase().includes(value.toLowerCase()) ||
          p.vehicleName?.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  /* ================= FILTER + SORT ================= */
  const filtered = payments
    .filter((p) => {
      if (statusFilter === "all") return true;
      return (p.paymentStatus || p.status) === statusFilter;
    })
    .filter((p) => {
      if (!search) return true;
      return (
        p.userName?.toLowerCase().includes(search.toLowerCase()) ||
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

const now = new Date();

const validPayments = payments.filter((p) => {
  const isPaid =
    (p.method === "razorpay" && p.paymentStatus === "Paid") ||
    (p.method === "pickup" && p.paymentStatus === "Paid");

  const isValid =
    p.bookingStatus !== "Cancelled" &&
    p.bookingStatus !== "Rejected";

  return isPaid && isValid;
});
const totalRevenue = validPayments.reduce(
  (sum, p) => sum + (p.amount || 0),
  0
);

const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
const lastMonth = lastMonthDate.getMonth();
const lastYear = lastMonthDate.getFullYear();

let currentRevenue = 0;
let lastRevenue = 0;

let currentBookings = 0;
let lastBookings = 0;

validPayments.forEach((p) => {
  const d = new Date(p.date);
  const m = d.getMonth();
  const y = d.getFullYear();

  // ✅ CURRENT MONTH
  if (m === currentMonth && y === currentYear) {
    currentRevenue += p.amount;
    currentBookings++;
  }

  // ✅ LAST MONTH (SAFE YEAR FIX)
  if (m === lastMonth && y === lastYear) {
    lastRevenue += p.amount;
    lastBookings++;
  }
});
const calcGrowth = (current, last) => {
  if (last === 0) return current > 0 ? 100 : 0;

  let growth = ((current - last) / last) * 100;

  // ✅ LIMIT TO 100%
  if (growth > 100) growth = 100;
  if (growth < -100) growth = -100;

  return growth;
};
const revenueGrowth = calcGrowth(currentRevenue, lastRevenue);
const bookingGrowth = calcGrowth(currentBookings, lastBookings);

const cleanCarData = carData.filter(
  (c) => c.name && c.value > 0
);
  
const top5Cars = carData
  .filter(c => c.name && c.value > 0)
  .slice(0, 5)
  .map((c, i) => ({
    ...c,
    fill: COLORS[i % COLORS.length] // ✅ attach color
  }));

  const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;   // Crores
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;      // Lakhs
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;        // Thousands
  }
  return `₹${value}`;
};
// ✅ FILTER VALID BOOKINGS (NO Cancelled / Rejected)


const topVehicleName = top5Cars[0]?.name || "N/A";
const topVehicleCount = top5Cars[0]?.value || 0;

let currentVehicleCount = 0;
let lastVehicleCount = 0;

validPayments.forEach((p) => {
  if (p.vehicleName !== topVehicleName) return;

  const d = new Date(p.date);
  const m = d.getMonth();
  const y = d.getFullYear();

  if (m === currentMonth && y === currentYear) {
    currentVehicleCount++;
  }

  if (m === lastMonth && y === lastYear) {
    lastVehicleCount++;
  }
});

// ✅ USE SAME SAFE GROWTH
const vehicleGrowth = calcGrowth(currentVehicleCount, lastVehicleCount);


const formatGrowth = (value) => {
  const val = Math.min(Math.abs(value), 100).toFixed(0); // ✅ max 100

  return {
    text: ` ${value >= 0 ? "+" : "-"}${val}%`,
    color: value >= 0 ? "text-green-600" : "text-red-500",
    icon: value >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>
  };
};
  return (
    <div className="bg-gray-100 min-h-screen p-6">

      {/* HEADER */}
      <div className="max-w-8xl mx-auto mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Reservation Payments
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          <span
            onClick={() => navigate("/owner")}
            className="cursor-pointer hover:text-black"
          >
            Home
          </span>
          <span className="mx-2">›</span>
          Reservation Payments
        </p>
      </div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">

  {/* TOTAL BOOKINGS */}
  <div className="bg-white rounded-2xl p-5 border border-orange-200 border-b-4 border-b-orange-400 shadow-sm hover:shadow-md transition">
    
    <div className="flex justify-between items-center">

      {/* LEFT */}
      <div>
        <p className="text-gray-500 text-sm">Total Reservations</p>

        <div className="flex items-center gap-2 mt-1">
          <h2 className="text-2xl font-bold text-gray-800">
            {totalReservations.toLocaleString()}
          </h2>

            <span className="text-sm text-gray-500">Reservations</span>

          {/* ✅ % LIKE IMAGE */}
          <span className={`flex items-center gap-1 text-sm ${formatGrowth(bookingGrowth).color}`}>
            {formatGrowth(bookingGrowth).icon}
            {formatGrowth(bookingGrowth).text}
          </span>
        </div>
      </div>

      {/* ICON */}
      <div className="w-11 h-11 flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-500">
        <Package size={18} />
      </div>

    </div>
  </div>

  {/* REVENUE */}
  <div className="bg-white rounded-2xl p-5 border border-green-200 border-b-4 border-b-green-400 shadow-sm hover:shadow-md transition">
    
    <div className="flex justify-between items-center">

      {/* LEFT */}
      <div>
        <p className="text-gray-500 text-sm">Revenue Generated</p>

        <div className="flex items-center gap-2 mt-1">
          <h2 className="text-2xl font-bold text-gray-800">
            {formatCurrency(totalRevenue)}
          </h2>

          {/* ✅ % */}
          <span className={`flex items-center gap-1 text-sm ${formatGrowth(revenueGrowth).color}`}>
            {formatGrowth(revenueGrowth).icon}
            {formatGrowth(revenueGrowth).text}
          </span>
        </div>
      </div>

      {/* ✅ RUPEE ICON (REPLACED $) */}
      <div className="w-11 h-11 flex items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 text-lg font-bold">
        ₹
      </div>

    </div>
  </div>

  {/* TOP VEHICLE */}
{/* TOP VEHICLE */}
<div className="bg-white rounded-2xl p-5 border border-green-200 border-b-4 border-b-green-500 shadow-sm hover:shadow-md transition">
  
  <div className="flex justify-between items-center">

    {/* LEFT */}
    <div>
      <p className="text-gray-500 text-sm">Top Rented Vehicle</p>

      <div className="flex items-center gap-2 mt-1">

        {/* NAME + COUNT */}
        <h2 className="text-lg font-semibold text-gray-800">
          {topVehicleName} ({topVehicleCount})
        </h2>

        {/* ✅ % LIKE IMAGE */}
        <span className={`flex items-center gap-1 text-sm ${formatGrowth(vehicleGrowth).color}`}>
          {formatGrowth(vehicleGrowth).icon}
          {formatGrowth(vehicleGrowth).text}
        </span>

      </div>
    </div>

    {/* ICON */}
    <div className="w-11 h-11 flex items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600">
<Car size={18}/>
    </div>

  </div>
</div>

</div>

{/* ================= GRAPHS ================= */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

{/* ================= TOTAL BOOKINGS CHART ================= */}
<div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-500">
        <Package size={18} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">
        Total Reservations
      </h3>
    </div>

    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="w-3 h-3 rounded bg-orange-400"></span>
      Reservations
    </div>
  </div>

  {/* CHART */}
 <div className="w-full flex justify-center">
<div className="w-full h-[350px]">   {/* 🔥 control height here */}
  <ResponsiveContainer width="100%" height="100%">
<BarChart
  data={monthlyData}
  barCategoryGap={30}
  margin={{ top: 0, right: 10, left: 0, bottom: 0 }} // ✅ FIX
>
      {/* GRID (🔥 horizontal lines like image) */}
<CartesianGrid
  strokeDasharray="3 3"
  vertical={false}
  stroke="#e5e7eb"
  strokeOpacity={0.7}   // 🔥 smoother look
/>

      {/* GRADIENT */}
      <defs>
        <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2} />
        </linearGradient>
      </defs>

      {/* X AXIS */}
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: "#6b7280" }}
      />

      {/* Y AXIS */}
<YAxis
  axisLine={false}
  tickLine={false}
  tick={{ fontSize: 12, fill: "#6b7280" }}
  tickFormatter={formatCurrency}   // 🔥 FIX
  tickCount={6}
  domain={[
    0,
    (dataMax) => (dataMax === 0 ? 100 : Math.ceil(dataMax * 1.2))
  ]}
  allowDecimals={false}
/>
      {/* TOOLTIP (🔥 EXACT LIKE IMAGE) */}
<Tooltip
  cursor={{ fill: "rgba(0,0,0,0.05)" }}
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {

      const data = payload[0].payload;

      return (
        <div className="bg-white border rounded-xl shadow-lg overflow-hidden text-xs min-w-[140px]">

          {/* HEADER */}
          <div className="px-3 py-2 bg-gray-100 text-gray-600 font-medium">
            {label}
          </div>

          {/* BOOKINGS */}
          <div className="px-3 py-1.5 flex justify-between items-center">
            <span className="text-gray-500">Reservations</span>
            <span className="font-semibold text-gray-800">
              {data.bookings ?? 0}
            </span>
          </div>

          {/* AMOUNT */}
          <div className="px-3 py-1.5 flex justify-between items-center">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(data.amount ?? 0)}
            </span>
          </div>

        </div>
      );
    }
    return null;
  }}
/>
      {/* BAR */}
<Bar
  dataKey="amount"
  fill="url(#bookingGradient)"
  radius={[20, 20, 0, 0]}
  barSize={40}
  maxBarSize={50}
/>
    </BarChart>
    </ResponsiveContainer>
  </div>
</div>
</div>

{/* ================= DONUT CHART ================= */}
<div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition">

  {/* HEADER WITH ICON */}
  <div className="flex items-center gap-3 mb-4">

    {/* ICON CIRCLE */}
    <div className="w-10 h-10 flex items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600">
      <Car size={18} />
    </div>

    {/* TITLE */}
    <h3 className="text-lg font-semibold text-gray-800">
      Top Vehicles
    </h3>
  </div>

  {/* CHART */}
  <div className="flex justify-center">
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
<Tooltip
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;

      return (
        <div
          className="text-white text-xs px-3 py-1 rounded-md shadow"
          style={{
            backgroundColor: d.fill, // ✅ always correct
          }}
        >
          {d.name}: {d.value}
        </div>
      );
    }
    return null;
  }}
/>

<Pie
  data={top5Cars}
  dataKey="value"
  innerRadius={90}
  outerRadius={115}
  paddingAngle={2}
>
  {top5Cars.map((entry, index) => (
    <Cell key={index} fill={entry.fill} />
  ))}
</Pie>

      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* LEGEND */}
  <div className="mt-4 space-y-3">
    {top5Cars.map((c, i) => (
      <div
        key={i}
        className="flex justify-between items-center"
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* COLOR DOT */}
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: COLORS[i % COLORS.length] }}
          />

          {/* NAME */}
          <span className="text-sm text-gray-700">
            {c.name}
          </span>
        </div>

        {/* VALUE */}
        <span className="text-sm text-gray-500">
          {c.value}
        </span>
      </div>
    ))}
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
                placeholder="Search user / vehicle..."
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
                          setSearch(s.userName);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                    <img
  src={
    s.userImage ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${s.userName || "User"}`
  }
  className="w-8 h-8 rounded-full object-cover border"
/>
                        <div>
                          <p className="text-sm font-medium">
                            {s.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.vehicleName}
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
              className="px-3 py-2 border rounded-lg"
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
<div className="bg-gray-50 border rounded-xl p-4">
              <h3 className="font-semibold mb-4">
            All Payments ({filtered.length})
          </h3>

<div className="overflow-x-auto">
<table className="min-w-[1100px] w-full text-sm">    <thead className="border-b text-gray-600">
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
<tr key={i} className="border-b hover:bg-gray-100">
                    {/* VEHICLE */}
<td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-3 min-w-[250px]">
                        <img
                          src={p.vehicleImage}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold">{p.vehicleName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
  Reservation

  <span className="text-gray-400">•</span>

  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
    p.addedBy === "admin"
      ? "bg-blue-100 text-blue-600"
      : "bg-orange-100 text-orange-600"
  }`}>
    {p.addedBy}
  </span>
</p>
                        </div>
                      </div>
                    </td>

                    {/* USER */}
<td className="p-3 whitespace-nowrap">       
              <div className="flex items-center gap-3 min-w-[180px]">
                     <img
  src={
    p.userImage ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${p.userName || "User"}`
  }
  className="w-10 h-10 rounded-full object-cover border"
/>
                        <p className="font-semibold">{p.userName}</p>
                      </div>
                    </td>

                    <td className="p-3 font-semibold whitespace-nowrap">₹{p.amount}</td>
                    <td className="p-3 capitalize whitespace-nowrap">{p.method}</td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      {new Date(p.date).toDateString()}
                    </td>

{/* PAYMENT STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">
  <span className={`px-3 py-1 text-xs rounded-full ${getStatusStyle(p.paymentStatus || p.status)}`}>
    {p.paymentStatus || p.status}
  </span>
</td>

{/* BOOKING STATUS */}
<td className="p-3 whitespace-nowrap w-[120px]">
  <span
    className={`px-3 py-1 text-xs rounded-full ${getBookingStyle(
      p.bookingStatus
    )}`}
  >
    {p.bookingStatus}
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