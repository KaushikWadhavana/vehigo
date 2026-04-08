import { useEffect, useState, useMemo  } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";

import axios from "axios";
import UserNavbar from "../../components/UserNavbar";
import Footer from "../../components/Footer";
import { getAuth } from "firebase/auth";
import LocationPicker from "../../components/LocationPicker";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation as SwiperNavigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import { Heart } from "lucide-react";



import {
  MapPin,
  Eye,
  CalendarDays,
  Star,
  Car,
  Navigation,
  Wifi,
  Baby,
  Fuel,
  Shield,
  Radio,
  Package,
  Clock,
  Usb,
  Receipt,
  Camera,
  Gauge,
  Settings,
  Calendar,
  Wind,
  Hash,
  DoorOpen,
  Disc,
  Cog,
  Bike,     // 👈 ADD THIS
  Users     // 👈 ADD THIS (you are using it too)
} from "lucide-react";


import {
  CheckCircle
} from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";

import Swal from "sweetalert2";
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentTimePlus15 = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};


export default function VehicleDetail() {
const { id } = useParams();
const locationHook = useLocation();

const [replyBox, setReplyBox] = useState(null);
const [replyMsg, setReplyMsg] = useState("");
const [openReplies, setOpenReplies] = useState(null);

const [replyLimit, setReplyLimit] = useState({});
  const [data, setData] = useState(null);
const [profile, setProfile] = useState(null);

  const [activeImg, setActiveImg] = useState(0);

// ===== BOOKING STATES =====
const today = new Date();
const todayDate = today.toISOString().split("T")[0];

// 🔥 CURRENT YEAR VALIDATION
const currentYear = new Date().getFullYear();

const isInvalidYear = (date) => {
  return new Date(date).getFullYear() !== currentYear;
};

// 🔥 END OF CURRENT YEAR (IMPORTANT)
const endOfYear = new Date(
  today.getFullYear(),
  11,
  31
).toISOString().split("T")[0];
const params = new URLSearchParams(locationHook.search);
const [minPickupTime, setMinPickupTime] = useState(() => getCurrentTimePlus15());
const urlPickupDate = params.get("pickupDate");
const urlPickupTime = params.get("pickupTime");
const urlReturnDate = params.get("returnDate");
const urlReturnTime = params.get("returnTime");
const hasURLReturnDate = !!urlReturnDate;
const [loadedFromURL, setLoadedFromURL] = useState(true);

const [pickupDate, setPickupDate] = useState(urlPickupDate || todayDate);
const [pickupTime, setPickupTime] = useState(
  urlPickupTime || getCurrentTimePlus15()
);

const [returnDate, setReturnDate] = useState(() => {

  if (urlReturnDate) return urlReturnDate;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().split("T")[0];

});

const [returnTime, setReturnTime] = useState(
  urlReturnTime || getCurrentTimePlus15()
);

const [deliveryType, setDeliveryType] = useState("delivery");

const [deliveryLocation, setDeliveryLocation] = useState("");
const [returnLocation, setReturnLocation] = useState("");
const [sameLocation, setSameLocation] = useState(true);
const [selectedPlan, setSelectedPlan] = useState("daily");


const [showEnquiry, setShowEnquiry] = useState(false);

const [enquiryForm, setEnquiryForm] = useState({
  name: "",
  email: "",
  phone: "",
  message: ""
});


useEffect(() => {

  if (pickupDate === todayDate) {

    const newTime = getCurrentTimePlus15();

    setMinPickupTime(newTime);

    if (!pickupTime || pickupTime < newTime) {
      setPickupTime(newTime);
      setReturnTime(newTime);
    }

  } else {

    setMinPickupTime("00:00");

  }

}, [pickupDate]);
useEffect(() => {

  if (pickupDate && isInvalidYear(pickupDate)) {

    Swal.fire({
      icon: "error",
      title: "Invalid Date",
      text: "Pickup date must be within current year only",
    });

    setPickupDate(todayDate); // 🔥 RESET

  }

}, [pickupDate]);
useEffect(() => {
  if (profile) {
    setEnquiryForm({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      message: ""
    });
  }
}, [profile]);

const [randomListings, setRandomListings] = useState([]);

const [openFAQ, setOpenFAQ] = useState(null);

const [reviewForm, setReviewForm] = useState({
  fullName: "",
  email: "",
  service: 0,
  location: 0,
  value: 0,
  facilities: 0,
  cleanliness: 0,
  comment: "",
});

const navigate = useNavigate();
const handlePickupDateChange = (date) => {
if (isInvalidYear(date)) {
  Swal.fire(
    "Invalid Date",
    "Only current year is allowed",
    "warning"
  );
  return;
}
  setPickupDate(date);

  if (date === todayDate) {

    const newTime = getCurrentTimePlus15();

    setMinPickupTime(newTime);
    setPickupTime(newTime);

  } else {

    setMinPickupTime("00:00");

  }

  // 🔹 AUTO UPDATE RETURN DATE BASED ON PLAN
  const start = new Date(`${date}T${pickupTime}`);
  const newReturn = new Date(start);

  if (selectedPlan === "daily") {
    newReturn.setDate(start.getDate() + 1);
  }

  if (selectedPlan === "weekly") {
    newReturn.setDate(start.getDate() + 7);
  }

  if (selectedPlan === "monthly") {
    newReturn.setMonth(start.getMonth() + 1);
  }

  if (selectedPlan === "yearly") {
    newReturn.setFullYear(start.getFullYear() + 1);
  }

  setReturnDate(formatLocalDate(newReturn));
  setReturnTime(newReturn.toTimeString().slice(0,5));

};

const handleReturnDateChange = (date) => {

  const start = new Date(`${pickupDate}T${pickupTime}`);
  const end = new Date(`${date}T${returnTime}`);

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return;

  if (diffDays > 365) {
    Swal.fire(
      "Invalid Booking",
      "Maximum booking allowed is 1 year",
      "warning"
    );
    return;
  }

  setReturnDate(date);

  /* ================= AUTO PLAN DETECT ================= */

  if (diffDays === 1) {
    setSelectedPlan("daily");
  }
  else if (diffDays === 7) {
    setSelectedPlan("weekly");
  }
  else if (diffDays === 30) {
    setSelectedPlan("monthly");
  }
  else if (diffDays === 365) {
    setSelectedPlan("yearly");
  }

};

useEffect(() => {

  if (!data?.pricing) return;

  if (data.pricing.dailyPrice) {
    setSelectedPlan("daily");
  }
  else if (data.pricing.weeklyPrice) {
    setSelectedPlan("weekly");
  }
  else if (data.pricing.monthlyPrice) {
    setSelectedPlan("monthly");
  }
  else if (data.pricing.yearlyPrice) {
    setSelectedPlan("yearly");
  }

}, [data]);
useEffect(() => {
  const fetchRandom = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/listing/random?excludeId=${id}`
      );

      const result = await res.json();

      setRandomListings(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Random fetch error:", err);
      setRandomListings([]);
    }
  };

  fetchRandom();
}, [id]);


useEffect(() => {
  const fetchDetail = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/vehicle-detail/${id}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Vehicle Detail Error:", err.response?.data || err.message);
    }
  };

  fetchDetail();
}, [id]);

useEffect(() => {
  const fetchProfile = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    try {
      const token = await user.getIdToken();

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(res.data);

      setReviewForm((prev) => ({
        ...prev,
        fullName: res.data.name,
        email: res.data.email,
      }));

    } catch (err) {
      console.log("Profile fetch error:", err.response?.data || err.message);
    }
  };

  fetchProfile();
}, []);

const randomReviews = useMemo(() => {
  if (!data?.reviews) return [];

  return [...data.reviews]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
}, [data?.reviews]);



  if (!data) return <div className="p-10 text-center">Loading...</div>;
/* ================= FORMAT BOOKED SLOTS ================= */

const bookedRanges = data.bookedSlots?.map((slot) => {
const formatDate = (date) => {
  const d = new Date(date);

  return `${d.getDate().toString().padStart(2,"0")} ${
    d.toLocaleString("en-IN",{month:"short"})
  } ${d.getFullYear()}`;
};
  const start = `${formatDate(slot.pickupDate)}, ${slot.pickupTime}`;
  const end = `${formatDate(slot.returnDate)}, ${slot.returnTime}`;

  return `${start} → ${end}`;
});
/* ================= RESERVED SLOTS ================= */
const reservedRanges = data.reservedSlots?.map((slot) => {

  const formatDate = (date) => {
    const d = new Date(date);

    return `${d.getDate().toString().padStart(2,"0")} ${
      d.toLocaleString("en-IN",{month:"short"})
    } ${d.getFullYear()}`;
  };

  const start = `${formatDate(slot.startDate)}, ${slot.startTime || ""}`;
  const end = `${formatDate(slot.endDate)}, ${slot.endTime || ""}`;

  return `${start} → ${end}`;
});

  const images = data.gallery?.length
    ? data.gallery
    : [data.imageUrl];

  const pricing = data.pricing || {};

  /* ================= ADD REVIEW ================= */
const submitReview = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    Swal.fire("Login Required", "Please login first", "warning");
    return;
  }
const comment = reviewForm.comment?.trim();

if (!comment || comment.length < 5) {
  Swal.fire("Too short", "Minimum 5 characters required", "warning");
  return;
}

if (comment.length > 250) {
  Swal.fire("Too long", "Maximum 250 characters allowed", "warning");
  return;
}
  try {
    Swal.fire({
      title: "Submitting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/vehicle-detail/review`,
      {
        vehicleId: id,
        vehicleType: data.type,
        fullName: profile?.name,
        email: profile?.email,

        // ✅ FIXED
        userId: user.uid,
        profileImage: profile?.profileImage,
        ownerId: data.owner?._id,
        addedBy: data.addedBy,

        service: reviewForm.service,
        location: reviewForm.location,
        value: reviewForm.value,
        facilities: reviewForm.facilities,
        cleanliness: reviewForm.cleanliness,
        comment: reviewForm.comment,
      }
    );

    Swal.close();

Swal.fire({
  icon: "success",
  title: "Review Submitted!",
  timer: 1500,
  showConfirmButton: false,
});

// ✅ ADD THIS
setData((prev) => {
  const updatedReviews = [res.data, ...(prev.reviews || [])];

  const total = updatedReviews.length;

  const avg =
    updatedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;

  return {
    ...prev,
    reviews: updatedReviews,
    totalReviews: total,
    avgRating: avg,
  };
});

// ✅ RESET FORM
setReviewForm({
  service: 0,
  location: 0,
  value: 0,
  facilities: 0,
  cleanliness: 0,
  comment: "",
});

  } catch (error) {
    console.log(error.response?.data || error.message); // 🔥 ADD THIS FOR DEBUG
    Swal.close();
    Swal.fire("Submission Failed", "Please try again", "error");
  }
};


