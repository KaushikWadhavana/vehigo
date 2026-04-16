import { useEffect, useState } from "react";
import UserNavbar from "../../components/UserNavbar";
import Footer from "../../components/Footer";
import Swal from "sweetalert2";
import {
  Settings,
  Fuel,
  Cog,
  Users,
  Bike,
  MapPin,
  Gauge,

    Star 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LayoutGrid, List, ChevronDown  } from "lucide-react";

/* ================= LOCAL DATE HELPERS ================= */
const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
const getCurrentTimePlus15 = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};
const getLocalTimeStr = () => new Date().toTimeString().slice(0, 5);

const normalizeDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function Listing() {
  /* ================= SEARCH STATES ================= */
  const [location, setLocation] = useState("");
const [pickupDate, setPickupDate] = useState(getLocalDateStr());
const [pickupTime, setPickupTime] = useState(getLocalTimeStr());
const [returnDate, setReturnDate] = useState(getLocalDateStr());
const [returnTime, setReturnTime] = useState(getLocalTimeStr());

  const [error, setError] = useState("");
const [locations, setLocations] = useState([]);
const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

const [activeSection, setActiveSection] = useState("search");
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

const locationHook = useLocation();


const [loadingLocations, setLoadingLocations] = useState(true);
const [filters, setFilters] = useState({
  brands: [],
  categories: [],
  years: [],
  fuels: [],
  bikeTypes: [],
  transmissions: [],
  seats: [],
  features: [],
  price: { min: 0, max: 10000 },
  rentalTypes: [],
});
const [selectedFilters, setSelectedFilters] = useState({
  brands: [],
  categories: [],
  years: [],
  fuels: [],
  bikeTypes: [],
  features: [],
  transmissions: [],
  minPrice: "",
  maxPrice: "",
  search: "",
});

const navigate = useNavigate();

const [results, setResults] = useState([]);
const [page, setPage] = useState(1);

const [limit, setLimit] = useState(9);
const [sortBy, setSortBy] = useState("newest");
const [total, setTotal] = useState(0);

const toggleFilter = (key, value) => {
  const updatedFilters = {
    ...selectedFilters,
    [key]: selectedFilters[key].includes(value)
      ? selectedFilters[key].filter((v) => v !== value)
      : [...selectedFilters[key], value],
  };

  setSelectedFilters(updatedFilters);
  setPage(1);
};

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const fetchResults = async (
  customPage = page,
  customLocation = location,
  customPickupDate = pickupDate,
  customPickupTime = pickupTime,
  customReturnDate = returnDate,
  customReturnTime = returnTime
) => {

  const params = new URLSearchParams();

  if (customLocation) params.append("location", customLocation);
  if (customPickupDate) params.append("pickupDate", customPickupDate);
  if (customPickupTime) params.append("pickupTime", customPickupTime);
  if (customReturnDate) params.append("returnDate", customReturnDate);
  if (customReturnTime) params.append("returnTime", customReturnTime);

  params.append("page", customPage);
  params.append("limit", limit);
  params.append("sortBy", sortBy);

  if (selectedFilters.brands.length)
  params.append(
  "brands",
selectedFilters.brands.join(",")
);

if (selectedFilters.categories.length)
  params.append("categories", selectedFilters.categories.join(","));

if (selectedFilters.years.length)
  params.append("years", selectedFilters.years.join(","));

if (selectedFilters.fuels.length)
  params.append("fuels", selectedFilters.fuels.join(","));

if (selectedFilters.bikeTypes.length)
  params.append("bikeTypes", selectedFilters.bikeTypes.join(","));

if (selectedFilters.features && selectedFilters.features.length > 0)
  params.append("features", selectedFilters.features.join(","));

if (selectedFilters.transmissions.length)
  params.append("transmissions", selectedFilters.transmissions.join(","));

if (selectedFilters.search)
  params.append("search", selectedFilters.search);

if (selectedFilters.minPrice)
  params.append("minPrice", selectedFilters.minPrice);

if (selectedFilters.maxPrice)
  params.append("maxPrice", selectedFilters.maxPrice);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/listing/search?${params}`
  );

  const data = await res.json();

  setResults(data.data || []);
  setTotal(data.total || 0);
  setPage(data.page || 1);
};


useEffect(() => {

  const params = new URLSearchParams(locationHook.search);

const urlLocation = params.get("location") || "";
const urlPickupDate = params.get("pickupDate") || getLocalDateStr();
const urlPickupTime = params.get("pickupTime") || getLocalTimeStr();
const urlReturnDate = params.get("returnDate") || getLocalDateStr();
const urlReturnTime = params.get("returnTime") || getLocalTimeStr();

  setLocation(urlLocation);
  setPickupDate(urlPickupDate);
  setPickupTime(urlPickupTime);
  setReturnDate(urlReturnDate);
  setReturnTime(urlReturnTime);

  // SEARCH immediately using URL values
  fetchResults(
    1,
    urlLocation,
    urlPickupDate,
    urlPickupTime,
    urlReturnDate,
    urlReturnTime
  );

}, [locationHook.search]);

useEffect(() => {
  fetchResults(
    page,
    location,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime
  );
}, [page, limit, sortBy, JSON.stringify(selectedFilters)]);
useEffect(() => {
  const loadFilters = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/listing/filters`);
    const data = await res.json();
    setFilters(data);
  };
  loadFilters();
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


  /* ================= VALIDATION ================= */
