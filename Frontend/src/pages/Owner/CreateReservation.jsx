import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  User,
  Puzzle,
  FileText,
  Info,
  Calendar,
Clock,
  Map,
  Wifi,
  Radio,
  Usb,
  Receipt,
  Camera,
  Zap,
  Baby,
  Shield,
  Fuel,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import LocationPicker from "../../components/LocationPicker";
/* ================= DATE HELPERS ================= */


import { useLocation } from "react-router-dom";
const formatDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes("-")) return "";

  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
};

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

const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";

  const [hour, minute] = timeStr.split(":");

  const date = new Date();
  date.setHours(hour, minute);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default function CreateReservation() {

  const navigate = useNavigate();
  const location = useLocation();
const requestData = location.state?.reservation;
 

const [rentalDays,setRentalDays] = useState(1);
const [rentalType,setRentalType] = useState("Self Pickup");
const [passengers,setPassengers] = useState("");


const [startDate,setStartDate] = useState(getLocalDateStr());
const [startTime,setStartTime] = useState(getLocalTimeStr());

const [endDate,setEndDate] = useState("");
const [endTime,setEndTime] = useState("");

const [pickupLocation,setPickupLocation] = useState("");
const [returnLocation,setReturnLocation] = useState("");

const [deposit,setDeposit] = useState(0);
const [sameLocation,setSameLocation] = useState(false);

const [vehicles,setVehicles] = useState([]);
const [selectedVehicle,setSelectedVehicle] = useState([]);


  const [activeTab, setActiveTab] = useState("car");

  const [carCompleted,setCarCompleted] = useState(false)
const [customerCompleted,setCustomerCompleted] = useState(false)
const [extrasCompleted,setExtrasCompleted] = useState(false)

const [isUnlimitedKm, setIsUnlimitedKm] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState("");

const [baseKm, setBaseKm] = useState("");
const [extraKmPrice, setExtraKmPrice] = useState("");
const [selectedExtras,setSelectedExtras] = useState([])

const [showPricing,setShowPricing] = useState(false)

  const tabs = [
    { key: "car", label: "Car & Dates Info", icon: CalendarDays },
    { key: "customer", label: "Customer", icon: User },
    { key: "extras", label: "Extra Services", icon: Puzzle },
    { key: "billing", label: "Billing Details", icon: FileText }
  ];

  useEffect(()=>{

if(activeTab === "extras"){
setShowPricing(true)
}

},[activeTab])

useEffect(() => {

if (!startDate) return;

const unsubscribe = auth.onAuthStateChanged(async (user) => {

  if (!user) {
    console.log("User not logged in yet");
    return;
  }

  try {

    const token = await user.getIdToken();
const calculatedEndDate = (() => {
  if (!startDate || !rentalDays) return startDate;

  const start = new Date(startDate);
  const end = new Date(start);

  end.setDate(start.getDate() + Number(rentalDays));

  return end.toISOString().split("T")[0];
})();

    const res = await fetch(
      "${import.meta.env.VITE_API_URL}/api/reservations/vehicles-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ FIX
        },
body: JSON.stringify({
  startDate,
  endDate: calculatedEndDate
})
      }
    );


    const data = await res.json();

    if (Array.isArray(data)) {
      setVehicles(data);
    } else {
      console.error("API ERROR:", data);
      setVehicles([]);
    }

  } catch (err) {
    console.error(err);
    setVehicles([]);
  }

});

return () => unsubscribe();

}, [startDate, rentalDays]);