const handlePlanChange = (plan) => {

  setSelectedPlan(plan);

  const start = new Date(`${pickupDate}T${pickupTime}`);
  const newReturn = new Date(start);

  if (plan === "daily") newReturn.setDate(start.getDate() + 1);
  if (plan === "weekly") newReturn.setDate(start.getDate() + 7);
  if (plan === "monthly") newReturn.setMonth(start.getMonth() + 1);
  if (plan === "yearly") newReturn.setFullYear(start.getFullYear() + 1);

  setReturnDate(formatLocalDate(newReturn));
  setReturnTime(newReturn.toTimeString().slice(0,5));
};

const submitEnquiry = async () => {

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    Swal.fire("Login Required", "Please login first", "warning");
    return;
  }

  const { name, email, phone, message } = {
    name: enquiryForm.name.trim(),
    email: enquiryForm.email.trim(),
    phone: enquiryForm.phone.trim(),
    message: enquiryForm.message.trim()
  };

  if (!name || !email || !phone || !message) {
    Swal.fire("All fields required", "", "warning");
    return;
  }

  if (message.length < 5) {
    Swal.fire("Too short", "Message must be at least 5 characters", "warning");
    return;
  }

  if (message.length > 250) {
    Swal.fire("Message too long", "Max 250 characters allowed", "warning");
    return;
  }

  try {
    const token = await user.getIdToken();

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/enquiry/create`,
      {
        listingId: data._id,
        listingType: data.type,
        name,
        email,
        phone,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    Swal.fire({
      icon: "success",
      title: "Enquiry Sent!",
      timer: 1500,
      showConfirmButton: false
    });

    setShowEnquiry(false);

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to send enquiry", "error");
  }
};

const submitReply = async (reviewId) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!replyMsg || replyMsg.trim().length < 2) {
      Swal.fire("Too short", "Reply must be at least 2 characters", "warning");
      return;
    }

    if (replyMsg.length > 250) {
      Swal.fire("Too long", "Max 250 characters allowed", "warning");
      return;
    }

    const token = await user.getIdToken();

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/vehicle-detail/reply`,
      {
        reviewId,
        message: replyMsg,
        userId: user.uid,
        name: profile?.name,
        email: profile?.email,
        profileImage: profile?.profileImage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Swal.fire("Success", "Reply added", "success");

    // ✅ UPDATE UI WITHOUT REFRESH
    setData((prev) => {
      const updatedReviews = prev.reviews.map((rev) => {
        if (rev._id === reviewId) {
          return {
            ...rev,
            replies: [
              ...(rev.replies || []),
              {
                userId: user.uid,
                name: profile?.name,
                email: profile?.email,
                profileImage: profile?.profileImage,
                message: replyMsg,
                createdAt: new Date(),
              },
            ],
          };
        }
        return rev;
      });

      return {
        ...prev,
        reviews: updatedReviews,
      };
    });

    setReplyMsg("");
    setReplyBox(null);

  } catch (err) {
    Swal.fire("Error", "Reply failed", "error");
  }
};
  return (
    <>

{/* ================= HERO SECTION ================= */}
<section className="bg-gradient-to-r from-black via-[#1c1c1c] to-black py-16 text-white relative overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 text-center">

    <h2 className="text-3xl md:text-4xl font-bold tracking-wide">
      {data.name}
    </h2>

<p className="mt-4 text-sm text-gray-300">

  <Link
    to="/"
    className="hover:text-orange-400 transition"
  >
    Home
  </Link>

  <span className="mx-2 text-gray-500">/</span>

  <Link
    to="/listing"
    className="hover:text-orange-400 transition"
  >
    Listings
  </Link>

  <span className="mx-2 text-gray-500">/</span>

  <span className="text-orange-400 font-medium">
    {data.name}
  </span>

</p>



  </div>
</section>

{/* ================= VEHICLE INFO HEADER ================= */}
<section className="bg-[#f4f5f7] border-b py-8">
  <div className="max-w-7xl mx-auto px-4">

    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">

      {/* LEFT SIDE */}
      <div className="space-y-4">

        {/* CATEGORY + YEAR + RATING */}
        <div className="flex items-center gap-4 text-sm">

          {/* Category */}
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <Car size={14} className="text-white" />
            </div>
            <span className="font-medium">
              {data.category}
            </span>
          </div>

          {/* Year Badge */}
          <span className="px-3 py-1 bg-teal-600 text-white text-xs rounded-md font-semibold">
            {data.year}
          </span>

          {/* Rating */}
       <div className="flex items-center gap-1 text-orange-500">
  {[1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      size={14}
      fill={
        star <= Math.round(data.avgRating)
          ? "currentColor"
          : "none"
      }
      stroke="currentColor"
    />
  ))}
  <span className="text-gray-600 ml-2 font-medium">
    ({data.avgRating?.toFixed(1) || "0.0"})
  </span>
