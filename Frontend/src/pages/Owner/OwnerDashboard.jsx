import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Car, DollarSign, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import carImg from "../../assets/car.png";
import characterImg from "../../assets/character.png";
import bgImg from "../../assets/backgroundpng.png";

export default function OwnerDashboard() {
  const navigate = useNavigate();
const [customers, setCustomers] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
const [range, setRange] = useState("thisWeek");
const [recentBookings, setRecentBookings] = useState([]);
 const [data, setData] = useState({
  totalVehicles: 0,
  totalReservations: 0,
  totalRevenue: 0,
  inRental: 0,
  upcoming: 0,
  revenueGrowth: 0,
  bookingGrowth: 0,
  reservationGrowth: 0, // 🔥 ADD THIS
  latestVehicle: null,
});

useEffect(() => {
  fetchDashboard();
  fetchWeekly();
  fetchCustomers();
  fetchRecentBookings();

  // 🔥 AUTO REFRESH EVERY 10 SEC
  const interval = setInterval(() => {
    fetchDashboard();
    fetchWeekly();
    fetchCustomers();
    fetchRecentBookings();
  }, 10000); // 10 sec

  return () => clearInterval(interval); // cleanup
}, [range]);

  const fetchDashboard = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/owner-dashboard`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

setData({
  ...res.data,

  totalReservations: Number(res.data.totalReservations || 0),

  reservationGrowth: Number(res.data.reservationGrowth || 0),
  bookingGrowth: Number(res.data.bookingGrowth || 0),
  revenueGrowth: Number(res.data.revenueGrowth || 0),

  formattedTotal: res.data.formattedTotal || "₹0",
});
  };

  const fetchCustomers = async () => {
  const token = await auth.currentUser.getIdToken();

  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/owner-dashboard/top-customers`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  setCustomers(res.data);
};

const fetchWeekly = async () => {
  const token = await auth.currentUser.getIdToken();

  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/owner-dashboard/weekly-income?range=${range}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // ✅ FIX DATA (IMPORTANT)
const formatted = res.data.map((d) => ({
  name: d.name,
  income: Number(d.income || 0),
}));

  console.log("WEEKLY DATA 👉", formatted); // DEBUG

  setWeeklyData(formatted);
};

