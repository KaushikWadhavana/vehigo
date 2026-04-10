import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { auth } from "../firebase";
import { syncUser } from "../api/authApi";
import axios from "axios";
import Swal from "sweetalert2";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  CarFront,
  Bike,
  Fuel,
  Settings,
  Users,
  MapPin,
  Gauge,
  Cog,
  Star 
} from "lucide-react";


import { useRef } from "react";

/* ================= LOCAL DATE HELPERS ================= */
const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const getLocalTimeStr = () => new Date().toTimeString().slice(0, 5);

const normalizeDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function UserHome() {
  /* ================= STATES (ALL AT TOP) ================= */
  const [role, setRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);
const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingItems, setLoadingItems] = useState(true);

  const [locations, setLocations] = useState([]);
const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
const [loadingLocations, setLoadingLocations] = useState(true);

  /* ================= INIT DATE / TIME ================= */
  useEffect(() => {
    const today = getLocalDateStr();
    const now = getLocalTimeStr();

    setPickupDate(today);
    setPickupTime(now);
    setReturnDate(today);
    setReturnTime(now);
  }, []);

  /* ================= AUTH ================= */
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      setCheckingRole(false);
      return;
    }

    try {
      const token = await currentUser.getIdToken(); // no force refresh
      const user = await syncUser(token);
      setRole(user.role);
    } catch (err) {
      console.error("Auth error", err);
    } finally {
      setCheckingRole(false);
    }
  });

  return () => unsubscribe();
}, []);


useEffect(() => {
  fetchRandomListings();
}, []);

useEffect(() => {
  const fetchLocations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/listing`);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error("Error fetching locations", err);
    } finally {
      setLoadingLocations(false);
    }
  };

  fetchLocations();
}, []);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".location-search-wrapper")) {
      setShowLocationSuggestions(false);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);


const handleSearch = () => {

  if (!location) {
    Swal.fire({
      icon: "warning",
      title: "Location Required",
      text: "Please select pickup location before searching.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }

  if (!pickupDate || !returnDate) {
    Swal.fire({
      icon: "warning",
      title: "Select Dates",
      text: "Please select pickup and return dates.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }

  if (!pickupTime || !returnTime) {
    Swal.fire({
      icon: "warning",
      title: "Select Time",
      text: "Please select pickup and return time.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }

  /* CREATE DATETIME */
  const start = new Date(`${pickupDate}T${pickupTime}`);
  const end = new Date(`${returnDate}T${returnTime}`);

  /* CHECK RETURN AFTER PICKUP */
  if (end <= start) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Booking",
      text: "Return date & time must be after pickup.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }

const diffMs = end - start;

if (diffMs < 60 * 60 * 1000) {
  Swal.fire({
    icon: "warning",
    title: "Invalid Booking",
    text: "Minimum booking duration is 1 hour",
    confirmButtonColor: "#f4a640"
  });
  return;
}

const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

if (diffDays > 365) {
  Swal.fire({
    icon: "warning",
    title: "Invalid Booking",
    text: "Maximum booking allowed is 1 year",
    confirmButtonColor: "#f4a640"
  });
  return;
}


  /* NAVIGATE TO LISTING */
  navigate(
    `/listing?location=${location}&pickupDate=${pickupDate}&pickupTime=${pickupTime}&returnDate=${returnDate}&returnTime=${returnTime}`
  );
};



const scrollRef = useRef(null);

const scrollLeft = () => {
  scrollRef.current.scrollBy({ left: -350, behavior: "smooth" });
};

const scrollRight = () => {
  scrollRef.current.scrollBy({ left: 350, behavior: "smooth" });
};
  /* ================= VALIDATION ================= */
const handlePickupDateChange = (v) => {

  if (normalizeDate(v) < normalizeDate(getLocalDateStr())) {
    Swal.fire({
      icon: "error",
      title: "Invalid Date",
      text: "Pickup date cannot be in the past.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }

setPickupDate(v);

if (returnDate && normalizeDate(returnDate) < normalizeDate(v)) {
  setReturnDate(v);
}

};



const handlePickupTimeChange = (v) => {
  const now = new Date();
const selected = new Date(`${pickupDate}T${v}`);

if (selected < now) {

    Swal.fire({
      icon: "error",
      title: "Invalid Time",
      text: "Pickup time cannot be in the past.",
      confirmButtonColor: "#f4a640",
    });
    return;
  }
  setPickupTime(v);
};


const handleReturnTimeChange = (v) => {

  const start = new Date(`${pickupDate}T${pickupTime}`);
  const end = new Date(`${returnDate}T${v}`);

  if (end <= start) {

    Swal.fire({
      icon: "warning",
      title: "Invalid Time",
      text: "Return time must be after pickup time",
      confirmButtonColor: "#f4a640"
    });

    return;
  }

  const diffMs = end - start;

  if (diffMs < 60 * 60 * 1000) {

    Swal.fire({
      icon: "warning",
      title: "Invalid Booking",
      text: "Minimum booking duration is 1 hour",
      confirmButtonColor: "#f4a640"
    });

    return;
  }

  setReturnTime(v);

};


const fetchRandomListings = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/listing/random`
    );

    const data = await res.json();

    setItems(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Random fetch error", err);
  }
};

  /* ================= RENDER ================= */
  if (checkingRole) return null;
  if (role === "admin") return <Navigate to="/admin" replace />;





  return (
    <>
  
<section className="bg-[#f7f9f8]">
  <div className="
    max-w-[1280px] mx-auto px-5
    pt-16 pb-24
    lg:pt-20 lg:pb-32
    grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]
    gap-12 lg:gap-20
    items-center
  ">
    {/* LEFT CONTENT */}
    <div className="text-center lg:text-left">
      <span className="inline-block bg-white px-5 py-2 rounded-full text-sm shadow mb-6">
        👍 100% Trusted vehicle rental platform
      </span>

      <h1 className="
        text-[38px] sm:text-[44px] lg:text-[50px]
        font-extrabold leading-tight mb-5
      ">
        <span className="text-[#f4a640]">Find Your Best</span>
        <br />
        Dream Vehicle for Rental
      </h1>

      <p className="
        max-w-[520px]
        mx-auto lg:mx-0
        text-gray-600
        leading-relaxed mb-8
        text-sm sm:text-base
      ">
       Turn every trip into an experience with luxury vehicles built for smooth, stylish travel.