</div>


        </div>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {data.name}
        </h1>

        {/* META INFO */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">

          <div className="flex items-center gap-2">
            <MapPin size={15} />
            <span>{data.mainLocation}</span>
          </div>


          <div className="flex items-center gap-2">
            <CalendarDays size={15} />
            <span>
              Listed on :{" "}
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>

        </div>

      </div>

{/* BOOKING INFO CENTER + RIGHT */}
<div className="flex flex-col lg:flex-row items-center gap-6">

  {/* LEFT RESERVED */}
  <div className="bg-white border rounded-lg px-6 py-3 shadow-sm text-sm text-gray-700">

    <div className="flex items-center gap-2 mb-1">
      <CalendarDays size={16} className="text-red-500" />
      <span className="font-semibold">Reserved Slots</span>
    </div>

    {!reservedRanges || reservedRanges.length === 0 ? (
      <p className="text-gray-400 text-xs">
        No reservations
      </p>
    ) : (
      <>
        <div className="text-xs space-y-1 max-h-[120px] overflow-y-auto pr-1">
          {reservedRanges.slice(0, 50).map((range, i) => (
            <div key={i}>• {range}</div>
          ))}
        </div>

        {reservedRanges.length > 5 && (
          <p className="text-[10px] text-gray-400 mt-1">
            Showing {Math.min(50, reservedRanges.length)} of {reservedRanges.length}
          </p>
        )}
      </>
    )}

  </div>

  {/* CENTER BOOKED */}
  <div className="bg-white border rounded-lg px-6 py-3 shadow-sm text-sm text-gray-700">

    <div className="flex items-center gap-2 mb-1">
      <CalendarDays size={16} className="text-[#2f6f75]" />
      <span className="font-semibold">Booked Slots</span>
    </div>

    {!bookedRanges || bookedRanges.length === 0 ? (
      <p className="text-gray-400 text-xs">
        No bookings yet
      </p>
    ) : (
      <>
        <div className="text-xs space-y-1 max-h-[120px] overflow-y-auto pr-1">
          {bookedRanges.slice(0, 50).map((range, i) => (
            <div key={i}>• {range}</div>
          ))}
        </div>

        {bookedRanges.length > 5 && (
          <p className="text-[10px] text-gray-400 mt-1">
            Showing {Math.min(50, bookedRanges.length)} of {bookedRanges.length}
          </p>
        )}
      </>
    )}

  </div>

  {/* RIGHT COUNT */}
  <div className="flex items-center gap-2 px-6 py-3 bg-[#2f6f75] text-white rounded-lg text-sm font-semibold shadow">
    <CalendarDays size={16} />
    Total Booking : {data.bookingCount || 0}
  </div>

</div>


    </div>

  </div>
</section>

{/* ================= MAIN CONTENT ================= */}
<div className="bg-[#f6f7f9] py-12">
  <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-[2fr_1fr] gap-8">

    {/* ================= LEFT SIDE ================= */}
    <div className="space-y-6">

     

  {/* ================= SINGLE IMAGE ONLY ================= */}
<div className="bg-white p-4 rounded-2xl shadow-sm">

  <img
    src={data.imageUrl}
    alt={data.name}
    className="w-full h-[500px] object-cover rounded-xl"
  />

</div>

{/* ================= EXTRA SERVICE ================= */}
{data.extras?.length > 0 && (
  <div className="bg-white rounded-2xl shadow-sm p-6">

    <div className="mb-6 border-b pb-3 relative">
      <h3 className="text-lg font-semibold text-gray-800">
        Extra Service
      </h3>
      <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

      {data.extras.map((extra, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 rounded-xl border"
        >
          <div className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border text-teal-600">
            {getServiceIcon(extra.title)}
          </div>

          <span className="text-sm font-medium text-gray-700">
            {extra.title}
          </span>
        </div>
      ))}

    </div>

  </div>
)}
{/* ================= SPECIFICATIONS ================= */}
<div className="bg-white rounded-2xl shadow-sm p-6">

  <div className="mb-6 border-b pb-3 relative">
    <h3 className="text-lg font-semibold text-gray-800">
      Specifications
    </h3>
    <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

    {/* Body */}
    {data.category && (
      <SpecCard icon={<Car size={20} />} label="Body" value={data.category} />
    )}

    {/* Brand */}
    {data.brand && (
      <SpecCard icon={<Package size={20} />} label="Make" value={data.brand} />
    )}

    {/* Transmission */}
    {data.transmission && (
      <SpecCard icon={<Settings size={20} />} label="Transmission" value={data.transmission} />
    )}

    {/* Fuel */}
    {data.fuel && (
      <SpecCard icon={<Fuel size={20} />} label="Fuel Type" value={data.fuel} />
    )}

    {/* Mileage */}
    {data.mileage && (
      <SpecCard icon={<Gauge size={20} />} label="Mileage" value={`${data.mileage} Km`} />
    )}

    {/* Drivetrain (if exists) */}
    {data.drivetrain && (
      <SpecCard icon={<Navigation size={20} />} label="Drivetrain" value={data.drivetrain} />
    )}

    {/* Year */}
    {data.year && (
      <SpecCard icon={<Calendar size={20} />} label="Year" value={data.year} />
    )}

    {/* AC */}
    {data.ac && (
      <SpecCard icon={<Wind size={20} />} label="AC" value="Air Condition" />
    )}

    {/* VIN */}
    {data.vin && (
      <SpecCard icon={<Hash size={20} />} label="VIN" value={data.vin} />
    )}

    {/* Doors */}
    {data.doors && (
      <SpecCard icon={<DoorOpen size={20} />} label="Door" value={`${data.doors} Doors`} />
    )}

    {/* Brake */}
    {data.brake && (
      <SpecCard icon={<Disc size={20} />} label="Brake" value={data.brake} />
    )}

    {/* Engine HP */}
    {data.engine && (
      <SpecCard icon={<Gauge size={20} />} label="Engine (Hp)" value={data.engine} />
    )}

  </div>
</div>
{/* ================= CAR FEATURES ================= */}
{data.features?.length > 0 && (
  <div className="bg-white rounded-2xl shadow-sm p-6">

    <div className="mb-6 border-b pb-3 relative">
      <h3 className="text-lg font-semibold text-gray-800">
        Car Features
      </h3>
      <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-10">

      {data.features.map((feature, index) => (
        <div key={index} className="flex items-center gap-3">

          <CheckCircle
            size={18}
            className="text-teal-600"
          />

          <span className="text-sm text-gray-700">
            {feature}
          </span>

        </div>
      ))}

    </div>

  </div>
)}
{/* ================= FAQ SECTION ================= */}
{data.faqs?.length > 0 && (
  <div className="bg-white rounded-2xl shadow-sm p-6">

    <div className="mb-6 border-b pb-3 relative">
      <h3 className="text-lg font-semibold text-gray-800">
        FAQ’s
      </h3>
      <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
    </div>

    <div className="space-y-4">

      {data.faqs.map((faq, index) => {
        const isOpen = openFAQ === index;

        return (
          <div
            key={index}
            className="border rounded-xl bg-gray-50"
          >
            {/* Question */}
            <button
              onClick={() =>
                setOpenFAQ(isOpen ? null : index)
              }
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <span className="font-medium text-gray-800">
                {faq.question}
              </span>

              <div className="text-orange-500">
                {isOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </div>
            </button>

            {/* Answer */}
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}

    </div>

  </div>
)}

{/* ================= REVIEWS SECTION ================= */}
<div className="bg-white rounded-2xl shadow-sm p-8 mt-10">

  {/* HEADER */}
  <div className="mb-8 border-b pb-4 relative">
    <h3 className="text-xl font-semibold">Reviews</h3>
    <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
  </div>

  {/* ================= RATING SUMMARY ================= */}
  <div className="grid md:grid-cols-[250px_1fr] gap-8 mb-10">

    {/* LEFT BOX */}
    <div className="border rounded-xl p-6 text-center bg-gray-50">
      <h2 className="text-4xl font-bold text-teal-600">
        {data.avgRating || 0}
        <span className="text-lg text-gray-500"> /5</span>
      </h2>

      <div className="flex justify-center mt-3 text-orange-500">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            fill={
              i < Math.round(data.avgRating)
                ? "currentColor"
                : "none"
            }
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Based on {data.totalReviews} Reviews
      </p>
    </div>

    {/* RIGHT BARS */}
    <div className="space-y-4">

      {["service", "location", "value", "facilities", "cleanliness"].map((key) => {

        const avg =
          data.reviews.length > 0
            ? (
                data.reviews.reduce((sum, r) => sum + (r[key] || 0), 0) /
                data.reviews.length
              ).toFixed(1)
            : 0;

        return (
          <div key={key} className="flex items-center gap-4">
            <span className="w-32 capitalize text-sm text-gray-600">
              {key}
            </span>

            <div className="flex-1 bg-gray-200 h-2 rounded-full">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${(avg / 5) * 100}%` }}
              />
            </div>

            <span className="text-sm text-gray-600 w-10">
              {avg}
            </span>
          </div>
        );
      })}

    </div>
  </div>

  {/* ================= REVIEW LIST ================= */}
 <div className="space-y-8">

  {data.totalReviews > 0 && (
    <p className="text-sm text-gray-500 mb-6">
      Showing {randomReviews.length} of {data.totalReviews} reviews
    </p>
  )}

  {randomReviews.length === 0 && (
    <p className="text-gray-500 text-sm">
      No reviews yet. Be the first to review!
    </p>
  )}

{randomReviews.map((r) => (
  <div
    key={r._id}
    onClick={() =>
      r.replies?.length > 0 &&
      setOpenReplies(openReplies === r._id ? null : r._id)
    }
className="border-b pb-6 cursor-pointer"
  >

    <div className="flex justify-between items-start mb-3">

      {/* LEFT USER INFO */}
      <div className="flex items-center gap-4">

        <img
          src={
            r.email === profile?.email
              ? profile?.profileImage || "/default-avatar.png"
              : `https://i.pravatar.cc/100?u=${r._id}`
          }
          className="w-12 h-12 rounded-full object-cover"
          alt="avatar"
        />

        <div>
          <h4 className="font-semibold">{r.fullName}</h4>
          <p className="text-xs text-gray-500">
            Reviewed {new Date(r.createdAt).toDateString()}
          </p>
        </div>

      </div>

      {/* STAR RATING */}
      <div className="flex items-center gap-1 text-orange-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={
              star <= Math.round(r.rating)
                ? "currentColor"
                : "none"
            }
            stroke="currentColor"
          />
        ))}

        <span className="text-gray-600 text-sm ml-1">
          ({r.rating})
        </span>
      </div>

    </div>

    {/* COMMENT */}
    <p className="text-gray-600 text-sm leading-relaxed">
      {r.comment}
    </p>

    {/* ✅ REPLY BUTTON (STOP CLICK PROPAGATION) */}
    <div className="flex justify-end mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation(); // 🔥 VERY IMPORTANT
          setReplyBox(r._id);
        }}
        className="text-blue-600 text-sm hover:underline"
      >
        Reply
      </button>
    </div>

    {/* ✅ REPLY INPUT BOX */}
    {replyBox === r._id && (
      <div
        className="mt-3 border p-3 rounded-lg bg-gray-50"
        onClick={(e) => e.stopPropagation()} // 🔥 prevent toggle
      >

        <div className="flex items-center gap-2 mb-2">
          <img
            src={profile?.profileImage || "/default-avatar.png"}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium">
            {profile?.name}
          </span>
        </div>

        <textarea
        maxLength={250}
          value={replyMsg}
          onChange={(e) => setReplyMsg(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Write reply..."
        />
<p className="text-right text-xs text-gray-500">
  {replyMsg.length}/250
</p>

        <button
          onClick={() => submitReply(r._id)}
          className="mt-2 bg-teal-600 text-white px-4 py-2 rounded"
        >
          Submit
        </button>

      </div>
    )}

    {/* ✅ SHOW REPLIES */}
{openReplies === r._id && r.replies?.length > 0 && (

  <div className="mt-4 ml-10">

    {/* 🔥 HEADER TEXT */}
    <p className="text-xs text-gray-500 mb-2">
      Showing {Math.min(replyLimit[r._id] || 3, r.replies.length)} of {r.replies.length} replies
    </p>

    {/* 🔥 SCROLL BOX */}
    <div className="max-h-[260px] overflow-y-auto pr-2 space-y-3">

      {r.replies
        .slice(0, replyLimit[r._id] || 3)
        .map((rep, i) => (

          <div
            key={i}
            className="flex items-start gap-3 bg-gray-50 border rounded-2xl px-4 py-3"
          >

            {/* IMAGE */}
            <img
              src={rep.profileImage || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* CONTENT */}
            <div className="flex-1">

              {/* NAME + DATE */}
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-800">
                  {rep.name}
                </p>

                <span className="text-xs text-gray-400">
                  {new Date(rep.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* MESSAGE */}
              <p className="text-sm text-gray-600 mt-1">
                {rep.message}
              </p>

            </div>

          </div>
      ))}

    </div>

    {/* 🔥 VIEW MORE BUTTON */}
    {(replyLimit[r._id] || 3) < r.replies.length && (

      <button
        onClick={(e) => {
          e.stopPropagation();

          setReplyLimit((prev) => ({
            ...prev,
            [r._id]: (prev[r._id] || 3) + 5,
          }));
        }}
        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
      >
        View more replies
      </button>

    )}

  </div>
)}

  </div>
))}
  </div>

</div>


{/* ================= LEAVE REVIEW ================= */}
<div className="bg-white rounded-2xl shadow-sm p-8 mt-10">

  <h3 className="text-xl font-semibold mb-6 border-b pb-3 relative">
    Leave A Reply
    <span className="absolute bottom-0 left-0 w-8 h-1 bg-orange-500 rounded"></span>
  </h3>

  <div className="grid md:grid-cols-2 gap-8">

    <StarRating
      label="Service"
      value={reviewForm.service}
      onChange={(v) =>
        setReviewForm({ ...reviewForm, service: v })
      }
    />

    <StarRating
      label="Location"
      value={reviewForm.location}
      onChange={(v) =>
        setReviewForm({ ...reviewForm, location: v })
      }
    />

    <StarRating
      label="Value For Money"
      value={reviewForm.value}
      onChange={(v) =>
        setReviewForm({ ...reviewForm, value: v })
      }
    />

    <StarRating
      label="Facilities"
      value={reviewForm.facilities}
      onChange={(v) =>
        setReviewForm({ ...reviewForm, facilities: v })
      }
    />

    <StarRating
      label="Cleanliness"
      value={reviewForm.cleanliness}
      onChange={(v) =>
        setReviewForm({ ...reviewForm, cleanliness: v })
      }
    />

  </div>

<div className="grid md:grid-cols-2 gap-4 mt-6">

  <input
    value={reviewForm.fullName}
    className="border rounded-lg p-3 bg-gray-100"
    readOnly
  />

  <input
    value={reviewForm.email}
    className="border rounded-lg p-3 bg-gray-100"
    readOnly
  />

</div>

  <textarea
  maxLength={250}   // ✅ LIMIT
    placeholder="Comments *"
    className="w-full border rounded-lg p-3 mt-4 h-32"
    value={reviewForm.comment}
    onChange={(e) =>
      setReviewForm({ ...reviewForm, comment: e.target.value })
    }
  />
  <p className="text-right text-xs text-gray-500">
  {reviewForm.comment.length}/250
</p>

  <button
    onClick={submitReview}
    className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
  >
    Submit Review
  </button>

</div>




    </div>


{/* ================= RIGHT SIDE ================= */}
<div className="space-y-8 sticky top-24 h-fit">

{/* ================= PRICING CARD ================= */}
<div className="bg-white rounded-3xl shadow-sm p-6">
  {/* ================= TITLE ================= */}
  <h3 className="text-xl font-semibold mb-6 relative">
    Pricing
    <span className="absolute -bottom-2 left-0 w-8 h-1 bg-orange-500 rounded"></span>
  </h3>

  {/* ================= PRICE OPTIONS ================= */}
  <div className="space-y-4">

    {[
      { key: "daily", label: "Daily", value: data.pricing?.dailyPrice },
      { key: "weekly", label: "Weekly", value: data.pricing?.weeklyPrice },
      { key: "monthly", label: "Monthly", value: data.pricing?.monthlyPrice },
      { key: "yearly", label: "Yearly", value: data.pricing?.yearlyPrice },
    ].map((plan) =>
      plan.value > 0 ? (
        <div
          key={plan.key}
          onClick={() => handlePlanChange(plan.key)}
          className={`flex justify-between items-center px-5 py-4 rounded-2xl cursor-pointer transition
            ${
              selectedPlan === plan.key
                ? "bg-gray-200 border border-blue-600"
                : "bg-gray-100"
            }
          `}
        >
          <span className="flex items-center gap-3 text-gray-700 font-medium">

            {/* Radio Circle */}
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${
                  selectedPlan === plan.key
                    ? "border-blue-600"
                    : "border-gray-400"
                }
              `}
            >
              {selectedPlan === plan.key && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </span>

            {plan.label}
          </span>

          <span className="font-semibold text-lg text-gray-800">
            ₹{plan.value}
          </span>
        </div>
      ) : null
    )}

  </div>

  {/* ================= DELIVERY TOGGLE ================= */}
 {/* DELIVERY TYPE */}
<div className="grid grid-cols-2 gap-4 mt-6">

  <button
    onClick={() => setDeliveryType("delivery")}
    className={`py-3 rounded-lg font-medium border transition ${
      deliveryType === "delivery"
        ? "border-teal-600 bg-teal-50 text-teal-700"
        : "bg-gray-50"
    }`}
  >
    Delivery
  </button>

  <button
    onClick={() => setDeliveryType("pickup")}
    className={`py-3 rounded-lg font-medium border transition ${
      deliveryType === "pickup"
        ? "border-teal-600 bg-teal-50 text-teal-700"
        : "bg-gray-50"
    }`}
  >
    Self Pickup
  </button>

</div>

  {/* ================= LOCATION SECTION ================= */}
 {/* LOCATION SECTION */}
{deliveryType === "delivery" && (
  <div className="mt-6 space-y-4">

    <label className="block font-medium">
      Delivery Location
    </label>

    <LocationPicker
      onSelect={(location) =>
        setDeliveryLocation(location.address)
      }
    />

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={sameLocation}
        onChange={() => setSameLocation(!sameLocation)}
      />
      <span className="text-sm">Return to same location</span>
    </div>

    {!sameLocation && (
      <>
        <label className="block font-medium">
          Return Location
        </label>

        <LocationPicker
          onSelect={(location) =>
            setReturnLocation(location.address)
          }
        />
      </>
    )}

  </div>
)}


  {/* ================= DATE SECTION ================= */}
  <div className="mt-6 space-y-4 text-sm">

 {/* PICKUP */}
<div className="mt-6">
  <label className="block mb-2 font-medium">
    Pickup Date
  </label>

  <div className="grid grid-cols-2 gap-3">
<input
  type="date"
  min={todayDate}
  max={endOfYear}   // 🔥 ADD THIS LINE
  value={pickupDate}
  onChange={(e) =>
    handlePickupDateChange(e.target.value)
  }
  className="bg-gray-100 rounded-lg px-4 py-3 outline-none"
/>

    <input
      type="time"
      value={pickupTime}
min={
  pickupDate === todayDate
    ? minPickupTime
    : "00:00"
}
      onChange={(e) =>
        setPickupTime(e.target.value)
      }
      className="bg-gray-100 rounded-lg px-4 py-3 outline-none"
    />

  </div>
</div>

{/* RETURN */}
<div className="mt-4">
  <label className="block mb-2 font-medium">
    Return Date
  </label>

  <div className="grid grid-cols-2 gap-3">

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
  value={returnDate}
  onChange={(e) =>
    handleReturnDateChange(e.target.value)
  }
   className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3d6f73]"
/>

    <input
      type="time"
      value={returnTime}
      onChange={(e) =>
        setReturnTime(e.target.value)
      }
      className="bg-gray-100 rounded-lg px-4 py-3 outline-none"
    />

  </div>
</div>




  </div>

  {/* ================= ACTION BUTTONS ================= */}
<button
  onClick={async () => {

  /* ================= VALIDATION ================= */

  // 🔥 BLOCK WRONG YEAR
if (isInvalidYear(pickupDate)) {
  Swal.fire(
    "Invalid Booking",
    "You can only select dates from current year",
    "error"
  );
  return;
}

  if (!pickupDate || !returnDate) {
    Swal.fire(
      "Missing Dates",
      "Please select pickup and return dates",
      "warning"
    );
    return;
  }

const toLocalDate = (date, time) => {
  return new Date(`${date}T${time}`);
};

const start = toLocalDate(pickupDate, pickupTime);
const end = toLocalDate(returnDate, returnTime);

  if (end <= start) {
    Swal.fire(
      "Invalid Selection",
      "Return date & time must be after pickup",
      "warning"
    );
    return;
  }

  if (deliveryType === "delivery" && !deliveryLocation) {
    Swal.fire(
      "Location Required",
      "Please select delivery location",
      "warning"
    );
    return;
  }

  const diffMs = end - start;

  if (diffMs < 60 * 60 * 1000) {
    Swal.fire(
      "Invalid Booking",
      "Minimum booking duration is 1 hour",
      "warning"
    );
    return;
  }

  /* ================= SLOT AVAILABILITY CHECK ================= */

let conflictType = null;

// 🔴 CHECK BOOKED
if (data.bookedSlots?.length > 0) {

  const bookedOverlap = data.bookedSlots.find((slot) => {

    const bookedStart = new Date(`${slot.pickupDate}T${slot.pickupTime}`);
    const bookedEnd = new Date(`${slot.returnDate}T${slot.returnTime}`);

    return start < bookedEnd && end > bookedStart;
  });

  if (bookedOverlap) {
    conflictType = "booked";
  }
}

// 🔴 CHECK RESERVED
if (!conflictType && data.reservedSlots?.length > 0) {

  const reservedOverlap = data.reservedSlots.find((slot) => {

    const reservedStart = new Date(`${slot.startDate}T${slot.startTime || "00:00"}`);
    const reservedEnd = new Date(`${slot.endDate}T${slot.endTime || "23:59"}`);

    return start < reservedEnd && end > reservedStart;
  });

  if (reservedOverlap) {
    conflictType = "reserved";
  }
}

// 🔴 SHOW ALERT
if (conflictType) {

  Swal.fire({
    icon: "error",
    title: conflictType === "booked"
      ? "Already Booked"
      : "Reserved",
    text:
      conflictType === "booked"
        ? "This vehicle is already booked for the selected time."
        : "This vehicle is reserved for the selected time.",
    confirmButtonColor: "#e6a24a"
  });

  return;
}

/* ================= BACKEND FINAL CHECK ================= */

try {

  Swal.fire({
    title: "Checking availability...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/vehicle-detail/check-availability`,
    {
      listingId: id,
      pickupDate: start,
      returnDate: end
    }
  );

  Swal.close();

  if (!res.data.available) {

    Swal.fire({
      icon: "error",
      title: "Vehicle Not Available",
      text: res.data.message || "Already booked or reserved"
    });

    return;
  }

} catch (err) {

  Swal.close();

  Swal.fire(
    "Error",
    "Could not verify vehicle availability",
    "error"
  );

  return;
}
  /* ================= NAVIGATE ================= */

  navigate(`/checkout/${id}`, {
    state: {
      vehicleData: data,
      bookingData: {
        selectedPlan,
        deliveryType,
        deliveryLocation,
        returnLocation,
        sameLocation,
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
      },
    },
  });

}}

  className="w-full mt-6 bg-[#e6a24a] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
>
  Book
</button>

<button
  onClick={() => setShowEnquiry(true)}
  className="w-full mt-4 bg-[#2f6f75] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
>
  Enquire Us
</button>
</div>


{/* ================= OWNER DETAILS ================= */}
<div className="bg-white rounded-3xl shadow-sm p-6 mt-8">

  <h3 className="text-xl font-semibold mb-6 relative">
    Listing Owner Details
    <span className="absolute -bottom-2 left-0 w-8 h-1 bg-orange-500 rounded"></span>
  </h3>

  {/* OWNER TOP CARD */}
  <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-4">

    <img
src={
  data.owner?.profileImage ||
  data.owner?.googlePhoto ||
  "https://i.pravatar.cc/100"
}
      className="w-16 h-16 rounded-full object-cover"
      alt="owner"
    />

    <div className="flex-1">
      <h4 className="font-semibold text-lg">
        {data.owner?.name}
      </h4>

   
    </div>
  </div>
{/* EMAIL */}
<div className="mt-6 border-b pb-4 flex justify-between items-start text-sm">
  <span className="text-gray-500">Email</span>
  <span className="text-gray-800 font-medium text-right max-w-[65%] break-words">
    {data.owner?.email}
  </span>
</div>

{/* PHONE */}
<div className="mt-4 border-b pb-4 flex justify-between items-start text-sm">
  <span className="text-gray-500">Phone Number</span>
  <span className="text-gray-800 font-medium">
    {data.owner?.phone}
  </span>
</div>

{/* LOCATION */}
<div className="mt-4 border-b pb-4 flex justify-between items-start text-sm">
  <span className="text-gray-500">Location</span>
  <span className="text-gray-800 font-medium text-right max-w-[65%] break-words">
    {[
      data.owner?.addressLine,
      data.owner?.city,
      data.owner?.state,
      data.owner?.country,
    ]
      .filter(Boolean)
      .join(", ")}
  </span>
</div>


  {/* BUTTON */}
  <button className="w-full mt-6 bg-black text-white py-3 rounded-xl font-semibold">
    Message to owner
  </button>

  {/* WHATSAPP */}
<a
  href={`https://wa.me/91${data.owner?.phone}`}
  target="_blank"
  rel="noopener noreferrer"
  className="block text-center mt-4 text-teal-600 font-medium hover:underline"
>
  Chat Via Whatsapp
</a>



</div>


</div>




  </div>

{/* ================= YOU MAY BE INTERESTED ================= */}
<section className="bg-[#f5f6f8] py-20">
  <div className="max-w-[1280px] mx-auto px-4 relative">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-10">
      <h2 className="text-3xl font-bold">
        You May Be Interested In
      </h2>

      <div className="flex gap-3">
        <button className="custom-prev w-11 h-11 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition">
          ←
        </button>
        <button className="custom-next w-11 h-11 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition">
          →
        </button>
      </div>
    </div>

    <Swiper
      modules={[SwiperNavigation]}
      spaceBetween={30}
      slidesPerView={3}
      navigation={{
        prevEl: ".custom-prev",
        nextEl: ".custom-next",
      }}
      breakpoints={{
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1200: { slidesPerView: 3 },
      }}
    >
  {Array.isArray(randomListings) &&
  randomListings.map((item) => (

        <SwiperSlide key={item._id}>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">

{/* IMAGE WRAPPER */}
<div className="p-4 pb-0">
  <div className="relative rounded-2xl overflow-hidden h-60">

    <img
      src={item.imageUrl}
      alt={item.name}
      className="w-full h-full object-cover"
    />

    {/* Brand Badge */}
    <span className="absolute bottom-3 left-3 bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow">
      {item.brand}
    </span>

    {/* Heart */}
    <button className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-100 transition">
      <Heart size={16} />
    </button>

  </div>
</div>


            {/* CONTENT */}
            <div className="flex flex-col flex-1 p-6">

              {/* TITLE */}
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {item.name}
              </h3>

              {/* RATING (FROM DB) */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                <div className="flex text-orange-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={
                        star <= Math.round(item.avgRating || 0)
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                    />
                  ))}
                </div>

                <span className="text-gray-600">
                  ({item.avgRating?.toFixed(1) || "0.0"})
                </span>

                <span className="text-gray-400">
                  {item.totalReviews || 0} Reviews
                </span>
              </div>

              {/* SPECS */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-600 mt-4">

                {item.type === "Vehicle" ? (
                  <>
                    <Spec icon={<Settings size={16} />} label={item.transmission} />
                    <Spec icon={<Fuel size={16} />} label={item.fuel} />
                    <Spec icon={<Cog size={16} />} label={item.year} />
                    <Spec icon={<Users size={16} />} label={`${item.seats} Seats`} />
                  </>
                ) : (
                  <>
                    <Spec
                      icon={<Gauge size={16} />}
                      label={`${item.mileage || "—"} km/l`}
                    />
                    <Spec icon={<Fuel size={16} />} label={item.fuel} />
                    <Spec icon={<Cog size={16} />} label={item.year} />
                    <Spec icon={<Bike size={16} />} label={item.bikeType} />
                  </>
                )}
              </div>

              {/* LOCATION + PRICE */}
              <div className="mt-6 bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">

                <div className="flex items-center gap-2 text-sm text-gray-500 truncate max-w-[65%]">
                  <MapPin size={16} />
                  <span className="truncate">
                    {item.mainLocation}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">
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
                className="mt-6 w-full bg-black text-white py-3 rounded-2xl font-semibold hover:bg-gray-900 transition"
              >
                Rent Now
              </button>

            </div>
          </div>

        </SwiperSlide>
      ))}
    </Swiper>

  </div>