const fetchRecentBookings = async () => {
  const token = await auth.currentUser.getIdToken();

  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/owner-dashboard/recent-bookings`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  setRecentBookings(res.data);
};
  return (
    <div className="bg-gray-100 min-h-screen p-6">

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="xl:col-span-2 space-y-6">

          {/* HERO */}
          <div className="bg-[#f8f9fb] rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">

            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {auth.currentUser?.displayName}
              </h1>

  <p className="text-gray-500">
  {data.totalVehicles === 0
    ? "No vehicles added yet"
    : "Budget Friendly Vehicles Available"}
</p>
              <div className="mt-4 flex gap-10">
                <div>
                  <p className="text-sm text-gray-500">Total Cars</p>
                  <h2 className="text-3xl font-bold">
                    {data.totalVehicles}
                  </h2>
                  {data.totalVehicles === 0 && (
  <p className="text-xs text-gray-400 mt-1">
    No vehicles added yet
  </p>
)}
                </div>

                <div>
                  <p className="text-purple-500 font-semibold">
                    {data.inRental} In Rental
                  </p>
                  <p className="text-orange-500 font-semibold">
                    {data.upcoming} Upcoming
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
              <button
  onClick={() => navigate("/owner/reservations")}
  className="bg-orange-400 text-white px-4 py-2 rounded-xl"
>
  Reservations
</button>
    <button
  onClick={() => navigate("/owner/add")}
  className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
>
  + Add Vehicle
</button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="hidden lg:flex relative w-[400px] h-[220px]">
              <img src={bgImg} className="absolute bottom-[70px] right-[40px] w-[100%] opacity-60" />
              <img src={carImg} className="absolute bottom-0 right-[50px] w-[330px]" />
              <img src={characterImg} className="absolute bottom-0 right-[150px] w-[80px]" />
            </div>
          </div>

          {/* STATS */}
{/* ================= STATS ================= */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

  {/* ================= RESERVATIONS ================= */}
  <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition">

    {/* HEADER */}
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Package size={18} />
      </div>
      <p className="text-gray-600 font-medium">Total Reservations</p>
    </div>

    <div className="border-t pt-3 flex justify-between items-end">

      {/* LEFT */}
      <div>
        <h2 className="text-2xl font-bold">{data.totalReservations}</h2>
        
<p className="flex items-center gap-1 text-sm mt-1 font-medium">

  {data.reservationGrowth > 0 && (
    <>
      <TrendingUp size={14} className="text-green-500" />
      <span className="text-green-500">
        +{Math.abs(data.reservationGrowth).toFixed(0)}%
      </span>
    </>
  )}

  {data.reservationGrowth < 0 && (
    <>
      <TrendingDown size={14} className="text-red-500" />
      <span className="text-red-500">
        -{Math.abs(data.reservationGrowth).toFixed(0)}%
      </span>
    </>
  )}

  {data.reservationGrowth === 0 && (
    <>
      <Minus size={14} className="text-gray-400" />
      <span className="text-gray-400">0%</span>
    </>
  )}

  <span className="text-gray-400 ml-1">Last Week</span>
</p>
      </div>



    </div>
  </div>


  {/* ================= EARNINGS ================= */}
  <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition">

    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-500">
        <DollarSign size={18} />
      </div>
      <p className="text-gray-600 font-medium">Total Earnings</p>
    </div>

    <div className="border-t pt-3 flex justify-between items-end">

      <div>
        <h2 className="text-2xl font-bold">
          {data.formattedTotal}
        </h2>

<p className="flex items-center gap-1 text-sm mt-1 font-semibold">

  {data.revenueGrowth > 0 && (
    <>
      <TrendingUp size={14} className="text-green-500" />
      <span className="text-green-500">
        +{Math.abs(data.revenueGrowth).toFixed(0)}%
      </span>
    </>
  )}

  {data.revenueGrowth < 0 && (
    <>
      <TrendingDown size={14} className="text-red-500" />
      <span className="text-red-500">
        -{Math.abs(data.revenueGrowth).toFixed(0)}%
      </span>
    </>
  )}

  {data.revenueGrowth === 0 && (
    <>
      <Minus size={14} className="text-gray-400" />
      <span className="text-gray-400">0%</span>
    </>
  )}

  <span className="text-gray-400 ml-1">Last Week</span>
</p>
      </div>


    </div>
  </div>


  {/* ================= VEHICLES ================= */}
  <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition">

    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
        <Car size={18} />
      </div>
      <p className="text-gray-600 font-medium">Total Vehicles</p>
    </div>

    <div className="border-t pt-3 flex justify-between items-end">

      <div>
        <h2 className="text-2xl font-bold">{data.totalVehicles}</h2>
        <p className="text-gray-400 text-sm mt-1">
          Active inventory
        </p>
      </div>



    </div>
  </div>

</div>


        </div>

        {/* RIGHT */}
<div>
  {/* ✅ ADD THIS ABOVE EXISTING BLOCK */}
{!data.latestVehicle && (
  <div className="bg-white p-5 rounded-2xl shadow border flex flex-col items-center justify-center h-[260px] text-center">

    <div className="text-3xl mb-2">🚗</div>

    <p className="text-sm text-gray-500">
      No vehicle added yet
    </p>

    <button
      onClick={() => navigate("/owner/add")}
      className="mt-3 bg-black text-white px-3 py-2 rounded-lg text-sm"
    >
      + Add Vehicle
    </button>

  </div>
)}

  {data.latestVehicle?.status === "approved" && (
    <div className="bg-white p-5 rounded-2xl shadow border">

      {/* HEADER */}
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-lg">Newly Added Vehicle</h3>
     
      </div>
<div className="relative w-full h-[160px] rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">

  {/* INNER FRAME */}
  <div className="w-full h-full">
    
    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
      <img
        src={data.latestVehicle.imageUrl}
        className="max-w-full max-h-full object-contain"
      />
    </div>

  </div>

  {/* SOFT OVERLAY */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

</div>
      {/* TYPE */}
      <p className="text-gray-400 text-sm mt-2">
        {data.latestVehicle.type || "Vehicle"}
      </p>

      {/* NAME + PRICE */}
<div className="flex justify-between items-center">
  
  {/* LEFT SIDE (NAME + BADGE) */}
  <div className="flex items-center gap-2">
    <h2 className="font-semibold text-lg">
      {data.latestVehicle.name}
    </h2>

    {/* ✅ BADGE HERE */}
    <span className={`text-xs px-2 py-1 rounded-full ${
      data.latestVehicle.addedBy === "admin"
        ? "bg-blue-100 text-blue-600"
        : "bg-green-100 text-green-600"
    }`}>
      {data.latestVehicle.addedBy}
    </span>
  </div>

  {/* RIGHT SIDE (PRICE) */}
  <span className="font-semibold text-gray-800">
    ₹{data.latestVehicle?.pricing?.dailyPrice || 0} /day
  </span>
</div>

      {/* MODEL */}
      <p className="text-gray-400 text-sm mb-3">
        {data.latestVehicle.model}
      </p>

      {/* FEATURES */}
<div className="grid grid-cols-3 gap-3 mt-3">

  {/* FUEL */}
  <div className="bg-gray-50 border rounded-xl py-3 text-center">
    <p className="text-xs text-gray-400">Fuel</p>
    <p className="text-sm font-semibold">
      {data.latestVehicle.fuel || "-"}
    </p>
  </div>

  {/* MILEAGE */}
  <div className="bg-gray-50 border rounded-xl py-3 text-center">
    <p className="text-xs text-gray-400">Mileage</p>
    <p className="text-sm font-semibold">
      {data.latestVehicle.mileage || "-"}
    </p>
  </div>

  {/* CONDITIONAL */}
  <div className="bg-gray-50 border rounded-xl py-3 text-center">
    <p className="text-xs text-gray-400">
      {data.latestVehicle.type === "Bike" ? "Type" : "Passengers"}
    </p>

    <p className="text-sm font-semibold">
      {data.latestVehicle.type === "Bike"
        ? data.latestVehicle.bikeType
        : data.latestVehicle.passengers}
    </p>
  </div>

</div>

      {/* BUTTON */}
<button
  onClick={() => {
const v = data.latestVehicle;
if (!v) return;

navigate(`/owner/my-vehicles/${v._id}`);
  }}
  className="mt-4 w-full border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
>
  View Details →
</button>

    </div>
  )}
</div>

      </div>
    
<div className="flex flex-col lg:flex-row gap-6 mt-6">

  {/* ================= CUSTOMERS (MANUAL WIDTH) ================= */}
<div className="bg-white rounded-2xl p-5 border shadow-sm w-full lg:w-[420px] h-[420px] flex flex-col">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">Customers</h3>
      <button
        onClick={() => navigate("/owner/user-bookings")}
        className="text-sm text-gray-500 hover:text-black"
      >
        View All
      </button>
    </div>

    {/* LIST */}
  <div className="space-y-4 overflow-y-auto pr-2 flex-1">

  {/* ✅ ADD THIS */}
  {customers.length === 0 && (
    <div className="text-center text-gray-400 mt-10">
      👤 No customers yet
      <p className="text-xs mt-1">
        Customers will appear after bookings
      </p>
    </div>
  )}

  {/* ✅ KEEP THIS */}
  {customers.map((c, i) => (
        <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
         <img
  src={
    c.image ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`
  }
  className="w-full h-full object-cover"