From city streets to long drives, enjoy comfort and class without compromise.
Travel beyond destinations experience luxury in motion.
      </p>

      <button
        onClick={() => navigate('/listing')}
        className="
        px-7 py-3
        border-2 border-black
        rounded-lg font-semibold
        hover:bg-black hover:text-white
        transition
      ">
        View all Cars →
      </button>
    </div>

    {/* RIGHT IMAGE (HIDDEN ON SMALL) */}
    <div className="hidden lg:flex justify-end">
      <img
        src="/car.png"
        alt="Car"
        className="max-w-[600px] drop-shadow-[0_40px_55px_rgba(0,0,0,0.28)]"
      />
    </div>
  </div>
</section>


      {/* ================= SEARCH BAR (HALF BG) ================= */}
      <section className="relative">
        {/* background split */}
        <div className="absolute inset-0 h-1/2 bg-[#f7f9f8]"></div>
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>

   <div className="
  relative z-10
  max-w-[1180px] mx-auto
  -mt-[60px] lg:-mt-[70px]
  bg-white rounded-[18px]
  p-5 lg:p-[26px]
  grid grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]
  gap-4 lg:gap-[18px]
  shadow-[0_35px_60px_rgba(0,0,0,0.12)]
">

      {/* LOCATION SEARCH (AUTOCOMPLETE) */}
<div className="flex flex-col gap-1 relative location-search-wrapper">
  <label className="text-sm font-semibold">Pickup Location</label>

  <input
    type="text"
    placeholder="Search city..."
    value={location}