</section>


</div>

{/* ================= ENQUIRY MODAL ================= */}
{showEnquiry && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white w-[500px] max-w-[95%] rounded-2xl p-6 relative shadow-xl animate-fadeIn">

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setShowEnquiry(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
      >
        ✕
      </button>

      {/* TITLE */}
      <h2 className="text-xl font-semibold mb-4">Enquiry</h2>

      {/* VEHICLE INFO */}
      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-lg mb-4">
        <img
          src={data.imageUrl}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-500">{data.mainLocation}</p>
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-3">

        <input
          value={enquiryForm.name}
          onChange={(e) =>
            setEnquiryForm({ ...enquiryForm, name: e.target.value })
          }
          placeholder="Enter Name"
          className="w-full border rounded-lg p-3"
        />

        <input
          value={enquiryForm.email}
          onChange={(e) =>
            setEnquiryForm({ ...enquiryForm, email: e.target.value })
          }
          placeholder="Enter Email"
          className="w-full border rounded-lg p-3"
        />

        <input
          value={enquiryForm.phone}
          onChange={(e) =>
            setEnquiryForm({ ...enquiryForm, phone: e.target.value })
          }
          placeholder="Enter Phone"
          className="w-full border rounded-lg p-3"
        />

   <textarea
  value={enquiryForm.message}
  maxLength={250}   // ✅ LIMIT
  onChange={(e) =>
    setEnquiryForm({
      ...enquiryForm,
      message: e.target.value
    })
  }
  placeholder="Message"
  className="w-full border rounded-lg p-3 h-24"
/>

{/* CHARACTER COUNT */}
<p className="text-right text-xs text-gray-500">
  {enquiryForm.message.length}/250
</p>
      </div>

      {/* BUTTON */}
      <button
        onClick={submitEnquiry}
        className="w-full mt-5 bg-[#e6a24a] text-white py-3 rounded-lg font-semibold hover:opacity-90"
      >
        Submit
      </button>

    </div>
  </div>
)}

