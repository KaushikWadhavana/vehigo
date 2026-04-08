import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import {
  Search,
  MapPin,
  X,
  Calendar,
  Clock,
  User,
  Map,
  Wifi,
  Fuel,
  Radio,
  Usb,
  Receipt,
  Camera,
  Zap,
  Baby,
  Shield
} from "lucide-react";
import Swal from "sweetalert2";
import LocationPicker from "../../components/LocationPicker";

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US");
};

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(h);
  d.setMinutes(m);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function UserReservation() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const suggestionRef = useRef(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  /* MODAL STATES */
const [rentalDays,setRentalDays] = useState("");
  const [passengers, setPassengers] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
const [startTime, setStartTime] = useState("");
const [endTime, setEndTime] = useState("");
const [rentalType, setRentalType] = useState("Self Pickup");
const [vehicleStatus, setVehicleStatus] = useState("available");

const [sameReturn, setSameReturn] = useState(true);
const [extras, setExtras] = useState([]);

const [resSearch, setResSearch] = useState("");
const [resSort, setResSort] = useState("desc"); // desc = latest

// 🔥 OWNER RESPONSE STATE
const [reservations, setReservations] = useState([]);
const [selectedReservation, setSelectedReservation] = useState(null);

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
// 🔥 RESERVATION PAGINATION
const [reservationPage, setReservationPage] = useState(1);
const reservationsPerPage = 5;
  /* ================= FETCH ================= */
  const fetchVehicles = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await axios.post(
      "${import.meta.env.VITE_API_URL}/api/reservations/vehicles-status",
      {
        startDate: new Date(),
        endDate: new Date(),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setVehicles(res.data);
  };
// 🔥 FETCH USER RESERVATIONS
const fetchReservations = async () => {
  const token = await auth.currentUser.getIdToken();

  const res = await axios.get(
    "${import.meta.env.VITE_API_URL}/api/reservations/my-reservations",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  setReservations(res.data);
};
useEffect(() => {
  fetchVehicles();
  fetchReservations(); // 🔥 ADD THIS
}, []);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      suggestionRef.current &&
      !suggestionRef.current.contains(event.target)
    ) {
      setShowSuggestions(false);
      setShowLocationSuggestions(false); // 🔥 also close location dropdown
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
useEffect(() => {
  if (!selectedVehicle) return;

  if (rentalType === "Self Pickup") {
    // ✅ SELF
    setPickupLocation(selectedVehicle.mainLocation);
    setReturnLocation(selectedVehicle.mainLocation);
    setSameReturn(true);
  } else {
    // ✅ DELIVERY (CLEAR EVERYTHING)
    setPickupLocation("");
    setReturnLocation("");
    setSameReturn(false); // 🔥 user decides
  }
}, [selectedVehicle, rentalType]);

useEffect(() => {
  if (
    rentalType === "Delivery" &&
    sameReturn &&
    pickupLocation // 🔥 ONLY if user selected
  ) {
    setReturnLocation(pickupLocation);
  }
}, [pickupLocation, sameReturn, rentalType]);
  /* ================= SEARCH ================= */
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (!val) return setShowSuggestions(false);

    const filtered = vehicles
      .filter(
        (v) =>
          v.name?.toLowerCase().includes(val.toLowerCase()) ||
          v.ownerDetails?.name?.toLowerCase().includes(val.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  /* ================= LOCATION ================= */
  const handleLocation = (e) => {
    const val = e.target.value;
    setLocation(val);

    const unique = [...new Set(vehicles.map((v) => v.mainLocation))];

    const filtered = unique
      .filter((l) => l.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 5);

    setLocationSuggestions(filtered);
    setShowLocationSuggestions(true);
  };

  /* ================= FILTER ================= */
  const filtered = vehicles.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) &&
      v.mainLocation?.toLowerCase().includes(location.toLowerCase())
  );

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const current = filtered.slice(indexOfLast - itemsPerPage, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

useEffect(() => {
  if (!startDate || !startTime || !rentalDays) return;

  const days = Number(rentalDays);

  if (isNaN(days) || days < 1) return;

  const start = new Date(`${startDate}T${startTime}`);

  const end = new Date(start.getTime());
  end.setDate(end.getDate() + days); // 🔥 correct logic

  // 🔥 FORMAT SAFE
  const yyyy = end.getFullYear();
  const mm = String(end.getMonth() + 1).padStart(2, "0");
  const dd = String(end.getDate()).padStart(2, "0");

  const hh = String(end.getHours()).padStart(2, "0");
  const min = String(end.getMinutes()).padStart(2, "0");

  setEndDate(`${yyyy}-${mm}-${dd}`);
  setEndTime(`${hh}:${min}`);

}, [startDate, startTime, rentalDays]);

useEffect(() => {
  const checkStatus = async () => {
    if (!startDate || !endDate || !selectedVehicle) return;

    const token = await auth.currentUser.getIdToken();

    const res = await axios.post(
      "${import.meta.env.VITE_API_URL}/api/reservations/vehicles-status",
      { startDate, endDate },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const v = res.data.find(x => x._id === selectedVehicle._id);

    if (v) setVehicleStatus(v.status);
  };

  checkStatus();
}, [startDate, endDate]);

const toggleExtra = (extra) => {
  const exists = extras.find(e => e.key === extra.key);

  if (exists) {
    setExtras(extras.filter(e => e.key !== extra.key));
  } else {
    setExtras([...extras, extra]);
  }
};

useEffect(() => {
  if (!selectedVehicle) return;

  const vehicleExtras = selectedVehicle.extras || [];

  setExtras(vehicleExtras.map(e => {
  const service = SERVICES.find(s => s.key === e.key);

  return {
    key: e.key,
    price: e.price ?? service?.price ?? 0,
type:
  (e.type === "dynamic" ? "one_time" : e.type) ||
  (service?.type === "dynamic" ? "one_time" : service?.type) ||
  "one_time"
  };
})); // 🔥 auto select
}, [selectedVehicle]);
  /* ================= SUBMIT ================= */

useEffect(() => {
  if (rentalType === "Delivery") {
    if (sameReturn) {
      setReturnLocation(pickupLocation);
    }
  } else {
    // 🔥 SELF PICKUP → ALWAYS SAME LOCATION
    setReturnLocation(pickupLocation);
    setSameReturn(true);
  }
}, [rentalType, sameReturn, pickupLocation]);



const handleSubmit = async () => {

  if (!startDate) {
    Swal.fire("Validation", "Select start date", "warning");
    return;
  }
  // 🔥 BLOCK PAST DATE + TIME
const selectedStart = new Date(`${startDate}T${startTime}`);
const now = new Date();

if (selectedStart < now) {
  Swal.fire("Invalid", "Start time cannot be in the past", "warning");
  return;
}

  if (!startTime) {
    Swal.fire("Validation", "Select start time", "warning");
    return;
  }

  if (!pickupLocation) {
    Swal.fire("Validation", "Pickup location required", "warning");
    return;
  }

  if (!sameReturn && !returnLocation) {
    Swal.fire("Validation", "Return location required", "warning");
    return;
  }

  if (!passengers || passengers < 1) {
    Swal.fire("Validation", "Enter valid passengers", "warning");
    return;
  }

  if (passengers > 20) {
    Swal.fire("Validation", "Max 20 passengers allowed", "warning");
    return;
  }

  if (!rentalDays) {
  Swal.fire("Validation", "Enter rental days", "warning");
  return;
}

if (Number(rentalDays) < 1 || Number(rentalDays) > 30) {
  Swal.fire("Validation", "Rental days must be 1–30", "warning");
  return;
}

  if (vehicleStatus !== "available") {
    Swal.fire("Unavailable", "Vehicle not available", "error");
    return;
  }

  try {
    const token = await auth.currentUser.getIdToken();
/* ================= AVAILABILITY CHECK (BOOKING + RESERVATION) ================= */

try {

  const check = await axios.post(
    "${import.meta.env.VITE_API_URL}/api/reservations/vehicles-status",
    {
      startDate,
      endDate
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const currentVehicle = check.data.find(
    v => v._id === selectedVehicle._id
  );

  if (!currentVehicle) {
    Swal.fire("Error", "Vehicle not found", "error");
    return;
  }

  if (currentVehicle.status === "booked") {
    Swal.fire(
      "Not Available ❌",
      "Vehicle already booked for selected dates",
      "error"
    );
    return;
  }

  if (currentVehicle.status === "reserved") {
    Swal.fire(
      "Reserved ⚠️",
      "Vehicle already reserved for selected dates",
      "error"
    );
    return;
  }

} catch (err) {
  Swal.fire("Error", "Availability check failed", "error");
  return;
}
const res = await axios.post(
  "${import.meta.env.VITE_API_URL}/api/reservations/user",
  {
    vehicleIds: [selectedVehicle._id],
    startDate,
    endDate,
    startTime,
    endTime,
    rentalDays,
    rentalType,
    passengers,
    pickupLocation,
    extras,
    returnLocation,
    baseKilometers: selectedVehicle.baseKilometers || null,
    extraKmPrice: selectedVehicle.extraKmPrice || null
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

// 🔥 ADD THIS (MAIN FIX)
setReservations(prev => [
  {
    ...res.data.reservation,
    vehicle: {
      name: selectedVehicle.name,
      model: selectedVehicle.model,
      image: selectedVehicle.image
    },
    payment: {
      method: null,
      status: "Pending",
      amount: res.data.reservation.totalAmount
    },
    isLocked: false,
    full: res.data.reservation
  },
  ...prev
]);
Swal.fire("Success 🎉", "Request sent to owner!", "success");

// 🔥 RESET ALL FIELDS
setSelectedVehicle(null);
setExtras([]);
setPassengers("");
setStartDate("");
setEndDate("");
setStartTime("");
setEndTime("");
setPickupLocation("");
setReturnLocation("");
setRentalDays("");
setSameReturn(true);

  } catch (err) {

  const msg = err.response?.data?.message || "";

  if (msg.includes("already requested")) {
    Swal.fire("Already Requested ⚠️", msg, "warning");
    return;
  }

  Swal.fire("Error", msg || "Failed", "error");
}
};


const SERVICES = [
{ key:"wifi", title:"Wi-Fi Hotspot", desc:"Portable internet connection", price:300, type:"one_time", icon:Wifi },
{ key:"fuel", title:"Fuel Pre-Purchase", desc:"Return without refueling", price:500, type:"one_time", icon:Fuel },
{ key:"toll", title:"Toll Pass", desc:"Skip toll booth lines", price:250, type:"one_time", icon:Receipt },
{ key:"dashcam", title:"Dash Cam", desc:"Trip recording security", price:180, type:"per_day", icon:Camera },
{ key:"childSeat", title:"Child Seat", desc:"Secure infant safety seat", price:220, type:"per_day", icon:Baby },
{ key:"roadside", title:"Roadside Assist", desc:"24/7 emergency help", price:150, type:"per_day", icon:Shield }
]

const today = new Date().toISOString().split("T")[0];
const currentYear = new Date().getFullYear();
const maxDate = `${currentYear}-12-31`;

const resetModal = () => {
  setSelectedVehicle(null);

  setRentalDays("");
  setPassengers("");
  setPickupLocation("");
  setReturnLocation("");
  setStartDate("");
  setEndDate("");
  setStartTime("");
  setEndTime("");
  setExtras([]);
  setSameReturn(true);
  setRentalType("Self Pickup");
};

const handlePayment = async () => {
  const { value } = await Swal.fire({
    title: "Select Payment Method",
    input: "radio",
    inputOptions: {
      pickup: "Pay at Pickup",
      razorpay: "Online (Razorpay)"
    },
    inputValidator: (value) => {
      if (!value) return "Select payment method";
    }
  });

  if (!value) return;

  const token = await auth.currentUser.getIdToken();

  // ================= PICKUP =================
if (value === "pickup") {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/reservations/pay-pickup/${selectedReservation._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Success", "Pay at pickup selected", "success");
    
    setSelectedReservation(null);
    
    fetchReservations();

  } catch (err) {

  const msg = err.response?.data?.message || "";

  // 🔥 HANDLE ALL CONFLICT CASES
  if (
    msg.includes("already booked") ||
    msg.includes("already reserved") ||
    msg.includes("Vehicle")
  ) {
    Swal.fire("Too Late 😢", msg, "error");
    setSelectedReservation(null);
    return;
  }

  // 🔥 SHOW REAL ERROR
  Swal.fire("Error", msg || "Something went wrong", "error");
}
  return;
}

  // ================= RAZORPAY =================
  if (value === "razorpay") {
// 🔥 STEP 1: CHECK FIRST
try {
  await axios.post(
    "${import.meta.env.VITE_API_URL}/api/reservations/verify-payment",
    {
      reservationId: selectedReservation._id,
      checkOnly: true
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
} catch (err) {
  const msg = err.response?.data?.message || "";

  Swal.fire("Too Late 😢", msg || "Vehicle already booked", "error");
  setSelectedReservation(null);
  return;
}

// 🔥 STEP 2: THEN CREATE ORDER
const orderRes = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/reservations/create-order/${selectedReservation._id}`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

    const options = {
      key: "rzp_test_SR3nZhx9Spit96",
      amount: orderRes.data.amount,
      currency: "INR",
      name: "Vehicle Rental",
      description: "Reservation Payment",
      order_id: orderRes.data.id,

handler: async function (response) {
  try {

    await axios.post(
      "${import.meta.env.VITE_API_URL}/api/reservations/verify-payment",
      {
        reservationId: selectedReservation._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Success 🎉", "Payment successful", "success");
    setSelectedReservation(null);

    fetchReservations();

  } catch (err) {

const msg = err.response?.data?.message || "";

if (
  msg.includes("already booked") ||
  msg.includes("already reserved") ||
  msg.includes("Vehicle")
) {
  Swal.fire("Too Late 😢", msg, "error");
  setSelectedReservation(null);
  return;
}

    Swal.fire("Error", "Payment verification failed", "error");
  }
},

      theme: {
        color: "#f97316"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }
};
const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7); // 🔥 +7 days
  return d.toISOString().split("T")[0];
};

// 🔥 FILTER
let filteredReservations = reservations.filter((r) => {
  const term = resSearch.toLowerCase();

  return (
    r.vehicle?.name?.toLowerCase().includes(term) ||
    r.vehicle?.model?.toLowerCase().includes(term)
  );
});

// 🔥 SORT
filteredReservations.sort((a, b) => {
  if (resSort === "asc") {
    return new Date(a.createdAt) - new Date(b.createdAt);
  } else {
    return new Date(b.createdAt) - new Date(a.createdAt);
  }
});

// 🔥 PAGINATION
const indexOfLastReservation = reservationPage * reservationsPerPage;

const currentReservations = filteredReservations.slice(
  indexOfLastReservation - reservationsPerPage,
  indexOfLastReservation
);

const totalReservationPages = Math.ceil(
  filteredReservations.length / reservationsPerPage
);
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">

        <h2 className="text-2xl font-semibold mb-6">
          Vehicle Reservation
        </h2>

        {/* SEARCH */}
        <div className="flex gap-3 mb-6 flex-wrap">

          {/* SEARCH */}
          <div className="relative w-80" ref={suggestionRef}>
            <Search className="absolute top-3 left-3 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search vehicle / owner..."
              className="pl-10 pr-4 py-3 border rounded-xl w-full text-sm"
            />

            {showSuggestions && (
              <div className="absolute w-full bg-white border rounded-xl shadow mt-2 z-50">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSearch(s.name);
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <img
                      src={s.image}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.ownerDetails?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCATION */}
          <div className="relative w-64">
            <MapPin className="absolute top-3 left-3 w-4 h-4 text-gray-400" />

            <input
              value={location}
              onChange={handleLocation}
              placeholder="Location..."
              className="pl-9 pr-4 py-3 border rounded-xl w-full text-sm"
            />

            {showLocationSuggestions && (
              <div className="absolute w-full bg-white border rounded-xl shadow mt-2 z-50">
                {locationSuggestions.map((loc, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setLocation(loc);
                      setShowLocationSuggestions(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-gray-50 border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">
            Vehicles ({filtered.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-sm">
<thead className="border-b text-gray-600">
  <tr>
    <th className="p-3 text-left w-[30%]">Vehicle</th>
    <th className="p-3 text-left w-[30%]">Owner</th>
    <th className="p-3 text-center w-[15%]">Price</th>
    <th className="p-3 text-center w-[15%]">Location</th>
    <th className="p-3 text-center w-[10%]">Action</th>
  </tr>
</thead>

              <tbody>
                {current.map((v) => (
                  <tr key={v._id} className="border-b hover:bg-gray-100">

                    <td className="p-3">
                      <div className="flex gap-3 items-center">
                        <img src={v.image} className="w-14 h-12 rounded" />
                        <div>
                          <p className="font-medium">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.brand}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2 items-center">
                        <img
                          src={v.ownerDetails?.image}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">
                            {v.ownerDetails?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {v.ownerDetails?.email}
                          </p>
                        </div>
                      </div>
                    </td>

            <td className="p-3 text-center font-semibold whitespace-nowrap">
  ₹{v.pricing?.dailyPrice} / day
</td>

              <td className="p-3 text-center">
  <div className="max-w-[120px] mx-auto overflow-x-auto whitespace-nowrap">
    {v.mainLocation}
  </div>
</td>

<td className="p-3 text-center">
  <button
    onClick={() => {
  resetModal();     // clear old
  setSelectedVehicle(v);
}}
    className="px-4 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
    Reserve
  </button>
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
        className={`w-8 h-8 rounded-md flex items-center justify-center ${
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

        {/* ================= OWNER RESPONSE TABLE ================= */}
<div className="bg-gray-50 border rounded-2xl p-6 mt-8">
<div className="flex flex-wrap gap-3 justify-between items-center mb-4">

  <h3 className="font-semibold">
    Owner Response of Reservation
  </h3>

  <div className="flex gap-2">

    {/* SEARCH */}
    <input
      value={resSearch}
      onChange={(e) => setResSearch(e.target.value)}
      placeholder="Search vehicle..."
      className="border px-3 py-2 rounded-lg text-sm"
    />

    {/* SORT */}
    <select
      value={resSort}
      onChange={(e) => setResSort(e.target.value)}
      className="border px-3 py-2 rounded-lg text-sm"
    >
      <option value="desc">Latest</option>
      <option value="asc">Oldest</option>
    </select>

  </div>

</div>
  <div className="overflow-x-auto">
    <table className="min-w-[1000px] w-full text-sm">

      <thead className="border-b text-gray-600">
        <tr>
          <th className="p-3 text-left w-[30%]">Car</th>
          <th className="p-3 text-left w-[25%]">Request Date</th>
          <th className="p-3 text-center w-[15%]">Amount</th>
          <th className="p-3 text-center w-[15%]">Status</th>
<th className="p-3 text-center w-[15%]">Payment</th> {/* 🔥 ADD */}
<th className="p-3 text-center w-[15%]">Action</th>
        </tr>
      </thead>

      <tbody>
        {currentReservations.map((r) => (
          <tr key={r._id} className="border-b hover:bg-gray-100">

            {/* CAR */}
            <td className="p-3">
              <div className="flex gap-3 items-center">
                <img src={r.vehicle.image} className="w-14 h-12 rounded"/>
                <div>
                  <p className="font-medium">{r.vehicle.name}</p>
                  <p className="text-xs text-gray-500">{r.vehicle.model}</p>
                </div>
              </div>
            </td>

            {/* DATE */}
            <td className="p-3">
              {new Date(r.createdAt).toLocaleString()}
            </td>

            {/* AMOUNT */}
            <td className="p-3 text-center font-semibold">
              ₹{r.totalAmount}
            </td>

            {/* STATUS */}
            <td className="p-3 text-center">
              <span className={`px-3 py-1 text-xs rounded-full
                ${r.approvalStatus === "approved" && "bg-green-100 text-green-600"}
                ${r.approvalStatus === "pending" && "bg-yellow-100 text-yellow-600"}
                ${r.approvalStatus === "rejected" && "bg-red-100 text-red-600"}
              `}>
                {r.approvalStatus}
              </span>
            </td>
{/* 🔥 PAYMENT STATUS */}
{/* 🔥 PAYMENT STATUS */}
<td className="p-3 text-center">
  <span
className={`px-3 py-1 text-xs rounded-full
  ${
    r.approvalStatus !== "approved"
      ? "bg-yellow-100 text-yellow-600"
      : r.isLocked
      ? "bg-red-100 text-red-600"
      : r.payment?.status === "Paid"
      ? "bg-green-100 text-green-600"
      : r.payment?.method === "pickup"
      ? "bg-blue-100 text-blue-600"
      : "bg-yellow-100 text-yellow-600"
  }
`}
  >
{
  r.approvalStatus !== "approved"
    ? "Pending"
    : r.isLocked
    ? "Too Late"
    : r.payment?.method === "pickup"
    ? "Pickup Selected"
    : r.payment?.status === "Paid"
    ? "Online Paid"
    : "Pending"
}
  </span>
</td>
            {/* ACTION */}
            <td className="p-3 text-center">
              <button
                onClick={() => setSelectedReservation(r)}
                className="px-4 py-1 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                View
              </button>
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
    {filteredReservations.length === 0
      ? 0
      : (reservationPage - 1) * reservationsPerPage + 1}{" "}
    to {Math.min(reservationPage * reservationsPerPage, filteredReservations.length)} of{" "}
    {filteredReservations.length}
  </p>

  {/* RIGHT BUTTONS */}
  <div className="flex items-center gap-2">

    {/* PREV */}
    <button
      disabled={reservationPage === 1}
      onClick={() => setReservationPage((p) => p - 1)}
      className={`px-4 py-1 rounded-lg border ${
        reservationPage === 1
          ? "text-gray-400 border-gray-200 cursor-not-allowed"
          : "hover:bg-gray-100"
      }`}
    >
      Prev
    </button>

    {/* PAGE NUMBERS */}
    {[...Array(totalReservationPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setReservationPage(i + 1)}
        className={`w-8 h-8 rounded-md flex items-center justify-center ${
          reservationPage === i + 1
            ? "bg-teal-600 text-white"
            : "border hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    {/* NEXT */}
    <button
      disabled={reservationPage === totalReservationPages}
      onClick={() => setReservationPage((p) => p + 1)}
      className={`px-4 py-1 rounded-lg border ${
        reservationPage === totalReservationPages
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

{selectedVehicle && (
<div
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
  onClick={resetModal}
>
  <div
  className="bg-white w-[600px] rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
>
      {/* CLOSE */}
      <button
        onClick={resetModal}
        className="absolute right-4 top-4"
      >
        <X />
      </button>

      {/* HEADER */}
      <div className="flex gap-4 items-center mb-6">
        <img src={selectedVehicle.image} className="w-20 h-16 rounded-lg"/>
        <div>
          <h3 className="text-lg font-bold">{selectedVehicle.name}</h3>
          <p className="text-sm text-gray-500">{selectedVehicle.brand}</p>

          <span className={`px-3 py-1 text-xs rounded-full
            ${vehicleStatus === "available" && "bg-green-100 text-green-600"}
            ${vehicleStatus === "reserved" && "bg-yellow-100 text-yellow-600"}
            ${vehicleStatus === "booked" && "bg-red-100 text-red-600"}
          `}>
            {vehicleStatus}
          </span>
        </div>
      </div>

      {/* RENTAL TYPE */}
      <label className="text-sm font-medium">Rental Type</label>
      <select
        value={rentalType}
        onChange={(e) => setRentalType(e.target.value)}
        className="w-full border p-3 rounded-lg mb-4"
      >
        <option>Self Pickup</option>
        <option>Delivery</option>
      </select>

      {/* RENTAL DAYS */}
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={14}/>
        <label className="text-sm font-medium">Rental Days (1 - 30)</label>
      </div>
<input
  type="number"
  value={rentalDays || ""}
  onChange={(e) => setRentalDays(e.target.value)}
  placeholder="Enter rental days"
  min={1}
  max={30}
  className="w-full border p-3 rounded-lg mb-4"
/>

      {/* PASSENGERS */}
      <div className="flex items-center gap-2 mb-1">
        <User size={14}/>
        <label className="text-sm font-medium">Passengers (Max 20)</label>
      </div>
      <input
        type="number"
        value={passengers}
        onChange={(e) => {
          let val = Number(e.target.value);
          if (val < 1) val = 1;
          if (val > 20) val = 20;
          setPassengers(val);
        }}
        className="w-full border p-3 rounded-lg mb-4"
      />
<p className="text-xs text-gray-500 mb-2">
  Minimum booking allowed after 7 days from today
</p>
      {/* DATE + TIME */}
      <div className="flex items-center gap-2 mb-1">
 
  <Calendar size={14}/>
  
  <label className="text-sm font-medium">Start Date & Time</label>
</div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <input
  type="date"
  min={getMinDate()}
  max={maxDate}
  onChange={(e)=>setStartDate(e.target.value)}
  className="border p-3 rounded-lg"
/>
        <input type="time" onChange={(e)=>setStartTime(e.target.value)} className="border p-3 rounded-lg"/>
      </div>
<div className="flex items-center gap-2 mb-1">
  <Clock size={14}/>
      <label className="text-sm font-medium">End Date & Time</label>
</div>

<div className="grid grid-cols-2 gap-3 mb-4">

  {/* END DATE */}
  <div className="relative">
    <input
      type="text"
      value={formatDate(endDate)}
            readOnly
      className="w-full border p-3 rounded-xl bg-white"
    />
    <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400"/>
  </div>

  {/* END TIME */}
  <div className="relative">
    <input
      type="text"
   value={formatTime(endTime)}
      readOnly
      className="w-full border p-3 rounded-xl bg-white"
    />
    <Clock className="absolute right-3 top-3 w-4 h-4 text-gray-400"/>
  </div>

</div>

      {/* LOCATION */}
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={14}/>
      <label className="text-sm font-medium">Pickup Location</label>
      </div>


      {rentalType === "Self Pickup" ? (
        <input value={pickupLocation} readOnly className="w-full border p-3 mb-3 rounded-lg bg-gray-100"/>
      ) : (
        <LocationPicker onSelect={(l)=>setPickupLocation(l.address)} />
      )}

      {/* SAME RETURN CHECKBOX */}
      {rentalType === "Delivery" && (
        <div className="flex items-center gap-2 my-3">
          <input
            type="checkbox"
            checked={sameReturn}
            onChange={(e)=>setSameReturn(e.target.checked)}
          />
          <label className="text-sm">Same return location</label>
        </div>
      )}

      {/* RETURN LOCATION */}
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={14}/>
      <label className="text-sm font-medium">Return Location</label>
      </div>

{rentalType === "Self Pickup" ? (
  <input
    value={pickupLocation}
    readOnly
    className="w-full border p-3 mb-4 rounded-lg bg-gray-100"
  />
) : sameReturn ? (
  <input
    value={pickupLocation || ""} // 🔥 prevent auto wrong
    placeholder="Select pickup location first"
    readOnly
    className="w-full border p-3 mb-4 rounded-lg bg-gray-100"
  />
) : (
  <LocationPicker onSelect={(l)=>setReturnLocation(l.address)} />
)}
      {/* EXTRAS */}
{(selectedVehicle.extras?.length > 0 || SERVICES.length > 0) && (
  <>
    <div className="flex items-center gap-2 mb-2">
      <User size={16}/>
      <label className="text-sm font-medium">Extra Services</label>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-5">

      {SERVICES.map((service, i) => {
        const Icon = service.icon;

        const vehicleExtra = selectedVehicle.extras?.find(
          e => e.key === service.key
        );

        const isSelected = extras.find(e => e.key === service.key);

        return (
          <div
            key={i}
       onClick={() => {
  if (vehicleExtra) {
    toggleExtra(vehicleExtra); // vehicle extra
  } else {
    // 🔥 allow manual select
toggleExtra({
  key: service.key,
  price: service.price,
  type: service.type === "dynamic" ? "one_time" : service.type
});
  }
}}
            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition
              ${isSelected
                ? "bg-green-50 border-green-500"
                : vehicleExtra
                  ? "hover:bg-gray-100"
                  : "opacity-40 cursor-not-allowed"}
            `}
          >
            {/* ICON */}
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg
              ${isSelected ? "bg-green-600 text-white" : "bg-gray-900 text-white"}
            `}>
              <Icon size={16}/>
            </div>

            {/* TEXT */}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {service.title}
              </p>

       <p className="text-xs text-gray-500">
  ₹{vehicleExtra?.price ?? service.price} 
  ({vehicleExtra?.type ?? service.type})
</p>
            </div>

            {/* CHECK */}
            <input
              type="checkbox"
              checked={!!isSelected}
              readOnly
            />
          </div>
        );
      })}

    </div>
  </>
)}

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={vehicleStatus !== "available"}
        className={`w-full py-3 rounded-xl text-white font-semibold
          ${vehicleStatus !== "available"
            ? "bg-gray-400"
            : "bg-gradient-to-r from-orange-500 to-red-500"}
        `}
      >
        {vehicleStatus === "available"
          ? "Send Reservation Request"
          : "Not Available"}
      </button>

    </div>
  </div>
)}

{/* ================= OWNER RESPONSE MODAL ================= */}
{selectedReservation && (
<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
     onClick={() => setSelectedReservation(null)}>

  <div
    className="bg-white w-[600px] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
    onClick={(e) => e.stopPropagation()}
  >

    {/* HEADER */}
    <div className="flex gap-4 items-center mb-4">
      <img src={selectedReservation.vehicle.image} className="w-20 h-16 rounded"/>
      <div>
        <h2 className="font-bold">{selectedReservation.vehicle.name}</h2>
        <p className="text-sm text-gray-500">{selectedReservation.vehicle.model}</p>
      </div>
    </div>

    {/* STATUS */}
    <div className="mb-4">
      <span className={`px-3 py-1 rounded-full text-sm
        ${selectedReservation.approvalStatus === "approved" && "bg-green-100 text-green-600"}
        ${selectedReservation.approvalStatus === "pending" && "bg-yellow-100 text-yellow-600"}
        ${selectedReservation.approvalStatus === "rejected" && "bg-red-100 text-red-600"}
      `}>
        {selectedReservation.approvalStatus}
      </span>
    </div>

{/* 🔥 FULL RESERVATION DETAILS */}
<div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm space-y-2">

  <p><b>Rental Type:</b> {selectedReservation.full?.rentalType}</p>

  <p><b>Rental Days:</b> {selectedReservation.full?.rentalDays}</p>

  <p><b>Passengers:</b> {selectedReservation.full?.passengers}</p>

  <p>
    <b>Start:</b>{" "}
    {selectedReservation.full?.startDate
      ? new Date(selectedReservation.full.startDate).toLocaleDateString()
      : "-"}{" "}
    {selectedReservation.full?.startTime || ""}
  </p>

  <p>
    <b>End:</b>{" "}
    {selectedReservation.full?.endDate
      ? new Date(selectedReservation.full.endDate).toLocaleDateString()
      : "-"}{" "}
    {selectedReservation.full?.endTime || ""}
  </p>

  <p><b>Pickup:</b> {selectedReservation.full?.pickupLocation}</p>

  <p><b>Return:</b> {selectedReservation.full?.returnLocation}</p>

</div>

{/* 🔥 EXTRAS */}
{selectedReservation.full?.extras?.length > 0 && (
  <div className="bg-gray-50 p-4 rounded-lg mb-4">
    <h4 className="font-semibold mb-2">Extras</h4>

    {selectedReservation.full.extras.map((e, i) => (
      <div key={i} className="flex justify-between text-sm">
        <span>{e.key}</span>
        <span>₹{e.price} ({e.type})</span>
      </div>
    ))}
  </div>
)}

{/* 🔥 PRICE DETAILS */}
<div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">

  <h4 className="font-semibold mb-2">Price Details</h4>

  <div className="text-sm space-y-1">

    <div className="flex justify-between">
      <span>Base Price</span>
      <span>
        ₹{
   (selectedReservation.totalAmount || 0)
- (selectedReservation.full?.tollAmount || 0)
- (selectedReservation.full?.securityDeposit || 0)
- (selectedReservation.full?.extras || []).reduce((sum, e) => {
  return e.type === "per_day"
    ? sum + e.price * (selectedReservation.full?.rentalDays || 1)
    : sum + e.price;
}, 0)
        }
      </span>
    </div>

    <div className="flex justify-between">
      <span>Extras</span>
      <span>
        ₹{
          (selectedReservation.full?.extras || []).reduce((sum, e) => {
            return e.type === "per_day"
              ? sum + e.price * (selectedReservation.full?.rentalDays || 1)
              : sum + e.price;
          }, 0)
        }
      </span>
    </div>

    {/* BASE KM */}
{/* BASE KM + EXTRA KM PRICE */}
{selectedReservation.approvalStatus === "approved" && (
  <>
    <div className="flex justify-between">
      <span>Included KM</span>
      <span>
 {selectedReservation.full?.isUnlimitedKm
  ? "Unlimited"
  : selectedReservation.full?.baseKilometers
  ? `${selectedReservation.full.baseKilometers} km/day`
  : "-"}
      </span>
    </div>

    <div className="flex justify-between">
      <span>Extra KM Price</span>
      <span>
        {selectedReservation.full?.extraKmPrice
          ? `₹${selectedReservation.full.extraKmPrice}/km`
          : "-"}
      </span>
    </div>
  </>
)}
{/* TOLL */}
<div className="flex justify-between">
  <span>Toll</span>
  <span>₹{selectedReservation.full?.tollAmount || 0}</span>
</div>

    {/* TOTAL */}
    <div className="flex justify-between font-bold border-t pt-2 mt-2">
      <span>Total</span>
      <span>₹{selectedReservation.totalAmount}</span>
    </div>

  </div>

</div>
    {/* REJECT */}
    {selectedReservation.approvalStatus === "rejected" && (
      <div className="bg-red-50 border border-red-200 p-3 rounded mb-4 text-red-600">
        <b>Reason:</b> {selectedReservation.rejectionReason}
      </div>
    )}

    {/* APPROVED → PAYMENT */}
{selectedReservation.approvalStatus === "approved" && (

  selectedReservation.isLocked ? (

    <button className="w-full py-3 bg-red-500 text-white rounded-lg cursor-not-allowed">
      Too Late 😢 Already booked
    </button>

  ) : selectedReservation.payment?.method === "pickup" ? (

    <button className="w-full py-3 bg-blue-500 text-white rounded-lg cursor-not-allowed">
      Pickup Selected ✅
    </button>

  ) : selectedReservation.payment?.status === "Paid" ? (

    <button className="w-full py-3 bg-green-600 text-white rounded-lg cursor-not-allowed">
      Online Paid ✅
    </button>

  ) : (

    <button
      onClick={handlePayment}
      className="w-full py-3 bg-green-600 text-white rounded-lg"
    >
      Pay ₹{selectedReservation.totalAmount}
    </button>

  )

)}

    <button
      onClick={() => setSelectedReservation(null)}
      className="mt-3 w-full border py-2 rounded-lg"
    >
      Close
    </button>

  </div>
</div>
)}
    </div>
  );
}