const validateCarForm = () => {

const today = getLocalDateStr();
const now = getLocalTimeStr();

/* RENTAL DAYS */
if (!rentalDays || rentalDays < 1) {
Swal.fire("Validation", "Enter rental days", "warning");
return false;
}
/* RENTAL DAYS MAX */
if (rentalDays > 30) {
  Swal.fire("Validation", "Maximum rental days is 30", "warning");
  return false;
}


/* PASSENGERS (REQUIRED) */
if (!passengers) {
Swal.fire("Validation", "Enter number of passengers", "warning");
return false;
}

if (Number(passengers) < 1) {
Swal.fire("Validation", "Passengers must be at least 1", "warning");
return false;
}

/* START DATE */
if (!startDate) {
Swal.fire("Validation", "Select start date", "warning");
return false;
}

if (normalizeDate(startDate) < normalizeDate(today)) {
Swal.fire("Validation", "Start date cannot be past", "warning");
return false;
}

/* START TIME */
if (!startTime) {
Swal.fire("Validation", "Select pickup time", "warning");
return false;
}

if (startDate === today && startTime < now) {
Swal.fire("Validation", "Pickup time cannot be past", "warning");
return false;
}

/* PICKUP LOCATION */
if (!pickupLocation || pickupLocation.trim() === "") {
Swal.fire("Validation", "Select pickup location", "warning");
return false;
}

/* RETURN LOCATION */
if (!sameLocation && (!returnLocation || returnLocation.trim() === "")) {
Swal.fire("Validation", "Select return location", "warning");
return false;
}

/* SECURITY DEPOSIT (REQUIRED) */
if (deposit === "" || deposit === null) {
Swal.fire("Validation", "Enter security deposit", "warning");
return false;
}

if (Number(deposit) < 0) {
Swal.fire("Validation", "Security deposit cannot be negative", "warning");
return false;
}

/* VEHICLE */
if (!selectedVehicle.length) {
Swal.fire("Validation", "Select at least one vehicle", "warning");
return false;
}

return true;

};
  return (
    <div className="p-6 md:p-8 bg-gray-100 min-h-screen">

{/* HEADER */}
<div className="flex items-center gap-3 mb-6">
  <button onClick={() => navigate(-1)}>
    <ArrowLeft size={18}/>
  </button>

  <h1
    onClick={() => navigate(-1)}
    className="text-lg font-semibold cursor-pointer"
  >
    Reservation
  </h1>
</div>
{requestData && (
  <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">

    <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
      <Info size={16} />
      User Request Details
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">

      {/* CUSTOMER */}
      <div>
        <p className="text-gray-500">Customer</p>
        <p className="font-semibold">
          {requestData.customer?.name || "-"}
        </p>
        <p className="text-xs text-gray-400">
          {requestData.customer?.email || "-"}
        </p>
      </div>

      {/* VEHICLE (supports single + multiple) */}
      <div>
        <p className="text-gray-500">Vehicle</p>

        {requestData.vehicles?.length > 0 ? (
          <div className="flex flex-col gap-1">
            {requestData.vehicles.map((v, i) => (
              <p key={i} className="font-semibold text-sm">
                {v?.name || `${v?.brand || ""} ${v?.model || ""}`}
              </p>
            ))}
          </div>
        ) : (
          <p className="font-semibold">
            {requestData.vehicle?.name ||
              `${requestData.vehicle?.brand || ""} ${requestData.vehicle?.model || ""}` ||
              "-"}
          </p>
        )}
      </div>

      {/* RENTAL TYPE */}
      <div>
        <p className="text-gray-500">Rental Type</p>
        <p className="font-semibold">
          {requestData.rentalType || "-"}
        </p>
      </div>

      {/* PASSENGERS */}
      <div>
        <p className="text-gray-500">Passengers</p>
        <p className="font-semibold">
          {requestData.passengers || "-"}
        </p>
      </div>

      {/* PICKUP */}
      <div>
        <p className="text-gray-500">Pickup</p>
        <p className="font-semibold">
          {requestData.pickup?.location || "-"}
        </p>
        <p className="text-xs text-gray-400">
          {requestData.pickup?.date
            ? new Date(requestData.pickup.date).toLocaleString()
            : "-"}
        </p>
      </div>

      {/* DROP */}
      <div>
        <p className="text-gray-500">Return</p>
        <p className="font-semibold">
          {requestData.drop?.location || "-"}
        </p>
        <p className="text-xs text-gray-400">
          {requestData.drop?.date
            ? new Date(requestData.drop.date).toLocaleString()
            : "-"}
        </p>
      </div>

      {/* DAYS */}
      <div>
        <p className="text-gray-500">Requested Days</p>
        <p className="font-semibold">
          {requestData.pricing?.rentalDays || "-"} Days
        </p>
      </div>

    </div>

{/* USER SELECTED EXTRA SERVICES */}
{(() => {
  const extrasData =
    requestData.extras ||
    requestData.extraServices ||
    [];

  if (!Array.isArray(extrasData) || extrasData.length === 0) return null;

  return (
    <div className="mt-6 border-t pt-4">

      <h4 className="text-sm font-semibold mb-3 text-gray-700">
        User Selected Extra Services
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {extrasData.map((extra, index) => {

          const names = {
            wifi: "Wi-Fi Hotspot",
            fuel: "Fuel Pre-Purchase",
            toll: "Toll Pass",
            dashcam: "Dash Cam",
            childSeat: "Child Seat",
            roadside: "Roadside Assist"
          };

          return (
            <div
              key={index}
              className="border rounded-lg p-3 flex justify-between items-center bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium">
                  {names[extra.key] || extra.key || "Service"}
                </p>
                <p className="text-xs text-gray-500">
                  {extra.type === "per_day" ? "Per Day" : "One Time"}
                </p>
              </div>

              <p className="font-semibold text-blue-600">
                ₹{extra.price || 0}
                {extra.type === "per_day" ? " /day" : ""}
              </p>
            </div>
          );

        })}

      </div>

    </div>
  );
})()}

  </div>
)}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT FORM */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6">

          {/* TABS */}
          <div className="flex flex-wrap gap-3 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => {

const disabled =
(key==="customer" && (requestData || !carCompleted)) ||
(key==="extras" && !customerCompleted) ||
(key==="billing" && !extrasCompleted)

const completed =
(key==="car" && carCompleted) ||
(key==="customer" && customerCompleted) ||
(key==="extras" && extrasCompleted)

return(

<button
key={key}
disabled={disabled}
onClick={() => !disabled && setActiveTab(key)}
className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition
${activeTab === key
? "bg-blue-50 border-blue-200 text-blue-600"
: "border-gray-200 text-gray-600"}
${disabled ? "opacity-40 cursor-not-allowed" : ""}
`}
>

<Icon size={16}/>

{label}

{completed && (
<span className="text-green-600 text-xs font-bold">✔</span>
)}

</button>

)

})}
          </div>

          {activeTab === "car" && (
<CarDatesTab
vehicles={vehicles}
selectedVehicle={selectedVehicle}
setSelectedVehicle={setSelectedVehicle}

setCarCompleted={setCarCompleted}
setActiveTab={setActiveTab}

startDate={startDate}
startTime={startTime}
pickupLocation={pickupLocation}
returnLocation={returnLocation}

rentalDays={rentalDays}
setRentalDays={setRentalDays}

rentalType={rentalType}
setRentalType={setRentalType}

passengers={passengers}
setPassengers={setPassengers}

endDate={endDate}
setEndDate={setEndDate}

endTime={endTime}
setEndTime={setEndTime}

deposit={deposit}
setDeposit={setDeposit}

sameLocation={sameLocation}
setSameLocation={setSameLocation}
setStartDate={setStartDate}
setStartTime={setStartTime}
setPickupLocation={setPickupLocation}
setReturnLocation={setReturnLocation}
validateCarForm={validateCarForm}
/>
)}
          {activeTab === "customer" && (
<CustomerTab
selectedCustomer={selectedCustomer}
setSelectedCustomer={setSelectedCustomer}
setCustomerCompleted={setCustomerCompleted}
setActiveTab={setActiveTab}
/>
)}
{activeTab === "extras" && (
<ExtraServicesTab
vehicles={(Array.isArray(vehicles) ? vehicles : []).filter(v =>
  selectedVehicle.includes(v._id)
)}
userExtras={requestData?.extras || []} 
selectedExtras={selectedExtras}
setSelectedExtras={setSelectedExtras}
setExtrasCompleted={setExtrasCompleted}
setActiveTab={setActiveTab}
/>
)}          {activeTab === "billing" && (
<BillingTab
  vehicles={vehicles} // 🔥 ADD THIS
selectedVehicle={selectedVehicle}
selectedCustomer={selectedCustomer}
isUnlimitedKm={isUnlimitedKm}
setIsUnlimitedKm={setIsUnlimitedKm}
selectedExtras={selectedExtras}
startDate={startDate}
startTime={startTime}
endDate={endDate}
endTime={endTime}
rentalDays={rentalDays}
rentalType={rentalType}
passengers={passengers}
pickupLocation={pickupLocation}
returnLocation={returnLocation}
deposit={deposit}
baseKm={baseKm}
setBaseKm={setBaseKm}
extraKmPrice={extraKmPrice}
setExtraKmPrice={setExtraKmPrice}
/>
)}

        </div>

        {/* SUMMARY PANEL */}
<SummaryPanel
vehicles={(Array.isArray(vehicles) ? vehicles : []).filter(v =>
  selectedVehicle.includes(v._id)
)}
selectedCustomer={selectedCustomer}
selectedExtras={selectedExtras}
deposit={deposit}
isUnlimitedKm={isUnlimitedKm}

activeTab={activeTab}
showPricing={showPricing}

carCompleted={carCompleted}

startDate={startDate}
startTime={startTime}
endDate={endDate}
endTime={endTime}
rentalDays={rentalDays}
rentalType={rentalType}
pickupLocation={pickupLocation}
returnLocation={returnLocation}
sameLocation={sameLocation}
baseKm={baseKm}
extraKmPrice={extraKmPrice}
setActiveTab={setActiveTab}
/>
      </div>

    </div>
  );
}

/* ================= SUMMARY PANEL ================= */
function SummaryPanel({
  vehicles = [],
  selectedCustomer,
  selectedExtras,
  deposit,
  activeTab,
  startDate,
  startTime,
  isUnlimitedKm,
  showPricing,
  rentalDays,
  rentalType,
  pickupLocation,
  returnLocation,
  sameLocation,
  carCompleted,
  baseKm,          // ✅ ADD THIS
  extraKmPrice,    // ✅ ADD THIS
  setActiveTab
}){

const [customer,setCustomer] = useState(null)

/* LOAD CUSTOMER */


useEffect(()=>{

if(!selectedCustomer) return

const loadCustomer = async () => {

try{

const res = await fetch("${import.meta.env.VITE_API_URL}/api/reservations/customers")
const data = await res.json()

const found = data.find(c => c._id === selectedCustomer)

setCustomer(found)

}catch(err){

console.error(err)

}

}

loadCustomer()

},[selectedCustomer])

const pickup = pickupLocation?.trim() ? pickupLocation : null;

const returnLoc = sameLocation
  ? pickup
  : returnLocation?.trim()
  ? returnLocation
  : null;

/* PRICE CALCULATIONS */

const carTotal = vehicles.reduce((total,v)=>{

const price = v?.pricing?.dailyPrice || 0
return total + (price * (Number(rentalDays) || 1))

},0)

/* EXTRAS TOTAL */

const extrasTotal = (selectedExtras || []).reduce((total, e) => {

const price = Number(e.price) || 0

if (e.type === "per_day") {
return total + (price * (Number(rentalDays) || 1))
}

return total + price

}, 0)

/* SECURITY DEPOSIT */

const depositAmount = Number(deposit) || 0

// 🔥 BASE KM (if needed future)
const baseKmTotal = 0 // (optional if you pass later)

// 🔥 EXTRA KM PRICE (optional future)
const extraKmTotal = 0

/* GRAND TOTAL */
const grandTotal =
  carTotal +
  extrasTotal +
  depositAmount +
  baseKmTotal +
  extraKmTotal;

return (

<div className="bg-white rounded-xl shadow-md overflow-hidden h-fit">

{/* HEADER */}
<div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white px-6 py-4">
<h3 className="text-lg font-semibold">Summary</h3>
</div>

<div className="p-6 space-y-6">

{/* VEHICLES */}

{vehicles.length > 0 && (

<div className="space-y-3">

{vehicles.map(vehicle => (

<div
key={vehicle._id}
className="flex items-center justify-between border rounded-lg p-4 bg-gray-50"
>

<div className="flex items-center gap-3">

<img
src={vehicle.imageUrl || vehicle.images?.[0] || "/car-placeholder.png"}
alt="vehicle"
className="w-16 h-12 rounded object-cover"
/>

<div>

<p className="text-xs text-gray-400">
{vehicle.category || "Vehicle"}
</p>

<p className="font-semibold text-gray-900">
{vehicle.brand} {vehicle.model}
</p>

</div>

</div>

<div className="text-right">

<p className="text-xs text-gray-400">
Price
</p>

<p className="font-semibold text-gray-900">
₹{vehicle.pricing?.dailyPrice || 0}/day
</p>

</div>

</div>

))}

</div>

)}

{/* DETAILS */}
<div className="divide-y">

{/* START DATE */}{/* START DATE */}
<div className="flex justify-between items-start py-3 text-sm">

<div>
<p className="text-gray-500">Start Date</p>

<p className="text-gray-900">
{startDate
? new Date(`${startDate}T${startTime}`).toLocaleString()
: "-"}
</p>
</div>

<button
onClick={()=>setActiveTab("car")}
className="text-xs text-blue-600"
>
Edit
</button>

</div>

{/* END DATE */}

<SummaryRow
label="End Date"
value={
startDate && startTime && rentalDays
? new Date(
new Date(`${startDate}T${startTime}`).getTime()
+ rentalDays * 24 * 60 * 60 * 1000
).toLocaleString()
: "-"
}
/>

{/* RENTAL PERIOD */}

<SummaryRow
label="Rental Period"
value={rentalDays ? `${rentalDays} Days` : "-"}
/>

{/* RENTAL TYPE */}

<SummaryRow
label="Rental Type"
value={rentalType || "-"}
/>

{/* CUSTOMER */}

{customer && (

<div className="flex justify-between items-start py-3 text-sm">

<div className="flex items-center gap-3">

<img
src={customer.profileImage || "/user.png"}
className="w-8 h-8 rounded-full"
/>

<div>

<p className="text-gray-900">
{customer.name}
</p>

<p className="text-xs text-gray-500">
{customer.phone}
</p>

</div>

</div>

<button
onClick={()=>setActiveTab("customer")}
className="text-xs text-blue-600"
>
Edit
</button>

</div>

)}

{pickup && (
  <SummaryRow
    label="Pickup Location"
    value={pickup}
  />
)}

{returnLoc && (
  <SummaryRow
    label="Return Location"
    value={returnLoc}
  />
)}
</div>

{/* BILLING SUMMARY ONLY IN EXTRAS TAB */}

{showPricing && (

<div className="border rounded-xl mt-4 divide-y">

{/* CAR PRICE */}
<div className="flex justify-between items-center p-3 text-sm">
<p>Car Price</p>
<p className="font-semibold">₹{carTotal}</p>
</div>

{/* EXTRA SERVICES */}
<div className="flex justify-between items-center p-3 text-sm">
<p>Extras</p>
<p className="font-semibold">₹{extrasTotal}</p>
</div>

{/* SECURITY DEPOSIT */}
<div className="flex justify-between items-center p-3 text-sm">
<p>Deposit</p>
<p className="font-semibold">₹{depositAmount}</p>
</div>
{/* BASE KM */}
<div className="flex justify-between items-center p-3 text-sm">
  <p>Base KM / Day</p>
  <p className="font-semibold">
{isUnlimitedKm
  ? "Unlimited"
  : baseKm
  ? `${baseKm} km/day`
  : "-"}
  </p>
</div>

{/* EXTRA KM PRICE */}
<div className="flex justify-between items-center p-3 text-sm">
  <p>Extra KM Price</p>
  <p className="font-semibold">
    {extraKmPrice ? `₹${extraKmPrice}/km` : "-"}
  </p>
</div>
{/* TOTAL */}
<div className="flex justify-between items-center p-3 font-semibold text-lg border-t">
<p>Total</p>
<p className="text-green-600">₹{grandTotal}</p>
</div>

</div>

)}
{carCompleted && (

<div className="pt-4">

<button
onClick={() => {

Swal.fire({
title:"Cancel this booking?",
text:"All reservation data will be cleared",
icon:"warning",
showCancelButton:true,
confirmButtonColor:"#ef4444",
confirmButtonText:"Yes Cancel"
}).then((result)=>{

if(result.isConfirmed){

Swal.fire({
title:"Booking Cancelled",
icon:"success"
}).then(()=>{

navigate("/owner")

})

}

})

}}
className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
>

<X size={16}/>
Cancel Booking

</button>

</div>

)}
</div>

</div>

)

}

function SummaryRow({ label, value }) {

return (

<div className="flex justify-between items-start py-3 text-sm">

<p className="text-gray-500">
{label}
</p>

<p className="text-gray-900 text-right max-w-[180px] break-words">
{value}
</p>

</div>

)

}
/* ================= CAR TAB ================= */

function CarDatesTab({
vehicles,
selectedVehicle,
setSelectedVehicle,

setCarCompleted,
setActiveTab,

startDate,
startTime,
pickupLocation,
returnLocation,

validateCarForm,

rentalDays,
rentalType,          // ✅ ADD THIS
setRentalType,       // ✅ ADD THIS (important)

...props
}){  return (
    <div className="space-y-8">

      <div className="border rounded-xl p-6 bg-gray-50 flex items-center gap-2">
        <Info size={18}/>
        <h3 className="text-lg font-semibold">Basic Info</h3>
      </div>

<DateTimeTravel
  {...props}
  selectedVehicle={selectedVehicle}
  vehicles={vehicles} 
  rentalType={rentalType}        // now valid ✅
  setRentalType={setRentalType}  // also pass setter ✅
/>
<SelectVehicle
vehicles={vehicles}
selectedVehicle={selectedVehicle}
setSelectedVehicle={setSelectedVehicle}

setCarCompleted={setCarCompleted}
setActiveTab={setActiveTab}

startDate={startDate}
startTime={startTime}
pickupLocation={pickupLocation}
returnLocation={returnLocation}

validateCarForm={validateCarForm}
/>
    </div>
  );
}

/* ================= CUSTOMER TAB ================= */

function CustomerTab({
selectedCustomer,
setSelectedCustomer,
setCustomerCompleted,
setActiveTab
}){

const [customers,setCustomers] = useState([])
const [search,setSearch] = useState("")
const [showSuggestions,setShowSuggestions] = useState(false)

useEffect(()=>{

const loadCustomers = async () => {

try{

const res = await fetch("${import.meta.env.VITE_API_URL}/api/reservations/customers")
const data = await res.json()

setCustomers(data)

}catch(err){
console.error(err)
}

}

loadCustomers()

},[])

/* FILTER */

const filteredCustomers = customers.filter(c => {

const name = (c.name || "").toLowerCase()
const phone = (c.phone || "").toLowerCase()
const email = (c.email || "").toLowerCase()

const term = search.toLowerCase()

return (
name.includes(term) ||
phone.includes(term) ||
email.includes(term)
)

})

/* SHOW 5 DEFAULT */

const visibleCustomers =
search.length > 0
? filteredCustomers
: customers.slice(0,5)

const selectedData =
customers.find(c => c._id === selectedCustomer)

return(

<div className="space-y-6">

{/* HEADER */}

<div className="border rounded-xl p-6 bg-gray-50 flex items-center gap-2">

<User size={18}/>

<h3 className="text-lg font-semibold">
Customer
</h3>

</div>

{/* SEARCH */}

<div className="border rounded-xl p-6 bg-white space-y-4">

<h3 className="text-lg font-semibold">
Select Customer
</h3>

{/* SEARCH BAR */}

<div className="relative">

<input
type="text"
placeholder="Search customer name / phone / email"
value={search}
onChange={(e)=>{

setSearch(e.target.value)
setShowSuggestions(true)

}}
className="border rounded-lg px-3 py-2 w-full"
/>

{/* SUGGESTION DROPDOWN */}

{showSuggestions && search && (

<div className="absolute left-0 right-0 bg-white border rounded-lg mt-1 max-h-56 overflow-y-auto shadow">

{filteredCustomers.length === 0 && (

<div className="p-3 text-gray-400 text-sm">
No customer found
</div>

)}

{filteredCustomers.slice(0,5).map(customer => (

<div
key={customer._id}
onClick={()=>{

setSelectedCustomer(customer._id)
setSearch(customer.name)
setShowSuggestions(false)

}}
className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
>

<img
src={customer.profileImage || "/user.png"}
className="w-8 h-8 rounded-full"
/>

<div>

<p className="text-sm font-medium">
{customer.name}
</p>

<p className="text-xs text-gray-500">
{customer.phone}
</p>

</div>

</div>

))}

</div>

)}

</div>

{/* DEFAULT CUSTOMER LIST */}

<div className="space-y-2 max-h-[240px] overflow-y-auto">

{visibleCustomers.map(customer => {

const isSelected = selectedCustomer === customer._id

return(

<div
key={customer._id}
onClick={()=>{

/* CLICK AGAIN = DESELECT */

if(isSelected){

setSelectedCustomer("")

}else{

setSelectedCustomer(customer._id)

}

}}
className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition
${isSelected ? "bg-blue-50 border-blue-500" : ""}
`}
>

<div className="flex items-center gap-3">

<img
src={customer.profileImage || "/user.png"}
className="w-10 h-10 rounded-full object-cover"
/>

<div>

<p className="font-medium">
{customer.name || "No Name"}
</p>

<p className="text-xs text-gray-500">
{customer.phone || "-"}
</p>

</div>

</div>

<p className="text-xs text-gray-400">
{customer.email}
</p>

</div>

)

})}

