import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Search, ArrowLeft, Layers, Car, Bike } from "lucide-react";

export default function UserBookingVehicle() {
  const { id } = useParams();
const location = useLocation();

const userId = location.state?.userId || id;
const selectedBookingId = location.state?.selectedBookingId; // userId
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");

useEffect(() => {
  fetchData();
}, [userId]);
useEffect(() => {
  if (selectedBookingId) {
    const el = document.getElementById(selectedBookingId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}, [selectedBookingId]);
  const fetchData = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      "${import.meta.env.VITE_API_URL}/api/bookings/owner-bookings",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    // 🔥 FILTER ONLY THIS USER
    const userBookings = data.filter((b) => b.userId === userId);

    setBookings(userBookings);
  };

  // 🔥 FILTER SEARCH
  const filtered = bookings.filter((b) =>
    b.vehicleName?.toLowerCase().includes(search.toLowerCase())
  );

// 🔥 STATIC STATS (DO NOT CHANGE WITH SEARCH)
const total = bookings.length;

const cars = bookings.filter(
  (b) => b.listingType?.toLowerCase() === "vehicle"
).length;

const bikes = bookings.filter(
  (b) => b.listingType?.toLowerCase() === "bike"
).length;


// 🔥 STATUS FUNCTION (same as booking page)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            User Bookings
          </h1>
          <p className="text-gray-500 mt-2">
            All vehicles booked by this user
          </p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={<Layers />} title="Total Bookings" value={total} />
          <StatCard icon={<Car />} title="Cars" value={cars} />
          <StatCard icon={<Bike />} title="Bikes" value={bikes} />
        </div>

        {/* SEARCH */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-4 text-gray-400" />
          <input
            placeholder="Search vehicle..."
            className="pl-12 pr-4 py-4 w-full rounded-xl border bg-white dark:bg-gray-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* VEHICLES GRID */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((b) => (
<div
  key={b._id}
  id={b._id}
  onClick={() => navigate(`/owner/booking/${b._id}`)}
  className={`cursor-pointer group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow transition-all duration-300
    ${
      b._id === selectedBookingId
        ? "ring-2 ring-orange-500 scale-[1.02]"
        : "hover:shadow-2xl hover:-translate-y-1"
    }
  `}
>
<div className="p-4 relative">
  <div className="h-52 rounded-xl overflow-hidden relative">

    {/* IMAGE */}
    <img
      src={b.vehicleImage}
      className="w-full h-full object-cover group-hover:scale-110 transition"
    
    />

    {/* 🔥 STATUS BADGE TOP RIGHT */}
    <div className="absolute top-3 right-3">
      <span
className={`px-3 py-1 text-xs rounded-full font-semibold ${
  getStatus(b) === "Completed"
    ? "bg-green-100 text-green-600"
    : getStatus(b) === "In Progress"
    ? "bg-yellow-100 text-yellow-600"
    : getStatus(b) === "Upcoming"
    ? "bg-blue-100 text-blue-600"
    : getStatus(b) === "Rejected"
    ? "bg-red-200 text-red-700"   // ✅ NEW
    : "bg-red-100 text-red-600"
}`}
      >
        {getStatus(b)}
      </span>
    </div>

  </div>
</div>
              {/* CONTENT */}
              <div className="px-6 pb-6">
                <h2 className="text-lg font-semibold">
                  {b.vehicleName}
                </h2>

                <p className="text-sm text-gray-500">
                  📍 {b.location}
                </p>

                <p className="text-sm mt-2">
                  📅 {new Date(b.pickupDate).toLocaleDateString()} →{" "}
                  {new Date(b.returnDate).toLocaleDateString()}
                </p>

                <p className="text-green-600 font-bold mt-2">
                  ₹ {b.payment?.amount}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* STAT CARD */
function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow flex gap-4 items-center">
      <div className="text-orange-500">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}