onChange={async (e) => {

  const value = e.target.value;
  setLocation(value);

  if (!value) {
    setLocations([]);
    setShowLocationSuggestions(false);
    return;
  }

  try {

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/listing/location-suggestions?search=${value}`
    );

    const data = await res.json();

    setLocations(data.data || []);
    setShowLocationSuggestions(true);

  } catch (err) {
    console.error("Location suggestion error", err);
  }

}}

    onFocus={() => setShowLocationSuggestions(true)}
    className="h-[44px] rounded-lg bg-[#f3f3f3] px-3 focus:ring-2 focus:ring-[#0f766e]/40 outline-none"
  />

  {showLocationSuggestions && location && (
    <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
      {locations
        .filter((loc) =>
          loc.toLowerCase().includes(location.toLowerCase())
        )
        .map((loc, index) => (
          <div
            key={index}
            onClick={() => {
              setLocation(loc);
              setShowLocationSuggestions(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
          >
            {loc}
          </div>
        ))}

      {locations.filter((loc) =>
        loc.toLowerCase().includes(location.toLowerCase())
      ).length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-400">
          No city found
        </div>
      )}
    </div>
  )}
</div>


          {/* PICKUP DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Pickup Date</label>
            <input
              type="date"
              className="h-[44px] rounded-lg bg-[#f3f3f3] px-3"
                min={getLocalDateStr()}
              value={pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
            />
          </div>

          {/* PICKUP TIME */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Pickup Time</label>
            <input
              type="time"
              className="h-[44px] rounded-lg bg-[#f3f3f3] px-3"
              value={pickupTime}
              onChange={(e) => handlePickupTimeChange(e.target.value)}
            />
          </div>

          {/* RETURN DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Return Date</label>
<input
  type="date"
  min={pickupDate}
  max={
    new Date(
      new Date(pickupDate).setFullYear(
        new Date(pickupDate).getFullYear() + 1
      )
    )
      .toISOString()
      .split("T")[0]
  }
  className="h-[44px] rounded-lg bg-[#f3f3f3] px-3"
  value={returnDate}
  onChange={(e) => setReturnDate(e.target.value)}
/>
          </div>

          {/* RETURN TIME */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Return Time</label>
            <input
              type="time"
              className="h-[44px] rounded-lg bg-[#f3f3f3] px-3"
              value={returnTime}
              onChange={(e) => handleReturnTimeChange(e.target.value)}
            />
          </div>
<button
  onClick={handleSearch}
  className="h-[44px] mt-6 px-7 bg-[#f4a640] rounded-lg text-white font-semibold hover:bg-[#e29630] transition flex items-center justify-center gap-2"
>
  <Search size={18} />
  Search
</button>


        </div>
      </section>

      {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-white py-24">
        <div className="max-w-[1200px] mx-auto text-center px-5">
  {/* Title */}
    <h2 className="text-[42px] font-extrabold mb-3">
      How It Works
    </h2>

    <div className="w-10 h-[3px] bg-[#f59e0b] mx-auto mb-6 rounded"></div>

    <p className="max-w-[520px] mx-auto text-base leading-[1.7] text-[#666] mb-[70px]">
      Booking a vehicle rental is a straightforward process that typically
      involves the following steps
    </p>

    {/* Steps */}
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-[80px] lg:gap-[90px]">

      {/* dashed line (desktop only) */}
      <span className="hidden lg:block absolute top-[45px] left-1/2 -translate-x-1/2 w-[86%] border-t border-dashed border-[#cfcfcf]"></span>

      {/* STEP 1 */}
      <div className="relative z-10">
        <div className="w-[90px] h-[90px] mx-auto rounded-full bg-[#0f766e]
                        flex items-center justify-center relative">
          <img src="/icons/location.png" alt="" className="w-[42px]" />
          <span className="absolute inset-[-8px] rounded-full
                           border-2 border-dashed border-[rgba(0,0,0,0.35)]"></span>
        </div>

        <h3 className="mt-9 text-xl font-bold">
          1. Choose Date & Locations
        </h3>

        <p className="max-w-[310px] mx-auto mt-4 text-sm leading-[1.75] text-[#666]">
          Determine the date & location for your car rental.
          Consider pickup and drop-off points such as airport or city center.
        </p>

        <span className="block w-[120px] h-[2px] bg-[#0f766e] mx-auto mt-7"></span>
      </div>

      {/* STEP 2 */}
      <div className="relative z-10">
        <div className="w-[90px] h-[90px] mx-auto rounded-full bg-[#f59e0b]
                        flex items-center justify-center relative">
          <img src="/icons/pickup.png" alt="" className="w-[42px]" />
          <span className="absolute inset-[-8px] rounded-full
                           border-2 border-dashed border-[#f59e0b]"></span>
        </div>

        <h3 className="mt-9 text-xl font-bold">
          2. Pick-Up Locations
        </h3>

        <p className="max-w-[310px] mx-auto mt-4 text-sm leading-[1.75] text-[#666]">
          Check availability of your desired vehicle type for selected
          dates and locations, including rental charges.
        </p>

        <span className="block w-[120px] h-[2px] bg-[#f59e0b] mx-auto mt-7"></span>
      </div>

      {/* STEP 3 */}
      <div className="relative z-10">
        <div className="w-[90px] h-[90px] mx-auto rounded-full bg-black
                        flex items-center justify-center relative">
          <img src="/icons/car.png" alt="" className="w-[42px]" />
          <span className="absolute inset-[-8px] rounded-full
                           border-2 border-dashed border-[rgba(0,0,0,0.35)]"></span>
        </div>

        <h3 className="mt-9 text-xl font-bold">
          3. Book your Car
        </h3>

        <p className="max-w-[310px] mx-auto mt-4 text-sm leading-[1.75] text-[#666]">
          Once you've found an option, proceed to make a reservation.
          Provide your details, license, contact info and payment.
        </p>

        <span className="block w-[120px] h-[2px] bg-black mx-auto mt-7"></span>
      </div>

    </div>
        </div>
      </section>
{/* ================= RECOMMENDED VEHICLE DEALS ================= */}
<section className="bg-sky-100 py-24">
  <div className="max-w-[1280px] mx-auto px-5 relative">

    {/* HEADER */}
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
        Recommended Vehicle Rental Deals
      </h2>
      <div className="w-10 h-[3px] bg-orange-400 mx-auto my-4 rounded"></div>
      <p className="text-gray-600">
Top vehicles and bikes ready for your next ride
      </p>
    </div>

    {/* ARROWS */}
    <button
      onClick={scrollLeft}
      className="
        hidden lg:flex
        absolute left-0 top-1/2 -translate-y-1/2
        w-12 h-12 rounded-full
        bg-white shadow
        items-center justify-center
        hover:bg-black hover:text-white
        transition z-10
      "
    >
      <ChevronLeft />
    </button>

    <button
      onClick={scrollRight}
      className="
        hidden lg:flex
        absolute right-0 top-1/2 -translate-y-1/2
        w-12 h-12 rounded-full
        bg-white shadow
        items-center justify-center
        hover:bg-black hover:text-white
        transition z-10
      "
    >
      <ChevronRight />
    </button>

    {/* SCROLL ROW */}
<div
  ref={scrollRef}
  className="flex gap-8 overflow-x-auto scroll-smooth pb-6
  [-ms-overflow-style:none]
  [scrollbar-width:none]
  [&::-webkit-scrollbar]:hidden"
>
  {items.map((item) => (
    <div
      key={item._id}
      className="min-w-[85%] sm:min-w-[45%] lg:min-w-[32%]
      bg-white rounded-3xl shadow-md hover:shadow-xl
      transition-all duration-300 flex flex-col"
    >
      {/* IMAGE */}
      <div className="p-4 pb-0">
        <div className="relative rounded-2xl overflow-hidden h-60">

          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />

          <span className="absolute bottom-3 left-3 bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow">
            {item.brand}
          </span>

        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-5 flex flex-col flex-1">

      <h3 className="text-lg font-semibold text-gray-900">
  {item.name}
</h3>

{/* ⭐ RATING */}
<div className="flex items-center gap-2 mt-2">
  <div className="flex text-orange-500">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={15}
        fill={
          star <= Math.round(item.avgRating || 0)
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
      />
    ))}
  </div>

  <span className="text-sm text-gray-600">
    ({item.avgRating?.toFixed(1) || "0.0"})
  </span>

  <span className="text-sm text-gray-400">
    {item.totalReviews || 0} Reviews
  </span>
</div>


        {/* SPECS */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-5 text-sm text-gray-600 mt-4">

          {item.type === "Vehicle" ? (
            <>
              <Spec icon={<Settings size={15} />} label={item.transmission} />
              <Spec icon={<Fuel size={15} />} label={item.fuel} />
              <Spec icon={<Cog size={15} />} label={item.year} />
              <Spec icon={<Users size={15} />} label={`${item.seats} Seats`} />
            </>
          ) : (
            <>
              <Spec icon={<Gauge size={15} />} label={`${item.mileage || "-"} km/l`} />
              <Spec icon={<Fuel size={15} />} label={item.fuel} />
              <Spec icon={<Cog size={15} />} label={item.year} />
              <Spec icon={<Bike size={15} />} label={item.bikeType} />
            </>
          )}

        </div>

        {/* PRICE */}
        <div className="mt-5 bg-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between">

          <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
            <MapPin size={15} />
            {item.mainLocation}
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-red-600">
              ₹{item.pricing?.dailyPrice}
            </p>
            <p className="text-xs text-gray-500">/ Day</p>
          </div>

        </div>

        <button
          onClick={() => navigate(`/listing/${item._id}`)}
          className="mt-6 w-full bg-black text-white py-3 rounded-2xl font-semibold hover:bg-gray-900 transition"
        >
          Rent Now
        </button>

      </div>
    </div>
  ))}
</div>

  </div>
</section>




    </>
  );
}
function Spec({ icon, label }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}