</div>

{/* SELECTED CARD */}

{selectedData && (

<div className="border rounded-xl p-4 flex justify-between items-center bg-green-50">

<div className="flex items-center gap-3">

<img
src={selectedData.profileImage || "/user.png"}
className="w-10 h-10 rounded-full"
/>

<div>

<p className="font-semibold">
{selectedData.name}
</p>

<p className="text-xs text-gray-500">
{selectedData.phone}
</p>

</div>

</div>

<p className="text-green-600 text-sm font-medium">
Selected
</p>

</div>

)}

{/* FOOTER */}

<div className="flex justify-end gap-3">

<button
onClick={()=>setActiveTab("car")}
className="border px-4 py-2 rounded-lg text-sm"
>
← Back
</button>

<button
onClick={()=>{

if(!selectedCustomer){

Swal.fire("Validation","Select customer","warning")
return

}

setCustomerCompleted(true)
setActiveTab("extras")

}}
className="bg-orange-400 text-white px-6 py-2 rounded-lg text-sm"
>

Add Extra Services →

</button>

</div>

</div>

</div>

)

}

function ExtraServicesTab({
  vehicles = [],
  selectedExtras,
  setSelectedExtras,
  setExtrasCompleted,
  setActiveTab,
  userExtras = []   // 🔥 ADD THIS
}){
const [editOpen,setEditOpen] = useState(false)

const [initialized,setInitialized] = useState(false)

const SERVICES = [
{ key:"wifi", title:"Wi-Fi Hotspot", desc:"Portable internet connection", price:300, type:"one_time", icon:Wifi },
{ key:"fuel", title:"Fuel Pre-Purchase", desc:"Return without refueling", price:500, type:"one_time", icon:Fuel },
{ key:"toll", title:"Toll Pass", desc:"Skip toll booth lines", price:250, type:"one_time", icon:Receipt },
{ key:"dashcam", title:"Dash Cam", desc:"Trip recording security", price:180, type:"per_day", icon:Camera },
{ key:"childSeat", title:"Child Seat", desc:"Secure infant safety seat", price:220, type:"per_day", icon:Baby },
{ key:"roadside", title:"Roadside Assist", desc:"24/7 emergency help", price:150, type:"per_day", icon:Shield }
]

const [services,setServices] = useState(
SERVICES.map(s=>({...s,enabled:false}))
)

/* AUTO LOAD VEHICLE EXTRAS */
useEffect(() => {

  if (initialized) return; // 🔥 ADD THIS (IMPORTANT)

  /* USER EXTRAS FIRST */
  if (userExtras && userExtras.length > 0) {

    const updated = SERVICES.map(service => {

      const match = userExtras.find(e => e.key === service.key);

      if (match) {
        return {
          ...service,
          enabled: true,
          price: match.price,
          type: match.type
        };
      }

      return {
        ...service,
        enabled: false
      };
    });

    setServices(updated);
    setInitialized(true); // 🔥 ADD
    return;
  }

  /* VEHICLE EXTRAS */
  if (vehicles.length > 0) {

    const vehicleExtras = vehicles.flatMap(v => v.extras || []);

    const updated = SERVICES.map(service => {

      const match = vehicleExtras.find(e => e.key === service.key);

      if (match) {
        return {
          ...service,
          enabled: true,
          price: match.price,
          type: match.type
        };
      }

      return {
        ...service,
        enabled: false
      };
    });

    setServices(updated);
    setInitialized(true); // 🔥 ADD
  }

}, [vehicles, userExtras, initialized]);

useEffect(()=>{

const selected = services
  .filter(s => s.enabled)
  .map(s => ({
    key: s.key,
    price: s.price,
    type: s.type === "dynamic" ? "one_time" : s.type
  }));

setSelectedExtras(selected)

},[services])
/* TOGGLE SERVICE */

const toggleService = (key)=>{

setServices(prev=>
prev.map(s =>
s.key===key ? {...s,enabled:!s.enabled} : s
)

)

}

return(

<div className="space-y-6">

{/* HEADER */}

<div className="flex items-center justify-between border rounded-xl bg-gray-50 px-5 py-4">

<div className="flex items-center gap-2">
<Puzzle size={18}/>
<h3 className="font-semibold text-lg">
Extra Services ({vehicles.length} Vehicles)
</h3>
</div>
<button
onClick={()=>setEditOpen(true)}
className="text-sm text-orange-600"
>
Edit Price
</button>
{editOpen && (
<EditExtraPricingModal
services={services}
setServices={setServices}
onClose={()=>setEditOpen(false)}
/>
)}
</div>


{/* SERVICES GRID */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">

{services.map(service=>{

const Icon = service.icon
const active = service.enabled

return(

<div
key={service.key}
className={`group flex items-center gap-4 border rounded-xl p-4 transition cursor-pointer
${active
? "border-green-500 bg-green-50"
: "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}
`}
onClick={() => toggleService(service.key)}
>
{/* CHECKBOX */}

<input
type="checkbox"
checked={active}
onChange={() => toggleService(service.key)}
onClick={(e) => e.stopPropagation()}
className="w-4 h-4"
/>

{/* ICON */}

<div className={`flex items-center justify-center w-10 h-10 rounded-lg
${active ? "bg-green-600 text-white" : "bg-gray-900 text-white"}
`}>
<Icon size={18}/>
</div>


{/* TEXT */}

<div className="flex-1">

<p className="font-semibold text-sm">
{service.title}
</p>

<p className="text-xs text-gray-500">
{service.desc}
</p>

</div>


{/* PRICE */}

<div className="text-right">

<p className="text-xs text-gray-500">
{service.type==="per_day" ? "Per Day" : "One Time"}
</p>

<p className="font-semibold text-gray-900">
₹{service.price}
</p>

</div>

</div>

)

})}

</div>


{/* FOOTER */}

<div className="flex justify-between pt-4">

<button
onClick={()=>setActiveTab("customer")}
className="px-4 py-2 border rounded-lg text-sm"
>
← Back
</button>

<button
onClick={()=>{

setExtrasCompleted(true)
setActiveTab("billing")

}}
className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm"
>
Proceed to Billing →
</button>

</div>

</div>

)

}
function EditExtraPricingModal({ services, setServices, onClose }) {

const updateService = (key, field, value) => {

setServices(prev =>
prev.map(s =>
s.key === key ? { ...s, [field]: value } : s
)
)

}

const toggleService = (key) => {

setServices(prev =>
prev.map(s =>
s.key === key ? { ...s, enabled: !s.enabled } : s
)
)

}

return (

<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

<div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[85vh]">

{/* HEADER */}

<div className="flex items-center justify-between border-b px-6 py-4">

<h3 className="text-lg font-semibold">
Edit Extra Services Pricing
</h3>

<button
onClick={onClose}
className="p-2 rounded hover:bg-gray-100"
>
<X size={18}/>
</button>

</div>


{/* BODY */}

<div className="overflow-y-auto px-6 py-4 space-y-4">

{services.map(service => {

const Icon = service.icon

return (

<div
key={service.key}
className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-xl p-4"
>

{/* LEFT INFO */}

<div className="flex items-center gap-3 flex-1">

<input
type="checkbox"
checked={service.enabled || false}
onChange={() => toggleService(service.key)}
className="w-4 h-4"
/>

<div className="bg-gray-900 text-white p-2 rounded-lg">
<Icon size={16}/>
</div>

<div>

<p className="font-semibold text-sm">
{service.title}
</p>

<p className="text-xs text-gray-500">
{service.desc}
</p>

</div>

</div>


{/* TYPE SELECT */}

<div className="w-full sm:w-[140px]">

<select
value={service.type}
onChange={(e) =>
updateService(service.key, "type", e.target.value)
}
className="border rounded-lg px-3 py-2 w-full text-sm"
>
<option value="per_day">Per Day</option>
<option value="one_time">One Time</option>
</select>

</div>


{/* PRICE */}

<div className="flex items-center border rounded-lg px-3 w-full sm:w-[140px]">

<span className="text-gray-500 mr-1 text-sm">
₹
</span>

<input
type="number"
value={service.price}
onChange={(e) =>
updateService(service.key, "price", Number(e.target.value))
}
className="outline-none w-full py-2 text-sm"
/>

</div>

</div>

)

})}

</div>


{/* FOOTER */}

<div className="border-t px-6 py-4 flex justify-end gap-3">

<button
onClick={onClose}
className="px-5 py-2 border rounded-lg text-sm"
>
Cancel
</button>

<button
onClick={onClose}
className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
>
Save Changes
</button>

</div>

</div>

</div>

)

}

/* ================= BILLING TAB ================= */

function BillingTab({
selectedVehicle,
selectedCustomer,
selectedExtras,
isUnlimitedKm,
setIsUnlimitedKm,
startDate,
startTime,
baseKm,
setBaseKm,
extraKmPrice,
setExtraKmPrice,
rentalDays,
vehicles,
endDate,
endTime,
rentalType,
passengers,
pickupLocation,
returnLocation,
deposit
}){

const navigate = useNavigate()
const location = useLocation();
const requestData = location.state?.reservation;
const unlimited = isUnlimitedKm;
const setUnlimited = setIsUnlimitedKm;

const saveReservation = async () => {

try{

/* ================= AUTH ================= */

if(!auth.currentUser){
  Swal.fire("Error","User not authenticated","error")
  return
}

/* ================= CUSTOMER REQUIRED ================= */

if (!selectedCustomer) {
  Swal.fire({
    icon: "warning",
    title: "Customer Required",
    text: "Please select a customer"
  });
  return;
}

/* ================= VALIDATE MATCH ================= */

if (requestData) {

  const requestVehicleIds = requestData.vehicleIds?.map(v => v._id);

  const sameVehicle =
    JSON.stringify([...requestVehicleIds].sort()) ===
    JSON.stringify([...selectedVehicle].sort());

  const sameStartDate =
    new Date(requestData.pickup?.date).toDateString() ===
    new Date(startDate).toDateString();

  const sameRentalDays =
    Number(requestData.pricing?.rentalDays) === Number(rentalDays);

  const samePassengers =
    Number(requestData.passengers) === Number(passengers);

  const sameCustomer =
    String(requestData.customerId) === String(selectedCustomer);

  /* 🔥 SEPARATE ALERTS */

  if (!sameVehicle) {
    Swal.fire("Vehicle Mismatch","Select same vehicle as user request","error");
    return;
  }

  if (!sameStartDate) {
    Swal.fire("Start Date Mismatch","Start date must match request","error");
    return;
  }

  if (!sameRentalDays) {
    Swal.fire("Rental Days Mismatch","Rental days must match request","error");
    return;
  }

  if (!samePassengers) {
    Swal.fire("Passengers Mismatch","Passengers must match request","error");
    return;
  }

  if (!sameCustomer) {
    Swal.fire("Customer Mismatch","Select same customer as request","error");
    return;
  }

  /* ================= APPROVE ================= */

  const token = await auth.currentUser.getIdToken();
const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/reservations/approve/${requestData._id}`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      extras: selectedExtras,
      baseKilometers: unlimited ? null : Number(baseKm),
      extraKmPrice: Number(extraKmPrice) || 0,
      isUnlimitedKm: unlimited
    })
  }
);

  if (res.ok) {
    Swal.fire("Approved","Reservation approved successfully","success")
    .then(()=> navigate("/owner"));
  } else {
    Swal.fire("Error","Approval failed","error");
  }

  return; // ❌ STOP (NO CREATE)
}

/* ================= NORMAL CREATE ================= */

const formattedExtras = (selectedExtras || []).map(e => ({
  key: e.key,
  price: Number(e.price),
  type: e.type
}));

const res = await fetch("${import.meta.env.VITE_API_URL}/api/reservations",{

method:"POST",

headers:{
  "Content-Type":"application/json",
  "Authorization":`Bearer ${await auth.currentUser.getIdToken()}`
},

body:JSON.stringify({

  vehicleIds:selectedVehicle,
  customerId:selectedCustomer,

  extras:formattedExtras,

  startDate,
  startTime,
  endDate,
  endTime,

  rentalDays,
  rentalType,

  passengers,

  pickupLocation,
  returnLocation: returnLocation || pickupLocation,

  securityDeposit:deposit,

baseKilometers: unlimited ? null : Number(baseKm),
isUnlimitedKm: unlimited,   // 🔥 ADD THIS
extraKmPrice: Number(extraKmPrice) || 0,

  createdBy:{
    userId: auth.currentUser.uid,
    role:"owner"
  }

})
})

const data = await res.json()

if(res.ok){

  Swal.fire("Success","Reservation Created","success")
  .then(()=> navigate("/owner"))

}else{

  Swal.fire("Error", data.message || "Reservation failed","error")

}

}catch(err){

console.error(err)
Swal.fire("Error","Something went wrong","error")

}

}
// 🔥 CALCULATE TOTAL AMOUNT
// 🔥 CALCULATE TOTAL AMOUNT
const calculateTotal = () => {

  if (!vehicles || vehicles.length === 0) return 0;

  // 🔥 VEHICLE PRICE
  const vehicleTotal = vehicles
    .filter(v => selectedVehicle.includes(v._id))
    .reduce((total, v) => {
      const price = Number(v?.pricing?.dailyPrice) || 0;
      return total + price * (Number(rentalDays) || 1);
    }, 0);

  // 🔥 EXTRAS
  const extrasTotal = (selectedExtras || []).reduce((total, e) => {
    const price = Number(e.price) || 0;

    if (e.type === "per_day") {
      return total + price * (Number(rentalDays) || 1);
    }

    return total + price;
  }, 0);

  // 🔥 DEPOSIT
  const depositAmount = Number(deposit) || 0;

  return vehicleTotal + extrasTotal + depositAmount;
};
return(

<div className="space-y-6">

<style>
{`
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
`}
</style>
{/* HEADER */}
<div className="border rounded-xl p-5 bg-gray-50 flex items-center gap-2">
<FileText size={18}/>
<h3 className="font-semibold text-lg">
Billing Details
</h3>
</div>

{/* RENT BILLING */}

<div className="border rounded-xl p-6 space-y-4">

<h3 className="font-semibold text-lg">
Rent & Service Billing
</h3>

<p className="text-sm text-gray-500">
Add extra services for your rental
</p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* BASE KM */}

<div>

<label className="text-sm font-medium">
Base Kilometers (Per Day)
</label>

<div className="flex items-center gap-3 mt-2">

<input
type="number"
value={baseKm}
disabled={unlimited}
onChange={(e)=>setBaseKm(e.target.value)}
className="border rounded-lg px-3 py-2 w-full"
/>

<label className="flex items-center gap-2 text-sm">

<input
type="checkbox"
checked={unlimited}
onChange={() => {
  const val = !unlimited;
  setUnlimited(val);

  if (val) {
    setBaseKm("");
  }
}}
/>

Unlimited

</label>

</div>

</div>

{/* EXTRA KM PRICE */}

<div>

<label className="text-sm font-medium">
Kilometers Extra Price
</label>

<input
type="number"
value={extraKmPrice}
onChange={(e)=>setExtraKmPrice(e.target.value)}
className="border rounded-lg px-3 py-2 w-full mt-2"
/>

</div>

</div>

</div>

{/* FOOTER */}

<div className="flex justify-end">

<button
onClick={saveReservation}
className="bg-green-600 text-white px-6 py-3 rounded-lg"
>
Create Reservation
</button>

</div>

</div>

)

}

/* ================= DATE TIME TRAVEL ================= */
function SelectVehicle({
vehicles,
selectedVehicle,
setSelectedVehicle,
setCarCompleted,
setActiveTab,
startDate,
startTime,
pickupLocation,
returnLocation,
validateCarForm
}){
const [search,setSearch] = useState("")
const [showFilter,setShowFilter] = useState(false)

const [brandSearch,setBrandSearch] = useState("")
const [typeSearch,setTypeSearch] = useState("")
const [locationSearch,setLocationSearch] = useState("")

const [selectedBrand,setSelectedBrand] = useState("")
const [selectedType,setSelectedType] = useState("")
const [selectedLocation,setSelectedLocation] = useState("")

/* unique values */
const brands=[...new Set(vehicles.map(v=>v.brand).filter(Boolean))]
const types=[...new Set(vehicles.map(v=>v.vehicleType || v.type).filter(Boolean))]
const locations=[...new Set(vehicles.map(v=>v.mainLocation).filter(Boolean))]

/* vehicle search */
const filteredVehicles = vehicles
.filter(v => {

const name = `${v.name || ""} ${v.brand || ""} ${v.model || ""}`.toLowerCase()

if(search && !name.includes(search.toLowerCase())) return false

if(selectedBrand && v.brand !== selectedBrand) return false

if(selectedType && (v.type !== selectedType && v.vehicleType !== selectedType && v.category !== selectedType)) return false

if(selectedLocation && v.mainLocation !== selectedLocation) return false

return true

})


return(

<div className="border rounded-xl p-6 bg-white space-y-5">

{/* HEADER */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

<div>
<h3 className="text-lg font-semibold">Select Vehicle</h3>
<p className="text-sm text-gray-500">Select Vehicle for your rental</p>
</div>

<div className="flex flex-wrap gap-2">

<button
onClick={()=>setShowFilter(!showFilter)}
className="border px-3 py-2 rounded-lg text-sm"
>
Filter
</button>

<input
type="text"
placeholder="Search vehicle"
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border px-3 py-2 rounded-lg text-sm"
/>

<button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
+ Add New
</button>

</div>

</div>

{/* FILTER PANEL */}
{showFilter && (

<div className="border rounded-xl p-4 bg-gray-50 grid gap-4 md:grid-cols-3">

{/* BRAND */}
<div>

<input
placeholder="Search Brand"
value={brandSearch}
onChange={(e)=>setBrandSearch(e.target.value)}
className="border px-3 py-2 rounded-lg w-full text-sm"
/>

<div className="border mt-2 rounded-lg max-h-32 overflow-y-auto">

{brands
.filter(b=>b.toLowerCase().includes(brandSearch.toLowerCase()))
.slice(0,5)
.map((b,i)=>(
<div
key={i}
onClick={()=>{
setSelectedBrand(selectedBrand === b ? "" : b)
}}
className={`px-3 py-2 text-sm cursor-pointer
${selectedBrand===b ? "bg-blue-100 text-blue-600" : ""}
`}
>
{b}
</div>
))}

{brands.filter(b=>b.toLowerCase().includes(brandSearch.toLowerCase())).length===0 &&(
<div className="text-gray-400 text-sm p-3">
No brand available
</div>
)}

</div>

</div>

{/* TYPE */}
<div>

<input
placeholder="Search Type"
value={typeSearch}
onChange={(e)=>setTypeSearch(e.target.value)}
className="border px-3 py-2 rounded-lg w-full text-sm"
/>

<div className="border mt-2 rounded-lg max-h-32 overflow-y-auto">

{types
.filter(t=>t?.toLowerCase().includes(typeSearch.toLowerCase()))
.slice(0,5)
.map((t,i)=>(
<div
key={i}
onClick={()=>{
setSelectedType(selectedType === t ? "" : t)
}}
className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
${selectedType===t ? "bg-blue-100 text-blue-600" : ""}
`}
>
{t}
</div>
))}

</div>

</div>

{/* LOCATION */}
<div>

<input
placeholder="Search Location"
value={locationSearch}
onChange={(e)=>setLocationSearch(e.target.value)}
className="border px-3 py-2 rounded-lg w-full text-sm"
/>

<div className="border mt-2 rounded-lg max-h-32 overflow-y-auto">

{locations
.filter(l=>l.toLowerCase().includes(locationSearch.toLowerCase()))
.slice(0,5)
.map((l,i)=>(
<div
key={i}
onClick={()=>{
setSelectedLocation(selectedLocation === l ? "" : l)
}}
className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
${selectedLocation===l ? "bg-blue-100 text-blue-600" : ""}
`}
>
{l}
</div>
))}



</div>
<div className="flex justify-end mt-3">
<button
onClick={()=>{
setSelectedBrand("")
setSelectedType("")
setSelectedLocation("")
}}
className="text-sm px-4 py-2 border rounded-lg"
>
Clear Filters
</button>
</div>
</div>

</div>

)}

{/* VEHICLE LIST */}
<div className="space-y-4 max-h-[350px] overflow-y-auto">

{filteredVehicles.length===0 &&(

<div className="text-center text-gray-400 text-sm py-10">
No vehicle available
</div>

)}

{filteredVehicles.map(vehicle=>{


return(

<div
key={vehicle._id}
className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition
${selectedVehicle.includes(vehicle._id)
  ? "border-blue-500 bg-blue-50"
  : "cursor-pointer"
}`}
onClick={() => {

  const isSelected = selectedVehicle.includes(vehicle._id);

  /* ✅ ALWAYS ALLOW DESELECT */
  if (isSelected) {
    setSelectedVehicle(selectedVehicle.filter(id => id !== vehicle._id));
    return;
  }

  /* ❌ BLOCK SELECT IF RESERVED */
  if (vehicle.status !== "available") {
    Swal.fire(
      "Not Available",
      "This vehicle is already reserved or booked",
      "warning"
    );
    return;
  }

  /* ✅ SELECT */
  /* 🔥 MAX 3 VEHICLE LIMIT */
if (selectedVehicle.length >= 3) {
  Swal.fire(
    "Limit Reached",
    "You can select maximum 3 vehicles only",
    "warning"
  );
  return;
}

/* ✅ SELECT */
setSelectedVehicle([...selectedVehicle, vehicle._id]);

}}
>

<input
type="checkbox"
checked={selectedVehicle.includes(vehicle._id)}
readOnly
/>

<img
src={
vehicle.imageUrl ||
vehicle.images?.[0] ||
"/car-placeholder.png"
}
className="w-16 h-12 rounded object-cover"
alt={vehicle.name || "vehicle"}
/>

<div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">

<div>
<p className="text-gray-400 text-xs">Vehicle</p>
<p className="font-medium">
{vehicle.name || `${vehicle.brand} ${vehicle.model}`}
</p>
</div>

<div>
<p className="text-gray-400 text-xs">Type</p>
<p>{vehicle.category || vehicle.vehicleType || vehicle.type}</p>
</div>

<div>
<p className="text-gray-400 text-xs">Location</p>
<p>{vehicle.mainLocation}</p>
</div>

<div>
<p className="text-gray-400 text-xs">Price</p>
<p>
₹{vehicle.pricing?.dailyPrice || 0} / day
</p>
</div>

<div>
<span
  className={`px-2 py-1 text-xs rounded font-semibold
    ${vehicle.status === "available" && "bg-green-100 text-green-600"}
    ${vehicle.status === "reserved" && "bg-yellow-100 text-yellow-600"}
    ${vehicle.status === "booked" && "bg-red-100 text-red-600"}
  `}
>
  {vehicle.status}
</span>
</div>

</div>
</div>

)

})}

