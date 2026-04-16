import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth";
import LocationPicker from "../../components/LocationPicker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Shield,
  MapPin,
  Puzzle,
  FileText,
  CreditCard,
  CheckCircle,
  Truck,
  Upload,
  Map,
  Wifi,
  Baby,
  Fuel,
  Radio,
  Usb,
  Zap,
  Receipt,
  Camera,
  Wallet
} from "lucide-react";
export default function Checkout() {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
const EXTRA_ICONS = {
  navigation: Map,
  wifi: Wifi,
  childSeat: Baby,
  fuel: Fuel,
  roadside: Shield,
  radio: Radio,
  usb: Usb,
  express: Zap,
  toll: Receipt,
  dashcam: Camera,
};

  const vehicleFromState = location.state?.vehicleData;
  const bookingFromState = location.state?.bookingData || {};
  const [openDetails, setOpenDetails] = useState(true);
  const [vehicle, setVehicle] = useState(vehicleFromState || null);
const [bookingData, setBookingData] = useState(null);
  
const topRef = useRef(null);

const [activeStep, setActiveStep] = useState(1);
  
  
useEffect(() => {
  topRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}, [activeStep]);

  const [pickupLocation, setPickupLocation] = useState(
    bookingFromState.deliveryLocation || "",
  );

  const [returnLocation, setReturnLocation] = useState(
    bookingFromState.returnLocation || bookingFromState.deliveryLocation || "",
  );

  const [sameLocation, setSameLocation] = useState(
    bookingFromState.sameLocation ?? true,
  );
  const [planType, setPlanType] = useState(
    bookingFromState.selectedPlan || "daily",
  );

  const [deliveryType, setDeliveryType] = useState(
    bookingFromState.deliveryType || "pickup",
  );
  const [pickupDate, setPickupDate] = useState(
    bookingFromState.pickupDate || "",
  );


  // ================= DRIVER STATES =================
const [driverType, setDriverType] = useState("self");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [driverAge, setDriverAge] = useState("");
const [mobileNumber, setMobileNumber] = useState("");
const [licenseNumber, setLicenseNumber] = useState("");

  // ================= DRIVER UPLOAD =================
const [driverPhoto, setDriverPhoto] = useState(null);
const [driverPreview, setDriverPreview] = useState(null);
const [confirmAge, setConfirmAge] = useState(false);

  const [returnDate, setReturnDate] = useState(
    bookingFromState.returnDate || "",
  );
  const [pickupTime, setPickupTime] = useState(
    bookingFromState.pickupTime || "",
  );
  const [returnTime, setReturnTime] = useState(
    bookingFromState.returnTime || "",
  );

  const [openLocationTime, setOpenLocationTime] = useState(true);


  // ================= BILLING =================
const [billingName, setBillingName] = useState("");
const [billingEmail, setBillingEmail] = useState("");
const [billingPhone, setBillingPhone] = useState("");
const [billingAddress, setBillingAddress] = useState("");
const [billingCountry, setBillingCountry] = useState("");
const [billingCity, setBillingCity] = useState("");
const [billingState, setBillingState] = useState("");
const [billingPin, setBillingPin] = useState("");
const [additionalInfo, setAdditionalInfo] = useState("");
const [extraTotal, setExtraTotal] = useState(0);


const [openExtraServices, setOpenExtraServices] = useState(true);

const [selectedPayment, setSelectedPayment] = useState("razorpay");
  useEffect(() => {

  if (!pickupDate) return;

  const start = new Date(pickupDate);
  let newReturn = new Date(start);

  switch (planType) {
    case "daily":
      newReturn.setDate(start.getDate() + 1);
      break;

    case "weekly":
      newReturn.setDate(start.getDate() + 7);
      break;

    case "monthly":
      newReturn.setMonth(start.getMonth() + 1);
      break;

    case "yearly":
      newReturn.setFullYear(start.getFullYear() + 1);
      break;
  }

  const formatted = newReturn.toISOString().split("T")[0];
  setReturnDate(formatted);

}, [planType, pickupDate]);
  // ================= FETCH VEHICLE =================
  useEffect(() => {
    if (vehicleFromState) return; // already have data

    const fetchVehicle = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vehicle-detail/${id}`,
        );
        setVehicle(res.data);
      } catch (err) {
        Swal.fire("Error", "Failed to load vehicle", "error");
      }
    };

    fetchVehicle();
  }, [id, vehicleFromState]);

  useEffect(() => {
    if (!vehicle) return;

    if (deliveryType === "pickup") {
      setPickupLocation(vehicle.mainLocation);
      setReturnLocation(vehicle.mainLocation);
    }
  }, [vehicle, deliveryType]);

  useEffect(() => {
    if (!vehicleFromState && !vehicle) {
      // If someone directly opens URL without state
      navigate(`/listing/${id}`);
    }
  }, []);

  const [basePrice, setBasePrice] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const REFUNDABLE_DEPOSIT = 1000;
// ================= EXTRA SERVICES =================
const [selectedExtras, setSelectedExtras] = useState([]);

useEffect(() => {
  if (!vehicle || !pickupDate || !returnDate || !pickupTime || !returnTime) return;

  const start = new Date(`${pickupDate}T${pickupTime}`);
  const end = new Date(`${returnDate}T${returnTime}`);

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const days = diffDays <= 0 ? 1 : diffDays;

let remainingDays = days;
let base = 0;

const daily = vehicle.pricing?.dailyPrice || 0;
const weekly = vehicle.pricing?.weeklyPrice || 0;
const monthly = vehicle.pricing?.monthlyPrice || 0;
const yearly = vehicle.pricing?.yearlyPrice || 0;

// YEAR
if (remainingDays >= 365 && yearly) {
  const years = Math.floor(remainingDays / 365);
  base += years * yearly;
  remainingDays -= years * 365;
}

// MONTH
if (remainingDays >= 30 && monthly) {
  const months = Math.floor(remainingDays / 30);
  base += months * monthly;
  remainingDays -= months * 30;
}

// WEEK
if (remainingDays >= 7 && weekly) {
  const weeks = Math.floor(remainingDays / 7);
  base += weeks * weekly;
  remainingDays -= weeks * 7;
}

// DAY
if (remainingDays > 0 && daily) {
  base += remainingDays * daily;
}

  const delivery = deliveryType === "delivery" ? 200 : 0;
  const tax = Math.round(base * 0.05);
  const deposit = REFUNDABLE_DEPOSIT;

  // ================= EXTRA CALC =================
  let extrasAmount = 0;

selectedExtras.forEach((extra) => {

  // ❌ SKIP DYNAMIC (TOLL)
  if (extra.type === "dynamic") return;

  if (extra.type === "per_day") {
    extrasAmount += days * extra.price;
  } else {
    extrasAmount += extra.price;
  }
});

  const total = base + delivery + tax + deposit + extrasAmount;

  setBasePrice(base);
  setDeliveryCharge(delivery);
  setTaxAmount(tax);
  setDepositAmount(deposit);
  setExtraTotal(extrasAmount);
  setGrandTotal(total);

}, [
  vehicle,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  deliveryType,
  selectedExtras
]);
  if (!vehicle) return <div className="p-10">Loading...</div>;

  // ================= HANDLE BOOKING =================
  const handleBooking = async (paymentData = null) => {

    // ================= BILLING VALIDATION =================

if (!billingName || billingName.length < 2) {
  Swal.fire("Invalid Name", "Enter valid full name", "warning");
  return;
}

if (!/^\S+@\S+\.\S+$/.test(billingEmail)) {
  Swal.fire("Invalid Email", "Enter valid email address", "warning");
  return;
}

if (!/^[6-9]\d{9}$/.test(billingPhone)) {
  Swal.fire("Invalid Phone", "Enter valid 10 digit mobile number", "warning");
  return;
}

if (!billingAddress) {
  Swal.fire("Missing Address", "Enter billing address", "warning");
  return;
}

if (!billingCity) {
  Swal.fire("Missing City", "Enter city", "warning");
  return;
}

if (!billingCountry) {
  Swal.fire("Missing Country", "Enter country", "warning");
  return;
}

if (!/^\d{6}$/.test(billingPin)) {
  Swal.fire("Invalid Pincode", "Enter valid 6 digit pincode", "warning");
  return;
}
    if (!pickupDate || !returnDate) {
      Swal.fire(
        "Missing Dates",
        "Please select pickup and return dates",
        "warning",
      );
      return;
    }

    if (deliveryType === "delivery" && (!pickupLocation || !returnLocation)) {
      Swal.fire(
        "Missing Location",
        "Please enter delivery location",
        "warning",
      );
      return;
    }
    // ================= FULL DATE + TIME VALIDATION =================

    if (!pickupTime || !returnTime) {
      Swal.fire(
        "Missing Time",
        "Please select pickup and return time",
        "warning",
      );
      return;
    }

    const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const endDateTime = new Date(`${returnDate}T${returnTime}`);

    if (endDateTime <= startDateTime) {
      Swal.fire(
        "Invalid Date & Time",
        "Return date & time must be after pickup date & time",
        "warning",
      );
      return;
    }
const diffMs = endDateTime - startDateTime;

if (diffMs < 60 * 60 * 1000) {
  Swal.fire(
    "Invalid Booking",
    "Minimum booking duration is 1 hour",
    "warning"
  );
  return;
}
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Swal.fire("Login Required", "Please login first", "warning");
      return;
    }

    const token = await user.getIdToken();
/* ================= FINAL AVAILABILITY CHECK ================= */

try {

  const check = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/vehicle-detail/check-availability`,
    {
      listingId: id,
      pickupDate: startDateTime,
      returnDate: endDateTime
    }
  );

  if (!check.data.available) {
    Swal.fire({
      icon: "error",
      title: "Not Available",
      text: check.data.message || "Vehicle already booked or reserved"
    });
    return;
  }

} catch (err) {
  Swal.fire(
    "Error",
    "Could not verify availability",
    "error"
  );
  return;
}
    try {
      Swal.fire({
        title: "Processing Booking...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      // Ensure return location is always set if sameLocation
      let finalPickup = pickupLocation;
      let finalReturn = returnLocation;

      if (deliveryType === "delivery" && sameLocation) {
        finalReturn = pickupLocation;
      }
const fd = new FormData();
if (paymentData) {
  fd.append("payments", JSON.stringify(paymentData));
}
fd.append("listingId", id);
fd.append("listingType", vehicle.type);
fd.append("deliveryType", deliveryType);
fd.append("pickupDate", pickupDate);
fd.append("returnDate", returnDate);
fd.append("pickupTime", pickupTime);
fd.append("returnTime", returnTime);
fd.append("deliveryCharge", deliveryCharge);
fd.append("planType", planType);
fd.append("paymentMethod", selectedPayment);
fd.append("pickupLocation", finalPickup);
fd.append("returnLocation", finalReturn);
fd.append("extras", JSON.stringify(selectedExtras));
fd.append(
  "billing",
  JSON.stringify({
    name: billingName,
    email: billingEmail,
    phone: billingPhone,
    addressLine: billingAddress,
    country: billingCountry,
    city: billingCity,
    state: billingState,
    pinCode: billingPin,
    additionalInfo,
  })
);

fd.append(
  "driver",
  JSON.stringify({
    driverType,
    firstName,
    lastName,
    age: driverAge,
    mobile: mobileNumber,
    licenseNumber,
  })
);

if (driverPhoto) {
  fd.append("driverPhoto", driverPhoto);
}
const res = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/bookings`,
  fd,
  {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  }
);

// ✅ SAVE BOOKING RESPONSE
setBookingData(res.data);
      Swal.close();

      Swal.fire({
        icon: "success",
        title: paymentData ? "Payment Successful!" : "Booking Confirmed!",
text: paymentData ? "" : "Please pay at pickup location.",
        timer: 1500,
        showConfirmButton: false,
      });
setActiveStep(5);
    
    } catch (err) {
      Swal.close();
      Swal.fire(
        "Error",
        err.response?.data?.message || "Booking failed",
        "error",
      );
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire("Error", "Geolocation not supported", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const locationString = `Lat: ${latitude.toFixed(
          5,
        )}, Lng: ${longitude.toFixed(5)}`;

        setPickupLocation(locationString);

        if (sameLocation) {
          setReturnLocation(locationString);
        }
      },
      () => {
        Swal.fire("Error", "Location access denied", "error");
      },
    );
  };

  // ================= CURRENT DATE/TIME =================
  const now = new Date();

  const todayDate = now.toISOString().split("T")[0]; // yyyy-mm-dd
const endOfYear = new Date(
  now.getFullYear(),
  11,
  31
).toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  const toggleExtra = (extra) => {
  const exists = selectedExtras.find((e) => e.key === extra.key);

  if (exists) {
    setSelectedExtras(selectedExtras.filter((e) => e.key !== extra.key));
  } else {
    setSelectedExtras([...selectedExtras, extra]);
  }
};

const formatDateTime = (date, time) => {
  if (!date || !time) return "-";

  const dt = new Date(`${date}T${time}`);

  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",      // 🔥 important (not 2-digit)
    minute: "2-digit",
    hour12: true,         // 🔥 this converts 19 → 7 PM
  });
};


const useProfileInfo = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Swal.fire("Login Required", "Please login first", "warning");
      return;
    }

    const token = await user.getIdToken();

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/profile/${user.uid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const p = res.data;

    // Fill billing fields
    setBillingName(p.name || "");
    setBillingEmail(p.email || "");
    setBillingPhone(p.phone || "");
    setBillingAddress(p.addressLine || "");
    setBillingCountry(p.country || "");
    setBillingCity(p.city || "");
    setBillingState(p.state || "");
    setBillingPin(p.pinCode || "");

    Swal.fire({
      icon: "success",
      title: "Profile information loaded",
      timer: 1200,
      showConfirmButton: false,
    });

  } catch (err) {
    Swal.fire(
      "Error",
      err.response?.data?.message || "Could not load profile",
      "error"
    );
  }
};
const handleRazorpayPayment = async () => {
  try {

    if (!grandTotal || grandTotal <= 0) {
      Swal.fire("Invalid Amount", "Payment amount invalid", "error");
      return;
    }

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/payment/create-orders`,
      { amount: grandTotal }
    );

    const orders = res.data.orders;

    // ✅ Show message BEFORE payment starts
// format payment breakdown
const breakdown = orders
  .map(o => `₹${(o.amount / 100).toLocaleString("en-IN")}`)
  .join(" + ");

await Swal.fire({
  icon: "info",
  title: "Large Payment",
  text: `Your payment will be completed in ${orders.length} parts (${breakdown}) due to payment gateway limits.`,
  confirmButtonText: "Continue Payment"
});

    let paymentDetails = [];

    for (let i = 0; i < orders.length; i++) {

      const order = orders[i];

      await new Promise((resolve, reject) => {

const options = {
  key: "rzp_test_SR3nZhx9Spit96",

  order_id: order.id,

 // 🔴 REQUIRED (in paise)

  currency: "INR",

  name: "Vehigo",

  description: `Payment ${i + 1} of ${orders.length}`,

  prefill: {
    name: billingName,
    email: billingEmail,
    contact: billingPhone
  },

  theme: {
    color: "#f97316"
  },

handler: async function (response) {

  const verify = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/payment/verify-payment`,
    {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    }
  );

  if (verify.data.success) {

    // ✅ Save payment info for booking
    paymentDetails.push({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
  
    });

    resolve(); // continue to next payment

  } else {

    reject();

  }

}
};

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response) {

          Swal.fire({
            icon: "error",
            title: "Payment Failed",
            text: response.error.description
          });

          reject();

        });

        rzp.open();

      });

    }

    await handleBooking(paymentDetails);

    Swal.fire({
      icon: "success",
      title: "Payment Successful!",
      timer: 1500,
      showConfirmButton: false
    });

    setActiveStep(5);

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "Payment Failed",
      text: err?.response?.data?.message || "Payment failed"
    });

  }
};
useEffect(() => {
  if (activeStep === 3) {
    useProfileInfo();
  }
}, [activeStep]);


const downloadInvoice = async () => {

  const element = document.getElementById("invoice");

  const buttons = document.querySelectorAll(".no-print");
  buttons.forEach(btn => btn.style.display = "none");

const canvas = await html2canvas(element, {
  scale: 2,
  useCORS: true,        // 🔥 REQUIRED
  allowTaint: true,
  backgroundColor: "#ffffff",
  scrollY: -window.scrollY
});

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p","mm","a4");

  const pageWidth = 210;
  const pageHeight = 297;

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight);

  heightLeft -= pageHeight;

  while (heightLeft > 0) {

    position = heightLeft - imgHeight;

    pdf.addPage();

    pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight);

    heightLeft -= pageHeight;

  }

  pdf.save(`vehigo-booking-${Date.now()}.pdf`);

  buttons.forEach(btn => btn.style.display = "flex");
};

const paymentMethod = bookingData?.payment?.method || "pickup";

const isOnline = bookingData?.payment?.method === "razorpay";
const pendingAmount =
  paymentMethod === "pickup"
    ? grandTotal
    : 0;
const transactionId = isOnline
  ? bookingData?.payment?.transactions
      ?.map(t => t.razorpay_payment_id)
      .join(", ")
  : null;

  return (
    <div className="bg-[#eef2f4] py-10">
{/* ================= MODERN STEPPER ================= */}
<div ref={topRef} className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md px-10 py-8 mb-10">
  <div className="text-center mb-10">
    <h2 className="text-2xl font-bold text-gray-800">
      Reserve Your Car
    </h2>
    <p className="text-gray-500 text-sm mt-1">
      Complete the following steps
    </p>
  </div>

  <div className="flex items-center justify-between relative gap-4 overflow-x-auto px-2">

    {/* CONNECTOR LINE */}
    <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-200"></div>

    {/* ACTIVE PROGRESS LINE */}
    <div
      className="absolute top-6 left-0 h-[2px] bg-[#4f6f6f] transition-all duration-500"
      style={{
        width:
          activeStep === 1
            ? "0%"
            : activeStep === 2
            ? "25%"
            : activeStep === 3
            ? "50%"
            : activeStep === 4
            ? "75%"
            : "100%",
      }}
    ></div>

    {[
      { icon: <MapPin size={20} />, label: "Location" },
      { icon: <Puzzle size={20} />, label: "Driver" },
      { icon: <FileText size={20} />, label: "Detail" },
      { icon: <CreditCard size={20} />, label: "Checkout" },
      { icon: <CheckCircle size={20} />, label: "Confirmed" },
    ].map((step, index) => {
      const stepNumber = index + 1;
      const isActive = activeStep >= stepNumber;

      return (
        <div
          key={index}
          className="flex flex-col items-center relative z-10 w-full"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300
              ${isActive ? "bg-[#4f6f6f]" : "bg-gray-300"}`}
          >
            {step.icon}
          </div>

          <span
            className={`text-xs mt-3 font-medium ${
              isActive ? "text-[#4f6f6f]" : "text-gray-400"
            }`}
          >
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
</div>


      <div className="bg-[#eef2f4] py-12">
        <div className={`max-w-7xl mx-auto grid gap-6 px-4 md:px-6 
  ${activeStep === 5 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}
`}>
          {/* LEFT SIDE */}
          <div className="col-span-1 lg:col-span-2 space-y-6 md:space-y-8">
            {/* ================= STEP 1 : LOCATION ================= */}
{activeStep === 1 && (
  <>
            {/* ================= RENTAL TYPE ================= */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 text-orange-500 p-2 rounded-md">
                  <Truck size={18} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Rental Type
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* DELIVERY */}
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`relative border rounded-lg h-20 flex items-center justify-center transition-all
        ${
          deliveryType === "delivery"
            ? "border-[#3d6f73] bg-[#eaf3f3]"
            : "border-gray-200 bg-gray-50"
        }`}
                >
                  {/* Top Circle Indicator */}
                  <div
                    className={`absolute -top-3 w-5 h-5 rounded-full border-2
          ${
            deliveryType === "delivery"
              ? "bg-[#3d6f73] border-[#3d6f73]"
              : "bg-gray-300 border-gray-300"
          }`}
                  ></div>

                  <span className="text-gray-800 font-medium">Delivery</span>
                </button>

                {/* PICKUP */}
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`relative border rounded-lg h-20 flex items-center justify-center transition-all
        ${
          deliveryType === "pickup"
            ? "border-[#3d6f73] bg-[#eaf3f3]"
            : "border-gray-200 bg-gray-50"
        }`}
                >
                  {/* Top Circle Indicator */}
                  <div
                    className={`absolute -top-3 w-5 h-5 rounded-full border-2
          ${
            deliveryType === "pickup"
              ? "bg-[#3d6f73] border-[#3d6f73]"
              : "bg-gray-300 border-gray-300"
          }`}
                  ></div>

                  <span className="text-gray-800 font-medium">Self Pickup</span>
                </button>
              </div>
            </div>

            {/* ================= LOCATION ================= */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 text-orange-500 p-2 rounded-md">
                  <MapPin size={18} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Location
                </h3>
              </div>

              {/* ================= DELIVERY MODE ================= */}
              {deliveryType === "delivery" && (
                <div className="space-y-6">
                  {/* DELIVERY LOCATION */}
                  <div>
                    <label className="font-medium text-gray-700">
                      Delivery Location
                    </label>

                    <LocationPicker
                      onSelect={(location) => {
                        const selectedAddress = location.address;

                        setPickupLocation(selectedAddress);

                        // ALWAYS update return if sameLocation
                        if (sameLocation) {
                          setReturnLocation(selectedAddress);
                        }
                      }}
                    />

                    {pickupLocation && (
                      <p className="text-sm text-gray-500 mt-2">
                        Selected: {pickupLocation}
                      </p>
                    )}
                  </div>

                  {/* SAME LOCATION CHECKBOX */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sameLocation}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameLocation(checked);

                        if (checked) {
                          // If enabling same location → copy pickup
                          setReturnLocation(pickupLocation);
                        } else {
                          // If disabling → clear return
                          setReturnLocation("");
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      Return to same location
                    </span>
                  </div>

                  {/* RETURN LOCATION */}
                  {!sameLocation && (
                    <div>
                      <label className="font-medium text-gray-700">
                        Return Location
                      </label>

                      <LocationPicker
                        onSelect={(location) =>
                          setReturnLocation(location.address)
                        }
                      />

                      {returnLocation && (
                        <p className="text-sm text-gray-500 mt-2">
                          Selected: {returnLocation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ================= PICKUP MODE ================= */}
              {deliveryType === "pickup" && (
                <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm">Pickup Location:</p>
                    <p className="font-medium text-gray-800">
                      {vehicle.mainLocation}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Return Location:</p>
                    <p className="font-medium text-gray-800">
                      {vehicle.mainLocation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ================= BOOKING TYPE & TIME ================= */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 lg:p-8">
              {/* HEADER */}
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-orange-100 text-orange-500 p-3 rounded-lg">
                  <Shield size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Booking type & Time
                </h3>
              </div>

              {/* PLAN SELECTION */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-10">
                {[
                  {
                    key: "daily",
                    label: `Day (₹${vehicle.pricing?.dailyPrice || 0})`,
                  },
                  {
                    key: "weekly",
                    label: `Weekly (₹${vehicle.pricing?.weeklyPrice || 0})`,
                  },
                  {
                    key: "monthly",
                    label: `Monthly (₹${vehicle.pricing?.monthlyPrice || 0})`,
                  },
                  {
                    key: "yearly",
                    label: `Yearly (₹${vehicle.pricing?.yearlyPrice || 0})`,
                  },
                ].map((plan) => (
                  <button
                    key={plan.key}
                    onClick={() => setPlanType(plan.key)}
                    className={`relative border rounded-xl h-20 flex items-center justify-center transition-all
          ${
            planType === plan.key
              ? "border-[#3d6f73] bg-[#eef5f5]"
              : "border-gray-200 bg-gray-50"
          }`}
                  >
                    {/* Top Circle Indicator */}
                    <div
                      className={`absolute -top-3 w-4 h-4 rounded-full border-2
            ${
              planType === plan.key
                ? "bg-[#3d6f73] border-[#3d6f73]"
                : "bg-gray-300 border-gray-300"
            }`}
                    ></div>

                    <span className="font-medium text-gray-800">
                      {plan.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* DATE & TIME GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* START DATE */}
                <div>
                  <label className="font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="relative mt-2">
                    <input
                      type="date"
                      min={todayDate}
                      max={endOfYear} 
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
                    />
                 
                  </div>
                </div>

                {/* START TIME */}
                <div>
                  <label className="font-medium text-gray-700">
                    Start Time
                  </label>
                  <div className="relative mt-2">
                    <input
                      type="time"
                      min={pickupDate === todayDate ? currentTime : undefined}
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
                    />
           
                  </div>
                </div>

                {/* RETURN DATE */}
                <div>
                  <label className="font-medium text-gray-700">
                    Return Date
                  </label>
                  <div className="relative mt-2">
<input
  type="date"
  min={pickupDate || todayDate}
  max={
    new Date(
      new Date(pickupDate).setFullYear(
        new Date(pickupDate).getFullYear() + 1
      )
    )
      .toISOString()
      .split("T")[0]
  }
  value={returnDate}
  onChange={(e) => setReturnDate(e.target.value)}
   className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
/>
                                  

                  </div>
                </div>

                {/* RETURN TIME */}
                <div>
                  <label className="font-medium text-gray-700">
                    Return Time
                  </label>
                  <div className="relative mt-2">
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
                    />
               
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col md:flex-row justify-end gap-4 mt-12">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-black text-white px-6 py-3 rounded-lg"
                >
                  Back to Car details
                </button>

<button
  onClick={() => {
    // ================= BASIC CHECK =================
    if (!deliveryType) {
      Swal.fire("Missing Info", "Select rental type", "warning");
      return;
    }

    // ================= LOCATION CHECK =================
    if (deliveryType === "delivery") {
      if (!pickupLocation) {
        Swal.fire("Missing Location", "Select delivery location", "warning");
        return;
      }

      if (!sameLocation && !returnLocation) {
        Swal.fire("Missing Location", "Select return location", "warning");
        return;
      }
    }

    // ================= DATE CHECK =================
    if (!pickupDate || !returnDate) {
      Swal.fire("Missing Dates", "Select pickup & return dates", "warning");
      return;
    }

    if (!pickupTime || !returnTime) {
      Swal.fire("Missing Time", "Select pickup & return time", "warning");
      return;
    }

    const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const endDateTime = new Date(`${returnDate}T${returnTime}`);
    const nowDateTime = new Date();

    // ================= EXPIRED CHECK =================
    if (startDateTime < nowDateTime) {
      Swal.fire("Invalid Time", "Pickup time cannot be in the past", "warning");
      return;
    }

    if (endDateTime <= startDateTime) {
      Swal.fire(
        "Invalid Selection",
        "Return date & time must be after pickup",
        "warning"
      );
      return;
    }

    // ================= SUCCESS =================
    setActiveStep(2);
  }}
  className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-lg w-full md:w-auto"
>
  Continue Booking
</button>
              </div>
            </div>
              </>
)}

{/* ================= STEP 2 : DRIVER ================= */}
{activeStep === 2 && (
  <div className="space-y-8">

{/* ================= EXTRA SERVICES ================= */}
{vehicle.type === "Vehicle" && vehicle.extras?.length > 0 && (
  <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 lg:p-8 border">
    {/* HEADER */}
    <div className="flex items-center gap-3 mb-8">
      <div className="bg-orange-100 text-orange-500 p-2 rounded-lg">
        <Puzzle size={18} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">
        Extra Services
      </h3>
    </div>

    {/* GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {vehicle.extras.map((extra) => {
        const isSelected = selectedExtras.find(
          (e) => e.key === extra.key
        );

        const Icon = EXTRA_ICONS[extra.key] || Puzzle;

        return (
          <div
            key={extra.key}
            className={`border rounded-xl p-5 flex justify-between items-center transition duration-200
              ${
                isSelected
                  ? "border-[#3d6f73] bg-[#eef5f5] shadow-md"
                  : "border-gray-200 bg-white hover:shadow-sm"
              }`}
          >
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-black text-white">
                <Icon size={20} />
              </div>

              <div>
           <h4 className="font-semibold text-gray-800 flex items-center gap-2">
  {extra.title}

  {extra.type === "dynamic" && (
    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
      Dynamic
    </span>
  )}
</h4>
  <p className="text-sm text-gray-500">
  {extra.type === "dynamic"
    ? "Price on usage (Toll)"
    : `₹${extra.price} ${
        extra.type === "per_day" ? "Per Day" : "One Time"
      }`}
</p>
              </div>
            </div>

            {/* RIGHT BUTTON */}
            <button
              onClick={() => toggleExtra(extra)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  isSelected
                    ? "bg-black text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              {isSelected ? "Remove" : "Add"}
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* ================= DRIVER DETAILS ================= */}
<div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 lg:p-8 border">

  {/* HEADER */}
  <div className="flex items-center gap-3 mb-8">
    <div className="bg-orange-100 text-orange-500 p-2 rounded-lg">
      <FileText size={18} />
    </div>
    <h3 className="text-lg font-semibold text-gray-800">
      Driver details
    </h3>
  </div>

{/* DRIVER TYPE */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
  {[
    { key: "self", label: "Self Driver" },
  ].map((type) => (
    <button
      key={type.key}
      onClick={() => setDriverType(type.key)}
      className={`relative border rounded-xl h-24 flex flex-col items-center justify-center transition-all
        ${
          driverType === type.key
            ? "border-[#3d6f73] bg-[#eef5f5]"
            : "border-gray-200 bg-gray-50"
        }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 mb-3
          ${
            driverType === type.key
              ? "bg-[#3d6f73] border-[#3d6f73]"
              : "bg-gray-300 border-gray-300"
          }`}
      />
      <span className="font-medium text-gray-800">
        {type.label}
      </span>
    </button>
  ))}
</div>

{/* INPUT FIELDS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

  {/* FIRST NAME */}
  <InputField
    label="First Name *"
    value={firstName}
onChange={(v) => {
  const clean = v.replace(/[^A-Za-z]/g, "");
  if (clean.length <= 20) setFirstName(clean);
}}
  />

  {/* LAST NAME */}
  <InputField
    label="Last Name *"
    value={lastName}
    onChange={(v) => {
      const clean = v.replace(/[^A-Za-z]/g, "");
      if (clean.length <= 20) setLastName(clean);
    }}
  />

  {/* AGE */}
  <InputField
    label="Driver Age *"
    value={driverAge}
    onChange={(v) => {
      const clean = v.replace(/\D/g, "");
      if (clean.length <= 3) setDriverAge(clean);
    }}
  />

  {/* MOBILE */}
  <InputField
    label="Mobile Number *"
    value={mobileNumber}
    onChange={(v) => {
      const clean = v.replace(/\D/g, "");
      if (clean.length <= 10) setMobileNumber(clean);
    }}
  />

</div>

{/* LICENSE NUMBER */}
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">
    Driving Licence Number *
  </label>

  <input
    value={licenseNumber}
    placeholder="GJ01 2023 000123"
    onChange={(e) => {
      let value = e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

      // Add space after 4 characters (GJ01)
      if (value.length > 4) {
        value = value.slice(0, 4) + " " + value.slice(4);
      }

      // Add space after year (GJ01 2023)
      if (value.length > 9) {
        value = value.slice(0, 9) + " " + value.slice(9);
      }

      // Limit total length (max 18 chars)
      if (value.length > 18) {
        value = value.slice(0, 18);
      }

      setLicenseNumber(value);
    }}
    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
  />

  <p className="text-xs text-gray-500">
    Format: SS00 YYYY 000123 (6–8 digits at end)
  </p>
</div>

{/* ================= PDF UPLOAD ================= */}
<div className="mt-8">
  <label className="font-medium text-gray-700">
    Upload Driving Licence (PDF Only) *
  </label>

  <div className="border-2 border-dashed rounded-xl p-10 mt-3 text-center bg-gray-50">

    {driverPhoto ? (
      <div className="flex flex-col items-center gap-4">
        <FileText size={40} className="text-red-500" />
        <p className="text-sm font-medium">{driverPhoto.name}</p>

        <button
          onClick={() => {
            setDriverPhoto(null);
          }}
          className="text-red-500 text-sm"
        >
          Remove
        </button>
      </div>
    ) : (
      <>
        <label className="inline-flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-lg cursor-pointer">
          <Upload size={16} />
          Upload PDF
          <input
            type="file"
            hidden
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              // ✅ PDF TYPE CHECK
              if (file.type !== "application/pdf") {
                Swal.fire("Invalid File", "Only PDF allowed", "warning");
                return;
              }

              // ✅ SIZE CHECK (5MB)
              if (file.size > 5 * 1024 * 1024) {
                Swal.fire("Error", "Max size 5MB", "error");
                return;
              }

              setDriverPhoto(file);
            }}
          />
        </label>

        <p className="text-sm text-gray-500 mt-3">
          Only PDF allowed (Max 5MB)
        </p>
      </>
    )}
  </div>
</div>
  {/* AGE CONFIRM */}
  <div className="flex items-center gap-3 mt-6">
    <input
      type="checkbox"
      checked={confirmAge}
      onChange={() => setConfirmAge(!confirmAge)}
    />
    <span className="text-sm text-gray-600">
      I Confirm Driver's Age is above 20 years old
    </span>
  </div>

</div>
<div className="flex justify-end gap-4 mt-10">
  <button
    onClick={() => setActiveStep(1)}
    className="px-6 py-3 border rounded-lg"
  >
    Back
  </button>

  <button
onClick={() => {

  const first = firstName.trim();
  const last = lastName.trim();
  const mobile = mobileNumber.trim();
  const age = Number(driverAge);
  const license = licenseNumber.trim();

  // ================= NAME VALIDATION =================
  if (!/^[A-Za-z]{2,20}$/.test(first)) {
    Swal.fire("Invalid First Name", 
      "Only letters allowed (2-20 characters)", 
      "warning"
    );
    return;
  }

  if (!/^[A-Za-z]{2,20}$/.test(last)) {
    Swal.fire("Invalid Last Name", 
      "Only letters allowed (2-20 characters)", 
      "warning"
    );
    return;
  }

  // ================= AGE VALIDATION =================
  if (!driverAge) {
    Swal.fire("Missing Age", "Enter driver age", "warning");
    return;
  }

  if (!/^\d{2,3}$/.test(driverAge)) {
    Swal.fire("Invalid Age", "Age must be 2 or 3 digits", "warning");
    return;
  }

  if (age < 20 || age > 80) {
    Swal.fire("Invalid Age", "Driver age must be between 20 and 80", "warning");
    return;
  }

  // ================= MOBILE VALIDATION =================
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    Swal.fire(
      "Invalid Mobile Number",
      "Enter valid 10-digit number starting with 6,7,8 or 9",
      "warning"
    );
    return;
  }

  // ================= LICENSE VALIDATION =================
const licenseRegex = /^[A-Z]{2}\d{2}\s\d{4}\s\d{6,8}$/;

  if (!licenseRegex.test(license)) {
Swal.fire(
  "Invalid License Number",
  "Format must be like: GJ01 2023 000123 (6–8 digits)",
  "warning"
);
    return;
  }

  // ================= FILE VALIDATION =================
  if (!driverPhoto) {
    Swal.fire("Upload Required", "Upload driving licence PDF", "warning");
    return;
  }

  // ================= CONFIRM AGE =================
  if (!confirmAge) {
    Swal.fire("Confirmation Required", "Confirm age checkbox", "warning");
    return;
  }

  // SUCCESS
  setActiveStep(3);
}}
    className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-lg w-full md:w-auto"
  >
    Continue
  </button>
</div>
  </div>
)}
{activeStep === 3 && (
  <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 lg:p-8 border space-y-8">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <CreditCard size={20} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Billing Information
        </h3>
      </div>

      <button
        onClick={useProfileInfo}
        className="text-sm bg-[#3d6f73] text-white px-4 py-2 rounded-lg"
      >
        Use Profile Info
      </button>
    </div>

    {/* FORM */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

      <InputField label="Full Name *" value={billingName} onChange={setBillingName} />
      <InputField label="Email *" value={billingEmail} onChange={setBillingEmail} />
      <InputField label="Phone *" value={billingPhone} onChange={setBillingPhone} />
      <InputField label="City *" value={billingCity} onChange={setBillingCity} />
      <InputField label="Country *" value={billingCountry} onChange={setBillingCountry} />
      <InputField label="State" value={billingState} onChange={setBillingState} />
      <InputField label="Pincode *" value={billingPin} onChange={setBillingPin} />

    </div>

    <InputField
      label="Street Address *"
      value={billingAddress}
      onChange={setBillingAddress}
    />

    <div>
      <label className="text-sm font-medium text-gray-700">
        Additional Information
      </label>
      <textarea
        value={additionalInfo}
        onChange={(e) => setAdditionalInfo(e.target.value)}
        className="w-full bg-gray-100 border rounded-lg px-4 py-3 mt-2"
      />
    </div>

    {/* BUTTONS */}
    <div className="flex justify-end gap-4">
      <button
        onClick={() => setActiveStep(2)}
        className="px-6 py-3 border rounded-lg"
      >
        Back
      </button>

<button
  onClick={() => setActiveStep(4)}
  className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-lg w-full md:w-auto"
>
  Continue to Payment
</button>
    </div>
  </div>
)}


{activeStep === 4 && (
  <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-8">

    {/* HEADER */}
    <div className="flex items-center gap-3">
      <div className="bg-orange-100 text-orange-500 p-2 rounded-md">
        <CreditCard size={18}/>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-gray-800">
        Payment Method
      </h3>
    </div>

    <p className="text-gray-500 text-sm">
      Choose how you want to complete your booking
    </p>

    {/* PAYMENT OPTIONS */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* RAZORPAY */}
      <div
        onClick={() => setSelectedPayment("razorpay")}
        className={`border rounded-xl p-6 cursor-pointer transition-all flex items-center justify-between
        ${selectedPayment === "razorpay"
          ? "border-[#3d6f73] bg-[#eef5f5]"
          : "border-gray-200 hover:shadow-sm"}`}
      >
        <div className="flex items-center gap-4">

          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <CreditCard size={20}/>
          </div>

          <div>
            <p className="font-semibold text-gray-800">
              Razorpay
            </p>

            <p className="text-xs text-gray-500">
              UPI • Cards • Netbanking • Wallet
            </p>
          </div>
        </div>

        {selectedPayment === "razorpay" && (
          <CheckCircle size={20} className="text-green-500"/>
        )}
      </div>

      {/* PAY AT PICKUP */}
      <div
        onClick={() => setSelectedPayment("pickup")}
        className={`border rounded-xl p-6 cursor-pointer transition-all flex items-center justify-between
        ${selectedPayment === "pickup"
          ? "border-[#3d6f73] bg-[#eef5f5]"
          : "border-gray-200 hover:shadow-sm"}`}
      >
        <div className="flex items-center gap-4">

          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <Wallet size={20}/>
          </div>

          <div>
            <p className="font-semibold text-gray-800">
              Pay at Pickup
            </p>

            <p className="text-xs text-gray-500">
              Pay when you receive the vehicle
            </p>
          </div>

        </div>

        {selectedPayment === "pickup" && (
          <CheckCircle size={20} className="text-green-500"/>
        )}
      </div>

    </div>

    {/* PAYMENT SUMMARY */}
    <div className="bg-gray-50 border rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

      <div className="flex items-center gap-3">

        <div className="bg-gray-200 p-2 rounded-md">
          <Receipt size={18}/>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Total Amount
          </p>

          <p className="text-3xl font-bold text-gray-800">
            ₹{grandTotal}
          </p>
        </div>

      </div>

      {/* PAY BUTTON */}
      <button
        onClick={() => {
          if (selectedPayment === "razorpay") {
            handleRazorpayPayment();
          } else {
            handleBooking();
          }
        }}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md w-full md:w-auto flex items-center justify-center gap-2"
      >

        {selectedPayment === "pickup" ? (
          <>
            <CheckCircle size={18}/>
            Confirm Booking
          </>
        ) : (
          <>
            <CreditCard size={18}/>
            Pay ₹{grandTotal}
          </>
        )}

      </button>

    </div>

    {/* BACK BUTTON */}
    <div className="flex justify-end">
      <button
        onClick={() => setActiveStep(3)}
        className="border px-6 py-2 rounded-lg text-sm hover:bg-gray-50"
      >
        Back
      </button>
    </div>

  </div>
)}

{activeStep === 5 && (
<div id="invoice" className="bg-white max-w-6xl mx-auto p-4 md:p-6 lg:p-10 rounded-2xl shadow space-y-8">

  {/* ===== HEADER ===== */}
  <div className="text-center">
<div className="flex justify-center mb-4">
  <div className="w-16 h-16 rounded-full border-4 border-green-100 flex items-center justify-center">
    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
      <span className="text-white text-xl font-bold">✓</span>
    </div>
  </div>
</div>
    <h2 className="text-xl font-semibold">
      Thank you! Your Order has been Received
    </h2>

    <p className="text-gray-500">
      Order Number: #{bookingData?.bookingId}
    </p>
  </div>

  {/* ===== VEHICLE CARD ===== */}
  <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
    <div className="flex gap-4 items-center">
      <img
        src={vehicle.imageUrl || vehicle.images?.[0]}
        crossOrigin="anonymous"
        className="w-20 h-14 rounded object-cover"
      />
      <div>
        <p className="font-semibold">{vehicle.name}</p>
        <p className="text-sm text-gray-500">📍 {vehicle.mainLocation}</p>
      </div>
    </div>

    <div className="text-right">
      <p className="text-sm text-gray-500">Total Amount</p>
      <p className="text-red-500 font-bold text-lg">₹{grandTotal}</p>
    </div>
  </div>

  {/* ===== GRID ===== */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* ===== CAR PRICING ===== */}
    <div className="border rounded-lg p-5">
      <h3 className="font-semibold mb-4">Car Pricing</h3>

      <div className="space-y-2 text-sm">

        <div className="flex justify-between">
          <span>Rental Charges</span>
          <span>₹{basePrice}</span>
        </div>

        <div className="flex justify-between">
          <span>Tax (5%)</span>
          <span>₹{taxAmount}</span>
        </div>
{deliveryCharge > 0 && (
  <div className="flex justify-between">
    <span>Delivery Charge</span>
    <span>₹{deliveryCharge}</span>
  </div>
)}
        <div className="flex justify-between text-orange-600">
          <span>Refundable Deposit</span>
          <span>₹{depositAmount}</span>
        </div>

        {extraTotal > 0 && (
          <div className="flex justify-between">
            <span>Extra Services</span>
            <span>₹{extraTotal}</span>
          </div>
        )}

        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>

      </div>
    </div>

    {/* ===== LOCATION ===== */}
    <div className="border rounded-lg p-5">
      <h3 className="font-semibold mb-4">Location & Time</h3>

      <p><b>Booking Type:</b> {planType}</p>

      <p className="mt-2"><b>Pickup:</b> {pickupLocation}</p>
      <p className="text-gray-500 text-sm">
        {formatDateTime(pickupDate, pickupTime)}
      </p>

      <p className="mt-2"><b>Return:</b> {returnLocation}</p>
      <p className="text-gray-500 text-sm">
        {formatDateTime(returnDate, returnTime)}
      </p>
    </div>

{/* ===== EXTRA SERVICES ===== */}
{vehicle?.type === "Vehicle" && selectedExtras?.length > 0 && (
  <div className="border rounded-lg p-5 bg-gray-50">
    <h3 className="font-semibold mb-4">Extra Services Pricing</h3>

    {selectedExtras.map((extra) => {
      const start = new Date(`${pickupDate}T${pickupTime}`);
      const end = new Date(`${returnDate}T${returnTime}`);

      const days = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      );

      const price =
        extra.type === "per_day"
          ? days * extra.price
          : extra.price;

      return (
        <div key={extra.key} className="flex justify-between text-sm">
          <span>{extra.title}</span>
          <span>
  {extra.type === "dynamic"
    ? "Will be added"
    : `₹${price}`}
</span>
        </div>
      );
    })}

    <div className="flex justify-between font-semibold border-t pt-3 mt-3">
      <span>Extra Services Charges</span>
      <span>₹{extraTotal}</span>
    </div>
  </div>
)}

    {/* ===== DRIVER ===== */}
    <div className="border rounded-lg p-5">
      <h3 className="font-semibold mb-4">Driver Details</h3>

      <p>{firstName} {lastName}</p>
      <p className="text-sm text-gray-500">📞 {mobileNumber}</p>
      <p className="text-sm">License: {licenseNumber}</p>
    </div>

    {/* ===== BILLING ===== */}
    <div className="border rounded-lg p-5">
      <h3 className="font-semibold mb-4">Billing Information</h3>

      <p>{billingName}</p>
      <p className="text-sm">{billingEmail}</p>
      <p className="text-sm">{billingPhone}</p>
      <p className="text-sm mt-2">{billingAddress}, {billingCity}</p>
    </div>

    {/* ===== PAYMENT (FIXED CLEAN) ===== */}
    <div className="border rounded-lg p-5 md:col-span-2">
      <h3 className="font-semibold mb-4">Payment Details</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">

        <div>
          <p className="text-gray-500">Payment Mode</p>
          <p className="font-medium">
            {paymentMethod === "razorpay"
              ? "Online (Razorpay)"
              : "Pay at Pickup"}
          </p>
        </div>

        {paymentMethod === "razorpay" && (
          <div>
            <p className="text-gray-500">Transaction ID</p>
            <p className="font-medium">{transactionId}</p>
          </div>
        )}

        {paymentMethod === "razorpay" ? (
          <div>
            <p className="text-gray-500">Amount Paid</p>
            <p className="text-green-600 font-medium">
              ₹{bookingData?.payment?.amount}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500">Amount Pending</p>
            <p className="text-orange-600 font-medium">
              ₹{pendingAmount}
            </p>
          </div>
        )}

      </div>

      {paymentMethod === "pickup" && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded mt-4 text-sm text-orange-600">
          You selected Pay at Pickup. Pay full amount at vehicle pickup.
        </div>
      )}
    </div>

  </div>

  {/* ===== BUTTONS ===== */}
  <div className="flex justify-center gap-4 no-print">
    <button
      onClick={downloadInvoice}
      className="bg-black text-white px-6 py-2 rounded"
    >
      Download Invoice
    </button>

    <button
      onClick={() => navigate("/listing")}
      className="bg-orange-500 text-white px-6 py-2 rounded"
    >
      Back to Listings
    </button>
  </div>

</div>
)}
          </div>

          {/* ================= RIGHT SIDE ================= */}
          {activeStep !== 5 && (
<div className="col-span-1 space-y-6 hidden lg:block">
            {/* BOOKING DETAILS DROPDOWN */}
            {activeStep >= 1 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
{/* HEADER */}
<div
  onClick={() => setOpenDetails(!openDetails)}
  className="flex justify-between items-center px-6 py-4 cursor-pointer border-b"
>
  <div className="flex items-center gap-2">
    <FileText size={18} className="text-orange-500" />
    <h3 className="font-semibold text-gray-800">
      Booking Details
    </h3>
  </div>

  <div
    className="text-gray-500 text-sm transition-transform duration-200"
    style={{
      transform: openDetails ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    ▼
  </div>
</div>

              {/* CONTENT */}
              {openDetails && (
                <div className="p-6">
                  <div className="flex gap-4 mb-6">
                    <img
                      src={vehicle.imageUrl || vehicle.images?.[0]}
                      alt={vehicle.name}
                      className="w-28 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-lg">{vehicle.name}</h4>
<div className="text-sm text-gray-500 space-y-1">
  <p>
   Location: {vehicle.mainLocation}
  </p>
</div>
                      <button
                        onClick={() => navigate(`/listing/${vehicle._id}`)}
                        className="text-sm text-blue-600 mt-2"
                      >
                        View Car Details
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-xl divide-y text-sm">
                    <div className="flex justify-between p-4">
                      <div>
                        <p className="font-medium">
                          Rental Charges ({planType})
                        </p>
                        <p className="text-red-500 text-xs">
                          (This does not include fuel)
                        </p>
                      </div>
                      <span>₹{basePrice}</span>
                    </div>

                    {deliveryType === "delivery" && (
                      <div className="flex justify-between p-4">
                        <span>Doorstep delivery</span>
                        <span>₹{deliveryCharge}</span>
                      </div>
                    )}

                    <div className="flex justify-between p-4">
                      <span>Tax (5%)</span>
                      <span>₹{taxAmount}</span>
                    </div>

                    <div className="flex justify-between p-4 text-orange-600">
                      <span>Refundable Deposit</span>
                      <span>₹{depositAmount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>)}


{/* ================= LOCATION & TIME SUMMARY ================= */}
{activeStep >= 2 && (
<div className="bg-white rounded-xl shadow-sm overflow-hidden">

  {/* HEADER (Dropdown + Edit) */}
  <div
    onClick={() => setOpenLocationTime(!openLocationTime)}
    className="flex justify-between items-center px-6 py-4 cursor-pointer border-b"
  >
    <div className="flex items-center gap-2">
      <CalendarDays size={18} className="text-orange-500" />
      <h3 className="font-semibold text-gray-800">
        Location & Time
      </h3>
    </div>

    <div className="flex items-center gap-4">
      <button
        onClick={(e) => {
          e.stopPropagation(); // prevent dropdown toggle
          setActiveStep(1);
        }}
        className="text-sm text-orange-500 hover:underline"
      >
        Edit
      </button>

      <div
        className="text-gray-500 text-sm transition-transform duration-200"
        style={{
          transform: openLocationTime ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        ▼
      </div>
    </div>
  </div>

  {/* CONTENT */}
  {openLocationTime && (
    <div className="p-6 space-y-5 text-sm">

      <div>
        <p className="text-gray-500">Rental Type</p>
        <p className="font-medium text-gray-800 capitalize">
          {deliveryType}
        </p>
      </div>

      <div>
        <p className="text-gray-500">Booking Type</p>
        <p className="font-medium text-gray-800 capitalize">
          {planType}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          {deliveryType === "delivery"
            ? "Delivery Location & Time"
            : "Pickup Location & Time"}
        </p>

        <p className="font-medium text-gray-800 break-words">
          {pickupLocation || "-"}
        </p>

        <p className="text-gray-600">
          {formatDateTime(pickupDate, pickupTime)}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          Return Location & Time
        </p>

        <p className="font-medium text-gray-800 break-words">
          {returnLocation || "-"}
        </p>

        <p className="text-gray-600">
          {formatDateTime(returnDate, returnTime)}
        </p>
      </div>

    </div>
  )}
</div>)}

{/* ================= EXTRA SERVICES SUMMARY ================= */}
{activeStep >= 3 && selectedExtras.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">

    {/* HEADER (Dropdown + Edit) */}
    <div
      onClick={() => setOpenExtraServices(!openExtraServices)}
      className="flex justify-between items-center px-6 py-4 cursor-pointer border-b"
    >
      <div className="flex items-center gap-2">
        <Puzzle size={18} className="text-orange-500" />
        <h3 className="font-semibold text-gray-800">
          Extra Services
        </h3>
      </div>

      <div className="flex items-center gap-4">

        {/* EDIT BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent dropdown toggle
            setActiveStep(2);     // go back to extras selection
          }}
          className="text-sm text-orange-500 hover:underline"
        >
          Edit
        </button>

        {/* DROPDOWN ARROW */}
        <div
          className="text-gray-500 text-sm transition-transform duration-200"
          style={{
            transform: openExtraServices
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        >
          ▼
        </div>
      </div>
    </div>

    {/* CONTENT */}
    {openExtraServices && (
      <div className="p-6 space-y-4 text-sm">

        {selectedExtras.map((extra) => {

const start = new Date(`${pickupDate}T${pickupTime}`);
const end = new Date(`${returnDate}T${returnTime}`);
          const diffDays = Math.ceil(
            (end - start) / (1000 * 60 * 60 * 24)
          );
          const days = diffDays <= 0 ? 1 : diffDays;

          const price =
            extra.type === "per_day"
              ? days * extra.price
              : extra.price;

          return (
            <div
              key={extra.key}
              className="flex justify-between border-b pb-2"
            >
              <span>{extra.title}</span>
              <span>
  {extra.type === "dynamic"
    ? "To be updated"
    : `₹${price}`}
</span>
            </div>
          );
        })}

        <div className="flex justify-between font-semibold pt-2">
          <span>Extra Services Charges</span>
          <span>₹{extraTotal}</span>
        </div>

      </div>
    )}
  </div>
)}


            {/* ================= TOTAL ================= */}
            <div className="bg-[#3f4754] text-white rounded-2xl px-8 py-6 flex justify-between items-center">
              <span className="text-xl font-medium">Estimated Total</span>
              <span className="text-3xl font-bold">₹{grandTotal}</span>
            {selectedExtras.some(e => e.type === "dynamic") && (
  <p className="text-xs text-orange-300 mt-1">
    * Toll charges will be added after trip
  </p>
)}
            </div>
          </div>
          )}
         
        </div>
      </div>
    </div>
  );
}

const InputField = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
    />
  </div>
);