const handlePickupDateChange = (v) => {

  if (normalizeDate(v) < normalizeDate(getLocalDateStr())) {

    Swal.fire({
      icon: "error",
      title: "Invalid Date",
      text: "Pickup date cannot be in the past",
      confirmButtonColor: "#f4a640"
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
      text: "Pickup time cannot be in the past",
      confirmButtonColor: "#f4a640"
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

const handleResetFilters = () => {

  const resetState = {
    brands: [],
    categories: [],
    years: [],
    fuels: [],
    bikeTypes: [],
    features: [],
    transmissions: [],
    minPrice: "",
    maxPrice: "",
    search: "",
  };

  setSelectedFilters(resetState);

  const today = getLocalDateStr();
  const now = getLocalTimeStr();

  setLocation("");
  setPickupDate(today);
  setPickupTime(now);
  setReturnDate(today);
  setReturnTime(now);

  setPage(1);

  navigate("/listing");
};


  return (
    <>
{/* ================= PAGE HEADER ================= */}
<section className="relative bg-[#f7f9f8] py-28 text-center overflow-hidden">
  {/* subtle decorative blobs */}
  <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl"></div>
  <div className="absolute -top-32 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl"></div>

  <div className="relative z-10 px-4">
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
      Vehicle Listings
    </h1>
    <p className="mt-4 text-gray-600 text-base md:text-lg">
      Find the perfect vehicle for your journey
    </p>
  </div>
</section>


      {/* ================= SEARCH BAR (SAME AS HOME) ================= */}
      <section className="relative">
        {/* background split */}
{/* background split */}
<div
  className="
    absolute inset-x-0 top-0
    h-1/2
    bg-gradient-to-r
    from-[#fdf6ec]
    via-[#f7f9f8]
    to-[#eef6fb]
  "
></div>

<div className="absolute bottom-0 inset-x-0 h-1/2 bg-[#f9fafb]"></div>

        <div
          className="
            relative z-10
            max-w-[1180px] mx-auto
            -mt-[48px] lg:-mt-[56px]
            bg-white rounded-[18px]
            p-5 lg:p-[26px]
            grid grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]
            gap-4 lg:gap-[18px]
          shadow-[0_25px_50px_rgba(0,0,0,0.10)]

          "
        >
         
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
              setShowLocationSuggestions(false); // ✅ CLOSE AFTER CLICK
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
  pickupDate
    ? formatLocalDate(
        new Date(
          new Date(pickupDate).setFullYear(
            new Date(pickupDate).getFullYear() + 1
          )
        )
      )
    : ""
}

  className="h-[44px] rounded-lg bg-[#f3f3f3] px-3"
  value={returnDate}
  onChange={(e) => {
    if (normalizeDate(e.target.value) < normalizeDate(pickupDate)) {
      setError("Return date cannot be before pickup date");
      return;
    }

    setError("");
    setReturnDate(e.target.value);
  }}
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
onClick={() => {

  if (!location) {

    Swal.fire({
      icon: "warning",
      title: "Location Required",
      text: "Please select pickup location",
      confirmButtonColor: "#f4a640"
    });

    return;
  }

  if (!pickupDate || !returnDate) {

    Swal.fire({
      icon: "warning",
      title: "Missing Dates",
      text: "Please select pickup and return dates",
      confirmButtonColor: "#f4a640"
    });

    return;
  }

  if (!pickupTime || !returnTime) {

    Swal.fire({
      icon: "warning",
      title: "Missing Time",
      text: "Please select pickup and return time",
      confirmButtonColor: "#f4a640"
    });

    return;
  }

  const start = new Date(`${pickupDate}T${pickupTime}`);
  const end = new Date(`${returnDate}T${returnTime}`);

  if (end <= start) {

    Swal.fire({
      icon: "warning",
      title: "Invalid Selection",
      text: "Return date & time must be after pickup",
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


  navigate(
    `/listing?location=${location}&pickupDate=${pickupDate}&pickupTime=${pickupTime}&returnDate=${returnDate}&returnTime=${returnTime}`
  );

}}
  className="h-[44px] mt-6 px-7 bg-[#f4a640] rounded-lg text-white font-semibold hover:bg-[#e29630] transition flex items-center justify-center gap-2"
>
  <Search size={18} />
  Search
</button>

        </div>
      </section>

      {error && (
        <p className="text-red-500 text-sm text-center mt-3">{error}</p>
      )}

<section className="bg-[#f5f6f8] py-12 pb-20">
  <div className="max-w-[1280px] mx-auto px-4 space-y-6">

    {/* ================= TOOLBAR ================= */}
   <div className="bg-white border rounded-xl px-5 py-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">

  {/* LEFT INFO */}
  <p className="text-sm text-gray-600">
    Showing{" "}
    <span className="font-semibold">
      {(page - 1) * limit + 1}
    </span>
    –
    <span className="font-semibold">
      {Math.min(page * limit, total)}
    </span>{" "}
    of <span className="font-semibold">{total}</span> Vehicles
  </p>

  {/* RIGHT CONTROLS */}
  <div className="flex flex-wrap items-center gap-4">

    {/* SHOW LIMIT */}
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Show:</span>
      <select
        value={limit}
        onChange={(e) => {
          setLimit(Number(e.target.value));
          setPage(1);
          fetchResults(1);
        }}
        className="h-9 rounded-lg border px-3 bg-white focus:ring-2 focus:ring-[#0f766e]/30 outline-none"
      >
        <option value={9}>9</option>
        <option value={12}>12</option>
        <option value={18}>18</option>
      </select>
    </div>

    {/* SORT */}
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Sort By:</span>
      <select
        value={sortBy}
        onChange={(e) => {
          setSortBy(e.target.value);
          setPage(1);
          fetchResults(1);
        }}
        className="h-9 rounded-lg border px-3 bg-white focus:ring-2 focus:ring-[#0f766e]/30 outline-none"
      >
        <option value="newest">Newest</option>
        <option value="priceLow">Price: Low to High</option>
        <option value="priceHigh">Price: High to Low</option>
      </select>
    </div>

   {/* VIEW MODE */}
<div className="flex gap-2">
  <button
    onClick={() => setViewMode("grid")}
    className={`h-9 w-9 rounded-lg border flex items-center justify-center transition
      ${
        viewMode === "grid"
          ? "bg-[#0f766e] text-white border-[#0f766e]"
          : "bg-white hover:bg-gray-50"
      }`}
  >
    <LayoutGrid size={18} />
  </button>

  <button
    onClick={() => setViewMode("list")}
    className={`h-9 w-9 rounded-lg border flex items-center justify-center transition
      ${
        viewMode === "list"
          ? "bg-[#0f766e] text-white border-[#0f766e]"
          : "bg-white hover:bg-gray-50"
      }`}
  >
    <List size={18} />
  </button>
</div>


  </div>
</div>


    {/* ================= CONTENT GRID ================= */}
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

      {/* ================= SIDEBAR ================= */}
{/* ================= SIDEBAR ================= */}
<aside className="bg-white rounded-2xl border shadow-md p-6 space-y-6 lg:sticky lg:top-24 h-fit">

  {/* SEARCH */}
<div className="border-b pb-6 relative">
  <h4 className="font-semibold text-[15px] text-gray-800 mb-4">
    What Are You Looking For
  </h4>

  <div className="relative z-50">
    <input
      type="text"
      placeholder="Find your perfect ride..."
      value={selectedFilters.search}
      onChange={async (e) => {
        const value = e.target.value;

        setSelectedFilters((p) => ({ ...p, search: value }));

        if (!value || value.trim().length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/listing/suggestions?search=${value}
`
          );

          const data = await res.json();

          if (data.data?.length > 0) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        } catch (err) {
          console.error("Suggestion error", err);
        }
      }}
      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-[#0f766e]/40 focus:border-[#0f766e] outline-none transition"
    />

    {showSuggestions && (
      <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-xl overflow-hidden">
        {suggestions.map((item) => (
          <div
            key={item._id}
            onClick={() => {
              setSelectedFilters((p) => ({
                ...p,
                search: item.name,
              }));
              setShowSuggestions(false);
            }}
            className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer border-b last:border-none"
          >
            <div className="font-medium text-gray-800">
              {item.name}
            </div>
            <div className="text-xs text-gray-500">
              {item.brand?.trim()}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>


  {/* BRAND */}
  <FilterSection
    id="brand"
    title="Vehicle Brand"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
      {filters.brands.map((b) => (
        <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.brands.includes(b)}
            onChange={() => toggleFilter("brands", b)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {b}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* CATEGORY */}
  <FilterSection
    id="category"
    title="Vehicle Category"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="space-y-2">
      {filters.categories.map((c) => (
        <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.categories.includes(c._id)}
            onChange={() => toggleFilter("categories", c._id)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {c._id} ({c.count})
        </label>
      ))}
    </div>
  </FilterSection>

  {/* YEAR */}
  <FilterSection
    id="year"
    title="Year"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
      {filters.years.map((y) => (
        <label key={y} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.years.includes(y)}
            onChange={() => toggleFilter("years", y)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {y}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* FUEL */}
  <FilterSection
    id="fuel"
    title="Fuel Type"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="space-y-2">
      {filters.fuels.map((f) => (
        <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.fuels.includes(f)}
            onChange={() => toggleFilter("fuels", f)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {f}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* BIKE TYPE */}
  <FilterSection
    id="bikeType"
    title="Bike Type"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="space-y-2">
      {filters.bikeTypes.map((b) => (
        <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.bikeTypes.includes(b)}
            onChange={() => toggleFilter("bikeTypes", b)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {b}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* FEATURES */}
  <FilterSection
    id="features"
    title="Vehicle Specifications"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
      {filters.features.map((f) => (
        <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.features.includes(f)}
            onChange={() => toggleFilter("features", f)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {f}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* PRICE */}
  <FilterSection
    id="price"
    title="Price (Per Day)"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="grid grid-cols-2 gap-3">
      <input
        type="number"
        placeholder="Min ₹"
        value={selectedFilters.minPrice}
        onChange={(e) =>
          setSelectedFilters((p) => ({ ...p, minPrice: e.target.value }))
        }
        className="h-10 px-3 rounded-lg border text-sm"
      />
      <input
        type="number"
        placeholder="Max ₹"
        value={selectedFilters.maxPrice}
        onChange={(e) =>
          setSelectedFilters((p) => ({ ...p, maxPrice: e.target.value }))
        }
        className="h-10 px-3 rounded-lg border text-sm"
      />
    </div>
  </FilterSection>

  {/* TRANSMISSION */}
  <FilterSection
    id="transmission"
    title="Transmission"
    active={activeSection}
    setActive={setActiveSection}
  >
    <div className="space-y-2">
      {filters.transmissions.map((t) => (
        <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFilters.transmissions.includes(t)}
            onChange={() => toggleFilter("transmissions", t)}
            className="w-4 h-4 accent-[#0f766e]"
          />
          {t}
        </label>
      ))}
    </div>
  </FilterSection>

  {/* BUTTONS */}
  <div className="space-y-3 pt-4">
    <button
onClick={() =>
  fetchResults(
    1,
    location,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime
  )
}
      className="w-full h-11 bg-[#0f766e] text-white rounded-lg font-semibold hover:bg-[#0c5e59] transition"
    >
      Filter Results
    </button>

 <button
  onClick={handleResetFilters}
  className="w-full h-11 border rounded-lg hover:bg-gray-50 transition"
>
  Reset Filters
</button>

  </div>
</aside>



{/* ================= VEHICLE GRID ================= */}

<main
  className={`${
    viewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      : "flex flex-col gap-6"
  } items-stretch`}
>

{results.map((item) =>
  viewMode === "grid" ? (
<div
  key={item._id}
  className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
>


    <div className="bg-white rounded-[20px] shadow-md overflow-hidden flex flex-col h-full">

      {/* ================= IMAGE ================= */}
      <div className="relative p-4 pb-0">

        <div className="relative rounded-[16px] overflow-hidden">

<img
  src={item.imageUrl}
  alt={item.name}
  className="w-full h-auto rounded-2xl"
/>

          {/* HEART BUTTON */}


          {/* BRAND BADGE */}
          <span className="absolute bottom-3 left-3 bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow">
            {item.brand?.trim()}
          </span>

          {/* SLIDER DOTS */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-4 h-1 bg-orange-500 rounded-full"></span>
           
          </div>

        </div>
      </div>

      {/* ================= CONTENT ================= */}
   <div className="px-6 py-5 flex flex-col flex-1">

        {/* TITLE */}
        <h3 className="text-[18px] font-semibold text-gray-900 leading-snug">
          {item.name}
        </h3>

        {/* RATING */}
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

        {/* DIVIDER */}
<div className="border-t my-4"></div>

        {/* SPECS */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-5 text-sm text-gray-600">

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

        {/* LOCATION + PRICE */}
<div className="mt-5 bg-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between">

          <div className="flex items-center gap-2 text-sm text-gray-500 truncate max-w-[60%]">
            <MapPin size={15} />
            <span className="truncate">{item.mainLocation}</span>
          </div>

          <div className="text-right">
            <p className="text-[18px] font-bold text-red-600">
              ₹{item.pricing?.dailyPrice}
            </p>
            <p className="text-xs text-gray-500">/ Day</p>
          </div>

        </div>

        {/* BUTTON */}
        <button
  onClick={() =>
    navigate(
      `/listing/${item._id}?pickupDate=${pickupDate}&pickupTime=${pickupTime}&returnDate=${returnDate}&returnTime=${returnTime}`
    )
  }

className="mt-6 w-full bg-black text-white py-3 rounded-2xl font-semibold text-base hover:bg-gray-900 transition"
        >
          Rent Now
        </button>

      </div>
    </div>
</div>
) : (

/* ================= LIST VIEW ================= */

<div
  key={item._id}
  className="bg-white rounded-2xl shadow-md px-6 py-5 flex flex-col md:flex-row gap-6 items-center"
>

  {/* IMAGE */}
  <div className="relative w-full md:w-64 h-40">
    <img
      src={item.imageUrl}
      alt={item.name}
      className="w-full h-full object-cover rounded-xl"
    />

    {/* HEART */}

  </div>


  {/* DETAILS */}
  <div className="flex-1 space-y-3">

    {/* TITLE */}
    <h3 className="text-lg font-semibold text-gray-900">
      {item.name}
    </h3>

    {/* RATING */}
    <div className="flex items-center gap-2 text-orange-500">
      {[1,2,3,4,5].map((star)=>(
        <Star
          key={star}
          size={15}
          fill={
            star <= Math.round(item.avgRating || 0)
              ? "currentColor"
              : "none"
          }
        />
      ))}

      <span className="text-gray-500 text-sm">
        ({item.avgRating?.toFixed(1) || "0.0"})
      </span>

      <span className="text-gray-400 text-sm">
        {item.totalReviews || 0} Reviews
      </span>
    </div>

    {/* LOCATION */}
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <MapPin size={15}/>
      {item.mainLocation}
    </div>

    {/* SPECS */}
    <div className="flex flex-wrap gap-6 text-sm text-gray-600">

      {item.type === "Vehicle" ? (
        <>
          <span className="flex items-center gap-1">
            <Settings size={15}/> {item.transmission}
          </span>

          <span className="flex items-center gap-1">
            <Fuel size={15}/> {item.fuel}
          </span>

          <span className="flex items-center gap-1">
            <Cog size={15}/> {item.year}
          </span>

          <span className="flex items-center gap-1">
            <Users size={15}/> {item.seats} Seats
          </span>
        </>
      ) : (
        <>
          <span className="flex items-center gap-1">
            <Gauge size={15}/> {item.mileage} km/l
          </span>

          <span className="flex items-center gap-1">
            <Fuel size={15}/> {item.fuel}
          </span>

          <span className="flex items-center gap-1">
            <Bike size={15}/> {item.bikeType}
          </span>

          <span className="flex items-center gap-1">
            <Cog size={15}/> {item.year}
          </span>
        </>
      )}

    </div>

  </div>


  {/* PRICE + BUTTON */}
  <div className="text-right flex flex-col items-end gap-3">

    <p className="text-2xl font-bold text-red-600">
      ₹{item.pricing?.dailyPrice}
    </p>

    <button
  onClick={() =>
    navigate(
      `/listing/${item._id}?pickupDate=${pickupDate}&pickupTime=${pickupTime}&returnDate=${returnDate}&returnTime=${returnTime}`
    )
  }

      className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
    >
      Rent Now
    </button>

  </div>

</div>

))}

</main>



    </div>

    
{/* ================= PAGINATION ================= */}
{total > limit && (
  <div className="w-full flex justify-center mt-12 pb-16">
    <div className="flex items-center gap-2 flex-wrap justify-center">

      {/* PREV */}
      <button
        disabled={page === 1}
        onClick={() => fetchResults(
  page - 1,
  location,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime
)}
        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        ← Prev
      </button>

      {/* PAGE NUMBERS */}
      {Array.from(
        { length: Math.ceil(total / limit) },
        (_, i) => i + 1
      ).map((p) => (
        <button
          key={p}
          onClick={() => fetchResults(p)}
          className={`w-10 h-10 rounded-lg border text-sm font-medium transition
            ${
              p === page
                ? "bg-[#0f766e] text-white border-[#0f766e]"
                : "bg-white hover:bg-gray-50"
            }`}
        >
          {p}
        </button>
      ))}

      {/* NEXT */}
      <button
        disabled={page === Math.ceil(total / limit)}
        onClick={() => fetchResults(page + 1)}
        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Next →
      </button>
    </div>
  </div>
)}

  </div>
</section>


    </>
  );
}





function FilterSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h4 className="font-semibold text-[15px] text-gray-800">
          {title}
        </h4>

        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[800px] mt-4" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}


function Checkbox({ label }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" className="w-4 h-4" />
      {label}
    </label>
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