/>
            </div>

            <div>
              <p className="font-medium">{c.name || "User"}</p>
<span className="text-xs text-gray-400">
  {c.bookingCount > 0 && c.reservationCount > 0
    ? "Booking + Reservation"
    : c.bookingCount > 0
    ? "Booking"
    : c.reservationCount > 0
    ? "Reservation"
    : "User"}
</span>
            </div>
          </div>

          <div className="text-right">
<p className="text-xs text-gray-400">Total Orders</p>
<p className="font-semibold">{c.total}</p>
          </div>

        </div>
      ))}
    </div>

  </div>


  {/* ================= CHART (TAKES REST SPACE) ================= */}
<div className="bg-white rounded-2xl p-6 border shadow-sm flex-1 h-[420px] flex flex-col">

    {/* HEADER */}
 <div className="flex justify-between items-start mb-4">

  <div>
    <h3 className="text-lg font-semibold">Income Overview</h3>
    <p className="text-sm text-gray-400 mt-1">
      Weekly performance
    </p>
  </div>

  <div className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm">
    <Calendar size={14} />
    <select
      value={range}
      onChange={(e) => setRange(e.target.value)}
      className="bg-transparent outline-none"
    >
      <option value="thisWeek">This Week</option>
      <option value="lastWeek">Last Week</option>
    </select>
  </div>
</div>

    {/* TOP CARDS */}
    <div className="flex gap-4 mb-6">

<div className="bg-orange-50 border border-orange-100 px-5 py-3 rounded-xl">
  <p className="text-sm text-gray-500">Total Income</p>
  <h2 className="text-xl font-bold">
    ₹{weeklyData.reduce((s, d) => s + Number(d.income || 0), 0)}
  </h2>

  <p className="text-xs text-gray-400 mt-1">
    Includes bookings + reservations
  </p>