</div>

{/* FOOTER */}
<div className="flex justify-end gap-3">

<button className="border px-4 py-2 rounded-lg text-sm">
Cancel
</button>

<button
onClick={() => {

  /* 🔥 CHECK RESERVED / BOOKED VEHICLES */
  const invalidVehicles = vehicles.filter(v =>
    selectedVehicle.includes(v._id) &&
    (v.status === "reserved" || v.status === "booked")
  );

  if (invalidVehicles.length > 0) {
    Swal.fire(
      "Vehicle Not Available",
      "One or more selected vehicles are already reserved or booked",
      "error"
    );
    return;
  }

  /* NORMAL VALIDATION */
  if (validateCarForm()) {
    setCarCompleted(true);
    setActiveTab("customer");
  }

}}
className="bg-orange-400 text-white px-6 py-2 rounded-lg text-sm"
>
Add Customer →
</button>
</div>

</div>

)

}


/* ================= DATE FORM ================= */
function DateTimeTravel({
selectedVehicle,
vehicles,
rentalDays,setRentalDays,
rentalType,setRentalType,
passengers,setPassengers,
startDate,setStartDate,
startTime,setStartTime,
endDate,setEndDate,
endTime,setEndTime,
pickupLocation,setPickupLocation,
returnLocation,setReturnLocation,
deposit,setDeposit,
sameLocation,setSameLocation
}) {




  /* DEFAULT DATE */
useEffect(() => {

  if (rentalType !== "Self Pickup") return;

  // 🔥 NO VEHICLE SELECTED
  if (!selectedVehicle || selectedVehicle.length === 0) {
    setPickupLocation("");
    setReturnLocation("");
    setSameLocation(false);   // ✅ ADD THIS
    return;
  }

  const vehicle = vehicles.find(v => v._id === selectedVehicle[0]);

  if (!vehicle) {
    setPickupLocation("");
    setReturnLocation("");
    setSameLocation(false);   // ✅ ADD THIS
    return;
  }

  setPickupLocation(vehicle.mainLocation);
  setReturnLocation(vehicle.mainLocation);

}, [rentalType, selectedVehicle, vehicles]);
useEffect(() => {

  if (!selectedVehicle || selectedVehicle.length === 0) {
    setDeposit(0);
    return;
  }

  const totalDeposit = selectedVehicle.length * 1000;

  setDeposit(totalDeposit);

}, [selectedVehicle]);
  useEffect(() => {

if (sameLocation) {
setReturnLocation(pickupLocation);
}

}, [pickupLocation, sameLocation]);


/* AUTO CALCULATE END DATE */
/* AUTO CALCULATE END DATE */
useEffect(() => {

if (!startDate || !startTime || !rentalDays) return;

const start = new Date(`${startDate}T${startTime}`);

/* clone start date */
const end = new Date(start);

/* add rental days */
end.setDate(start.getDate() + parseInt(rentalDays));

/* format */
const yyyy = end.getFullYear();
const mm = String(end.getMonth() + 1).padStart(2,"0");
const dd = String(end.getDate()).padStart(2,"0");

const hh = String(end.getHours()).padStart(2,"0");
const min = String(end.getMinutes()).padStart(2,"0");

setEndDate(`${yyyy}-${mm}-${dd}`);
setEndTime(`${hh}:${min}`);

},[startDate,startTime,rentalDays]);


const validateTravelDetails = () => {

  const today = getLocalDateStr();
  const now = getLocalTimeStr();

  if (!rentalDays || rentalDays < 1) {
    Swal.fire("Validation Error", "Rental days must be at least 1", "warning");
    return false;
  }
if (!passengers || Number(passengers) < 1) {
Swal.fire("Validation Error","Passengers must be at least 1","warning");
return false;
}
  if (!startDate) {
    Swal.fire("Validation Error", "Please select start date", "warning");
    return false;
  }

  if (!startTime) {
    Swal.fire("Validation Error", "Please select start time", "warning");
    return false;
  }

  if (normalizeDate(startDate) < normalizeDate(today)) {
    Swal.fire("Validation Error", "Start date cannot be in the past", "warning");
    return false;
  }

  if (startDate === today && startTime < now) {
    Swal.fire("Validation Error", "Start time cannot be in the past", "warning");
    return false;
  }

  if (!endDate || !endTime) {
    Swal.fire("Validation Error", "End date/time missing", "warning");
    return false;
  }

  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  if (end <= start) {
    Swal.fire("Validation Error", "Return time must be after pickup time", "warning");
    return false;
  }

  if (!pickupLocation) {
    Swal.fire("Validation Error", "Pickup location is required", "warning");
    return false;
  }
if (!sameLocation && (!returnLocation || returnLocation.trim() === "")) {
  Swal.fire("Validation Error", "Return location is required", "warning");
  return false;
}

  if (passengers && passengers < 1) {
    Swal.fire("Validation Error", "Passengers must be at least 1", "warning");
    return false;
  }

  if (deposit && deposit < 0) {
    Swal.fire("Validation Error", "Deposit cannot be negative", "warning");
    return false;
  }

  return true;
};

const currentYear = new Date().getFullYear();


  return (
    <div className="space-y-6">

      <div>
        <h3 className="text-lg font-semibold">
          Date & Time Of Travel
        </h3>
      </div>

      {/* TOP GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

      {/* RENTAL DAYS */}
<div>
<label className="text-sm font-medium text-gray-700">
Rental Days *
</label>

<input
  type="number"
  min="1"
  max="30"
  value={rentalDays}
  onChange={(e) => {

    let value = e.target.value;

    // ❌ REMOVE EMPTY STRING LOGIC

    let num = Number(value);

    if (isNaN(num)) return;

    if (num < 1) {
      setRentalDays(1);
      return;
    }

    if (num > 30) {
      setRentalDays(30);

      Swal.fire({
        title: "Validation",
        text: "Maximum rental days is 30",
        icon: "warning"
      });

      return;
    }

    setRentalDays(num);
  }}
  className="mt-2 w-full h-11 rounded-lg border bg-gray-50 px-3"
/>

<style>
{`
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
-webkit-appearance: none;
margin: 0;
}
`}
</style>
</div>

        {/* RENTAL TYPE */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Rental Type
          </label>

          <select
            value={rentalType}
            onChange={(e)=>setRentalType(e.target.value)}
            className="mt-2 w-full h-11 rounded-lg border bg-gray-50 px-3"
          >
            <option>Self Pickup</option>
            <option>Delivery</option>
          </select>
        </div>

        {/* PASSENGERS */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            No of Passengers
          </label>

     <input
type="number"
min="1"
max="20"
value={passengers}
onChange={(e) => {

let value = e.target.value;

if (value === "") {
setPassengers("");
return;
}

value = Number(value);

if (value < 1) value = 1;
if (value > 20) value = 20;

setPassengers(value);

}}
className="mt-2 w-full h-11 rounded-lg border bg-gray-50 px-3"
/>
        </div>

      </div>

{/* START DATE + TIME */}

<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

  {/* START DATE */}
  <div>
    <label className="text-sm font-medium text-gray-700">
      Start Date *
    </label>

<input
  type="date"
  value={startDate}
  min={getLocalDateStr()}
  max={`${currentYear}-12-31`}
      onChange={(e) => setStartDate(e.target.value)}
      className="mt-2 w-full h-11 rounded-lg border bg-gray-50 px-3"
    />

    {/* SHOW FORMATTED BELOW */}
    <p className="text-xs text-gray-500 mt-1">
      {formatDDMMYYYY(startDate)}
    </p>
  </div>

  {/* START TIME */}
  <div>
    <label className="text-sm font-medium text-gray-700">
      Start Time *
    </label>

    <input
      type="time"
      value={startTime}
      onChange={(e) => setStartTime(e.target.value)}
      className="mt-2 w-full h-11 rounded-lg border bg-gray-50 px-3"
    />

    {/* SHOW FORMATTED BELOW */}
    <p className="text-xs text-gray-500 mt-1">
      {startTime
        ? new Date(`1970-01-01T${startTime}`).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : ""}
    </p>
  </div>

</div>

{/* END DATE + TIME */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

  <div>
    <label className="text-sm font-medium text-gray-700">
      End Date
    </label>

    <input
      type="date"
      value={endDate}
      readOnly
      className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
    />
  </div>

  <div>
    <label className="text-sm font-medium text-gray-700">
      End Time
    </label>

    <input
      type="time"
      value={endTime}
      readOnly
      className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
    />
  </div>

</div>

      {/* LOCATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div>
          <label className="text-sm font-medium text-gray-700">
            Pickup Location *
          </label>
{rentalType === "Self Pickup" ? (

  <input
    type="text"
    value={pickupLocation}
    readOnly
    className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
  />

) : (

  <LocationPicker
    onSelect={(location)=>{
      setPickupLocation(location.address)

      if(sameLocation){
        setReturnLocation(location?.address || pickupLocation)
      }
    }}
  />

)}

        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Return Location *
          </label>

{rentalType === "Self Pickup" ? (

  <input
    type="text"
    value={returnLocation}
    readOnly
    className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
  />

) : sameLocation ? (

  <input
    type="text"
    value={pickupLocation}
    readOnly
    className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
  />

) : (

  <LocationPicker
    onSelect={(location)=>{
      setReturnLocation(location?.address || pickupLocation)
    }}
  />

)}
  </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Security Deposit
          </label>
<input
  type="number"
  value={deposit}
  readOnly
  className="mt-2 w-full h-11 rounded-lg border bg-gray-100 px-3"
/>

        </div>

      </div>

{rentalType !== "Self Pickup" && (

<div className="flex items-center gap-2 text-sm text-gray-600">

<input
type="checkbox"
checked={sameLocation}
onChange={() => {

const checked = !sameLocation;

setSameLocation(checked);

if (checked && pickupLocation) {
setReturnLocation(pickupLocation);
}

}}
/>

Return Same Location

</div>

)}

    </div>
  );
}