</>
);
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Spec({ icon, label, value }) {
  return (
    <div className="flex gap-3 items-center">
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Price({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between mb-2">
      <span>{label}</span>
      <span className="font-semibold">₹{value}</span>
    </div>
  );
}
function getServiceIcon(title) {
  const lower = title.toLowerCase();

  if (lower.includes("gps") || lower.includes("navigation"))
    return <Navigation size={18} />;

  if (lower.includes("wifi"))
    return <Wifi size={18} />;

  if (lower.includes("child"))
    return <Baby size={18} />;

  if (lower.includes("fuel"))
    return <Fuel size={18} />;

  if (lower.includes("road"))
    return <Shield size={18} />;

  if (lower.includes("radio"))
    return <Radio size={18} />;

  if (lower.includes("accessories"))
    return <Package size={18} />;

  if (lower.includes("express"))
    return <Clock size={18} />;

  if (lower.includes("usb"))
    return <Usb size={18} />;

  if (lower.includes("toll"))
    return <Receipt size={18} />;

  if (lower.includes("dash"))
    return <Camera size={18} />;

  return <Package size={18} />;
}

function SpecCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">

      <div className="w-14 h-14 flex items-center justify-center rounded-xl border bg-gray-50 text-gray-700">
        {icon}
      </div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>

    </div>
  );
}

function StarRating({ label, value, onChange }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2 capitalize">
        {label}
      </p>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={22}
            className="cursor-pointer transition"
            fill={
              hoverValue >= star || value >= star
                ? "#f97316"
                : "none"
            }
            stroke="#f97316"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );
}