</div>


    </div>

    {/* CHART */}
<div className="w-full h-[260px] sm:h-[320px] md:h-[380px]">
{/* ✅ ADD THIS ABOVE */}
{weeklyData.length === 0 ||
 weeklyData.every(d => Number(d.income || 0) === 0) ? (

  <div className="flex items-center justify-center h-full text-gray-400">
    📊 No income data yet
  </div>

) : (

  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={weeklyData}
      barCategoryGap={20}
      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
    >

      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="#e5e7eb"
      />

      <XAxis
        dataKey="name"
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />

      <YAxis
        tick={{ fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />

      <Tooltip
        formatter={(value) => [`₹${value}`, "Income"]}
      />

      <Bar
        dataKey="income"
        fill="#f59e0b"
        radius={[6, 6, 0, 0]}
        barSize={window.innerWidth < 640 ? 14 : 24} // 🔥 mobile fix
      />

    </BarChart>
  </ResponsiveContainer>
)}
</div>

  </div>

</div>

{/* ================= RECENT BOOKINGS TABLE ================= */}
<div className="bg-white rounded-2xl p-5 border shadow-sm mt-6">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-semibold text-lg">Recent Bookings</h3>

    <button
      onClick={() => navigate("/owner/user-bookings")}
      className="text-sm text-gray-500 hover:text-black"
    >
      View All
    </button>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

    <table className="w-full min-w-[700px] text-sm">

      {/* HEADER */}
      <thead className="text-gray-500 border-b">
        <tr>
          <th className="p-3 text-left">Vehicle</th>
          <th className="p-3 text-left">User</th>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Status</th>
        </tr>
      </thead>

      {/* BODY */}
<tbody>

  {/* ✅ ADD THIS BLOCK */}
  {recentBookings.length === 0 && (
    <tr>
      <td colSpan="5" className="text-center py-10 text-gray-400">
        🚫 No bookings yet
        <p className="text-xs mt-1">
          Once users book your vehicles, they will appear here
        </p>
      </td>
    </tr>
  )}

  {/* ✅ KEEP YOUR OLD CODE */}
  {recentBookings.map((b, i) => (
<tr
  key={i}
  onClick={() => {
  if (b?.type === "reservation") {
    navigate(`/owner/reservationinfo/${b._id}`);
  } else {
    navigate(`/owner/booking/${b._id}`);
  }
}}
  className="border-b hover:bg-gray-50 transition cursor-pointer"
>

            {/* VEHICLE */}
<td className="p-3 whitespace-nowrap">
  <div className="flex items-center gap-3 min-w-[250px]">

    {/* IMAGE */}
    <img
      src={b.vehicleImage}
      className="w-12 h-12 rounded-lg object-cover"
    />

    {/* TEXT */}
    <div>
      <p className="font-semibold">{b.vehicleName}</p>
<span className={`text-[10px] px-2 py-0.5 rounded-full ml-2 ${
  b.type === "reservation"
    ? "bg-purple-100 text-purple-600"
    : "bg-blue-100 text-blue-600"
}`}>
  {b.type}
</span>
      {/* ✅ SAME AS PAYMENT PAGE */}
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {b.vehicleModel}

        <span className="text-gray-400">•</span>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] ${
            b.addedBy === "admin"
              ? "bg-blue-100 text-blue-600"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {b.addedBy}
        </span>
      </p>
    </div>

  </div>
</td>

            {/* USER */}
            <td className="p-3">
              <div className="flex items-center gap-2">
              <img
  src={
    b.userImage ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${b.userName || "User"}`
  }
  className="w-8 h-8 rounded-full"
/>
                {b.userName}
              </div>
            </td>

            {/* DATE */}
            <td className="p-3 text-gray-500">
              {new Date(b.date).toLocaleDateString()}
            </td>

            {/* AMOUNT */}
            <td className="p-3 font-semibold">
              ₹{b.amount}
            </td>

            {/* STATUS */}
            <td className="p-3">
              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  b.status === "Completed"
                    ? "bg-green-100 text-green-600"
                    : b.status === "Upcoming"
                    ? "bg-blue-100 text-blue-600"
                    : b.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-600"
                    : b.status === "Cancelled" || b.status === "Rejected"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {b.status}
              </span>
            </td>

          </tr>
        ))}
      </tbody>

    </table>
  </div>
</div>

    </div>
  );
}