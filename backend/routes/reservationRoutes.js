const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Vehicle = require("../models/Vehicle");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Booking = require("../models/Booking"); // 🔥 ADD THIS
const firebaseAuth = require("../middleware/firebaseAuth");
const razorpay = require("../config/razorpay");


const updateReservationStatus = async (r) => {

  const now = new Date();

  const start = new Date(r.startDate);
  const end = new Date(r.endDate);

  // ✅ PAYMENT VALIDATION (FINAL)
  const isValidPayment =
    (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
    (r.payment?.method === "pickup"); // 🔥 ANY pickup allowed

  // ❌ AUTO REJECT ONLY FOR ONLINE UNPAID
  const isOnlineUnpaid =
    r.payment?.method === "razorpay" &&
    r.payment?.status !== "Paid";

  if (
    r.approvalStatus === "approved" &&
    isOnlineUnpaid &&
    now >= start
  ) {
    r.approvalStatus = "rejected";
    r.rejectionReason = "Auto rejected (payment not done)";
    await r.save();
  }

  // ✅ STATUS LOGIC
  let status = "pending";

  if (r.approvalStatus === "approved" && isValidPayment) {

    if (now < start) {
      status = "upcoming";
    } 
    else if (now >= start && now <= end) {
      status = "in_rental";
    } 
    else {
      status = "completed";
    }

  }

  return status;
};

// ================= TOTAL CALC =================
const calculateReservationTotal = async (reservation) => {

  const vehicles = await Vehicle.find({
    _id: { $in: reservation.vehicleIds }
  });

  const rentalDays = reservation.rentalDays || 1;

  // 🔥 CAR PRICE
  const carTotal = vehicles.reduce((sum, v) => {
    const price =
      v.pricing?.dailyPrice ||
      v.dailyPrice ||
      v.price ||
      0;

    return sum + (price * rentalDays);
  }, 0);

  // 🔥 EXTRAS
  const extrasTotal = (reservation.extras || []).reduce((sum, e) => {
    if (e.type === "per_day") {
      return sum + (e.price * rentalDays);
    }
    return sum + e.price;
  }, 0);

  const security = Number(reservation.securityDeposit) || 0;
  const toll = Number(reservation.tollAmount) || 0;

  return carTotal + extrasTotal + security + toll;
};

/* GET CUSTOMERS FOR RESERVATION */
router.get("/customers", async (req, res) => {

try {

const users = await User.find({ role: "user" })
.select("firebaseUid name email phone")
.limit(50);

const customers = await Promise.all(

users.map(async (user) => {

const profile = await Profile.findOne({
firebaseUid: user.firebaseUid
}).select("profileImage phone");

/* PHONE PRIORITY
1. Profile.phone
2. User.phone
*/

const phone = profile?.phone || user.phone || "";

return {

_id: user._id,
name: user.name,
email: user.email,
phone: phone,
profileImage: profile?.profileImage || ""

};

})

);

res.json(customers);

} catch (err) {

res.status(500).json({ message: err.message });

}

});

/* GET VEHICLES WITH STATUS */

router.post("/vehicles-status", firebaseAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    /* ================= RESERVATION BLOCK ================= */
const allReservations = await Reservation.find({
  approvalStatus: "approved",
  $or: [
    {
      "payment.method": "razorpay",
      "payment.status": "Paid"
    },
    {
      "payment.method": "pickup"
    }
  ]
});
const now = new Date();

const reservations = allReservations.filter(r => {

  const existingStart = new Date(r.startDate);
  const existingEnd = new Date(r.endDate);

  existingStart.setHours(0,0,0,0);
  existingEnd.setHours(23,59,59,999);

  /* 🔥 AUTO STATUS */
  let dynamicStatus = "upcoming";
// 🔥 SKIP UNPAID ONLINE
if (
  r.payment?.method === "razorpay" &&
  r.payment?.status !== "Paid"
) {
  return false;
}
// 🔥 BLOCK ONLY IF PAYMENT DONE OR PICKUP SELECTED
if (
  r.payment?.method === "pickup" &&
  r.payment?.status !== "Pending"
) {
  return false;
}
  if (now >= existingStart && now <= existingEnd) {
    dynamicStatus = "in_rental";
  } else if (now > existingEnd) {
    dynamicStatus = "completed";
  }

  /* ❌ IGNORE COMPLETED */
  if (dynamicStatus === "completed") return false;

  /* 🔥 OVERLAP CHECK */
  return start <= existingEnd && end >= existingStart;

});

    const reservedFromReservation = reservations.flatMap(r =>
      r.vehicleIds.map(id => id.toString())
    );

    /* ================= BOOKING BLOCK ================= */
    const allBookings = await Booking.find({
      listingType: "Vehicle",
      isDeleted: { $ne: true },
      status: { $in: ["Confirmed", "Pending"] }
    });

    const bookings = allBookings.filter(b => {
      const existingStart = new Date(b.pickupDate);
      const existingEnd = new Date(b.returnDate);

      existingStart.setHours(0,0,0,0);
      existingEnd.setHours(23,59,59,999);

      return start <= existingEnd && end >= existingStart;
    });

    const reservedFromBooking = bookings.map(b =>
      b.listingId.toString()
    );

    /* ================= MERGE ================= */
    const reservedIds = [
      ...new Set([
        ...reservedFromReservation,
        ...reservedFromBooking
      ])
    ];

/* ================= VEHICLES ================= */
const mongoUser = await User.findById(req.user.mongoId);

let vehicles;

if (mongoUser?.role === "owner") {

  vehicles = await Vehicle.find({
    owner: mongoUser._id,
    status: "approved",
    isActive: true
  });

} else if (mongoUser?.role === "admin") {

  // 🔥 ONLY ADMIN VEHICLES
  vehicles = await Vehicle.find({
      owner: mongoUser._id,  
    status: "approved",
    isActive: true
  });

} else {

  // fallback (optional)
  vehicles = await Vehicle.find({
    status: "approved",
    isActive: true
  });

}

    /* ================= FINAL RESULT ================= */
    const result = await Promise.all(
      vehicles.map(async (v) => {

        const id = v._id.toString();

        let status = "available";

        if (reservedFromReservation.includes(id)) {
          status = "reserved";
        }

        if (reservedFromBooking.includes(id)) {
          status = "booked";
        }

        /* 🔥 OWNER FETCH (MAIN FIX) */
        const ownerUser = await User.findById(v.owner);


        let ownerProfile = null;

        if (ownerUser?.firebaseUid) {
          ownerProfile = await Profile.findOne({
            firebaseUid: ownerUser.firebaseUid
          });
        }

        /* 🔥 SAFE OWNER DATA */
        let ownerName =
          ownerProfile?.name ||
          ownerUser?.name ||
          "Owner";

        let ownerEmail =
          ownerUser?.email || "";

        let ownerPhone =
          ownerProfile?.phone ||
          ownerUser?.phone ||
          "";

        let ownerImage =
          ownerProfile?.profileImage ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png";

        return {
          ...v.toObject(),
          status,

          ownerDetails: {
            name: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            image: ownerImage
          },

          image:
            v.imageUrl ||
            (v.images && v.images.length ? v.images[0] : null)
        };
      })
    );

    res.json(result);

  } catch (err) {
    console.error("VEHICLE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* CREATE RESERVATION */
router.post("/", firebaseAuth, async (req, res) => {
  try {
    let {
      vehicleIds,
      customerId,
      extras,
      startDate,
      startTime,
      endDate,
      endTime,
      rentalDays,
      isUnlimitedKm,
      rentalType,
      passengers,
      pickupLocation,
      returnLocation,
      securityDeposit,
      baseKilometers,
      extraKmPrice,
      createdBy
    } = req.body;

    /* ================= BASIC VALIDATION ================= */



    if (!vehicleIds || vehicleIds.length === 0) {
      return res.status(400).json({ message: "Vehicle required" });
    }

    if (!customerId) {
      return res.status(400).json({ message: "Customer required" });
    }

    /* ================= FORCE TYPES ================= */

    rentalDays = Number(rentalDays) || 1;
    securityDeposit = Number(securityDeposit) || 0;
    passengers = Number(passengers) || 1;

    /* ================= CREATE START / END ================= */

    const start = new Date(`${startDate}T${startTime}`);

    if (isNaN(start)) {
      return res.status(400).json({ message: "Invalid start date/time" });
    }

    const end = new Date(start);
    end.setDate(start.getDate() + rentalDays);

    /* ================= OVERLAP CHECK (MAIN LOGIC 🔥) ================= */

const existingReservations = await Reservation.find({
  vehicleIds: { $in: vehicleIds },
  approvalStatus: "approved"
});

const conflict = existingReservations.find(r => {

  // 🔥 ONLY BLOCK IF:
  // 1. Paid OR
  // 2. Pickup selected
const isBlocking =
  (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
  (r.payment?.method === "pickup"); // 🔥 ANY pickup blocks
  if (!isBlocking) {
    return false; // ✅ allow if not paid
  }

  const existingStart = new Date(r.startDate);
  const existingEnd = new Date(r.endDate);

  existingStart.setHours(0,0,0,0);
  existingEnd.setHours(23,59,59,999);

  return start <= existingEnd && end >= existingStart;
});

if (conflict) {
  return res.status(400).json({
    message: "Vehicle already reserved for selected dates"
  });
}
    /* ================= FORMAT EXTRAS ================= */

    let formattedExtras = [];

    if (Array.isArray(extras)) {
      formattedExtras = extras.map(e => ({
        key: e.key,
        price: Number(e.price) || 0,
        type: e.type || "one_time"
      }));
    }

    /* ================= CREATE RESERVATION ================= */

/* ================= TOTAL CALCULATION ================= */



/* ================= CREATE ================= */
const mongoUser = await User.findOne({ firebaseUid: req.user.uid });
const isOwnerOrAdmin =
  mongoUser?.role === "owner" ||
  mongoUser?.role === "admin";
const reservation = new Reservation({
  vehicleIds,
  customerId,

  createdBy: createdBy || {
    userId: req.user?.uid || createdBy?.userId,
    role: "user"
  },

  startDate: start,
  endDate: end,
  startTime,
  endTime,

  rentalDays,
  rentalType,
  passengers,

  pickupLocation,
  returnLocation,
  isUnlimitedKm,

  securityDeposit,
  baseKilometers,
  extraKmPrice,

  extras: formattedExtras,

  tollAmount: 0, // ✅ ADD THIS

approvalStatus: isOwnerOrAdmin ? "approved" : "pending",
status: isOwnerOrAdmin ? "upcoming" : "pending",

approvedBy: isOwnerOrAdmin ? req.user.uid : null,
approvedAt: isOwnerOrAdmin ? new Date() : null
});

// 🔥 CALCULATE TOTAL HERE
reservation.totalAmount = await calculateReservationTotal(reservation);

    await reservation.save();

    res.status(201).json(reservation);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/owner/:uid", async (req,res)=>{

try{

const {
status,
pickupLocation,
dropLocation,
startDate,
endDate,
search,
sort
} = req.query

/* BASE FILTER */

let filter = {
  approvalStatus: { $in: ["pending", "approved"] }
};

const owner = await User.findOne({ firebaseUid: req.params.uid });

const ownerVehicleIds = await Vehicle.find({ owner: owner._id }).distinct("_id");

filter.vehicleIds = { $in: ownerVehicleIds };
/* STATUS FILTER */
if(status){
filter.status = status
}

if(pickupLocation){
filter.pickupLocation = pickupLocation
}

if(dropLocation){
filter.returnLocation = dropLocation
}

if(startDate && endDate){
filter.startDate = {
$gte:new Date(startDate),
$lte:new Date(endDate)
}
}

/* FETCH RESERVATIONS */

let reservations = await Reservation
.find(filter)
.populate("vehicleIds")
.populate("customerId", "name email phone firebaseUid")

/* SEARCH (vehicle / customer / location) */

if(search){

const term = search.toLowerCase()

reservations = reservations.filter(r=>{

const vehicle = `${r.vehicleIds?.[0]?.brand || ""} ${r.vehicleIds?.[0]?.model || ""}`.toLowerCase()

const customer = `${r.customerId?.name || ""}`.toLowerCase()

const pickup = `${r.pickupLocation || ""}`.toLowerCase()

const drop = `${r.returnLocation || ""}`.toLowerCase()

const status = `${r.status || ""}`.toLowerCase()

return (
vehicle.includes(term) ||
customer.includes(term) ||
pickup.includes(term) ||
drop.includes(term) ||
status.includes(term)
)

})

}

/* SORT */

if(sort === "asc"){
reservations.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
}

else if(sort === "desc"){
reservations.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
}

/* MAP DATA */

const data = await Promise.all(
  reservations.map(async (r) => {
  const vehicle = r.vehicleIds?.[0];

  // 🔥 CALCULATIONS
  const rentalDays = r.rentalDays || 1;

  const isUnlimitedKm = r.isUnlimitedKm || false;

const baseKm = isUnlimitedKm
  ? "Unlimited"
  : Number(r.baseKilometers) || 0;

const baseKmTotal = isUnlimitedKm
  ? 0
  : (Number(r.baseKilometers) || 0) * rentalDays;
    const extraKmPrice = Number(r.extraKmPrice) || 0;
  const securityDeposit = Number(r.securityDeposit) || 0;

  // extras total
  const extrasTotal = (r.extras || []).reduce((sum, e) => {
    if (e.type === "per_day") {
      return sum + (e.price * rentalDays);
    }
    return sum + e.price;
  }, 0);

  // base km total (if needed logic)

  // 🔥 FINAL TOTAL
// 🔥 VEHICLE PRICE
const vehiclePrice =
  (vehicle?.pricing?.dailyPrice || 0) * rentalDays;

// 🔥 FINAL TOTAL
const total =
  vehiclePrice +
  extrasTotal +
  securityDeposit +
  (r.tollAmount || 0);
const status = await updateReservationStatus(r);

// 🔥 ADD THIS (CONFLICT CHECK SAME AS USER PAGE)
const conflict = await Reservation.findOne({
  _id: { $ne: r._id },
  vehicleIds: { $in: r.vehicleIds },
  "payment.status": "Paid",
  startDate: { $lte: r.endDate },
  endDate: { $gte: r.startDate }
});

const isLocked = !!conflict;

  return {
    _id: r._id,
 extras: r.extras || [], 
  vehicleIds: r.vehicleIds,       // 🔥 ADD THIS
  customerId: r.customerId?._id, 
approvalStatus: r.approvalStatus, 
   rentalType: r.rentalType,     // ✅ ADD
  passengers: r.passengers,  
  isLocked, // 🔥 ADD THIS
    vehicle: {
      brand: vehicle?.brand,
      model: vehicle?.model,
      category: vehicle?.category,
      image: vehicle?.imageUrl || vehicle?.images?.[0]
    },
payment: r.payment, // ✅ ADD THIS
    customer: {
      name: r.customerId?.name,
      email: r.customerId?.email,
      phone: r.customerId?.phone,
      image: (
        await Profile.find({ firebaseUid: r.customerId?.firebaseUid })
      )[0]?.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },

    pickup: {
      date: r.startDate,
      time: r.startTime,
      location: r.pickupLocation
    },

    drop: {
      date: r.endDate,
      time: r.endTime,
      location: r.returnLocation
    },

    status,

    pricing: {
      rentalDays,
      baseKilometers: baseKm,
      isUnlimitedKm,
      extraKmPrice,
      securityDeposit,
      extras: r.extras || [],
      extrasTotal,
      baseKmTotal,
      tollAmount: r.tollAmount || 0,
      total
    }
  };

})
);

res.json(data)

}catch(err){

res.status(500).json({message:err.message})

}

})

/* GET ALL RESERVATION LOCATIONS */

router.get("/locations/:uid", async (req,res)=>{

try{

const reservations = await Reservation.find({
"createdBy.userId": req.params.uid
})

const pickupLocations = [
...new Set(reservations.map(r => r.pickupLocation).filter(Boolean))
]

const dropLocations = [
...new Set(reservations.map(r => r.returnLocation).filter(Boolean))
]

res.json({
pickupLocations,
dropLocations
})

}catch(err){

res.status(500).json({message:err.message})

}

})

router.delete("/:id", async(req,res)=>{

try{

await Reservation.findByIdAndDelete(req.params.id)

res.json({message:"Reservation deleted"})

}catch(err){

res.status(500).json({message:err.message})

}

})

router.put("/mark-paid/:id", firebaseAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Not found" });
    }

    if (reservation.payment?.status === "Paid") {
      return res.status(400).json({
        message: "Already marked as paid"
      });
    }

    if (reservation.payment?.method !== "pickup") {
      return res.status(400).json({
        message: "Only pickup payment allowed"
      });
    }

   /* ================= CONFLICT CHECK (ADD THIS) ================= */

const conflict = await Reservation.findOne({
  _id: { $ne: reservation._id },
  vehicleIds: { $in: reservation.vehicleIds },
  approvalStatus: "approved",

  $or: [
    {
      "payment.method": "razorpay",
      "payment.status": "Paid"
    },
    {
      "payment.method": "pickup"
    }
  ],

  startDate: { $lte: reservation.endDate },
  endDate: { $gte: reservation.startDate }
});

if (conflict) {
  return res.status(400).json({
    message: "Vehicle already booked or reserved"
  });
}

/* ================= MARK PAID ================= */

reservation.payment.status = "Paid";
reservation.payment.paymentDate = new Date();
await reservation.save();

// 🔥 GET FULL DATA LIKE OWNER API
const r = await Reservation.findById(req.params.id)
  .populate("vehicleIds")
  .populate("customerId");

const vehicle = r.vehicleIds?.[0];

const profile = await Profile.findOne({
  firebaseUid: r.customerId?.firebaseUid
});

res.json({
  _id: r._id,

  vehicle: {
    brand: vehicle?.brand,
    model: vehicle?.model,
    category: vehicle?.category,
    image: vehicle?.imageUrl || vehicle?.images?.[0]
  },

  customer: {
    name: r.customerId?.name,
    email: r.customerId?.email,
    phone: r.customerId?.phone,
    image: profile?.profileImage || ""
  },

  pickup: {
    date: r.startDate,
    time: r.startTime,
    location: r.pickupLocation
  },

  drop: {
    date: r.endDate,
    time: r.endTime,
    location: r.returnLocation
  },

  rentalDays: r.rentalDays,
  rentalType: r.rentalType,
  passengers: r.passengers,

  pricing: {
    total: r.totalAmount,
    securityDeposit: r.securityDeposit,
    extras: r.extras || [],
    tollAmount: r.tollAmount || 0
  },

  totalAmount: r.totalAmount,
  tollAmount: r.tollAmount || 0,

  payment: r.payment,

  status: r.status,
  approvalStatus: r.approvalStatus,

  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  approvedAt: r.approvedAt,
  startDate: r.startDate,
  endDate: r.endDate
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/user", firebaseAuth, async (req, res) => {
  try {
const {
  vehicleIds,
  startDate,
  startTime,
  endTime,
  rentalDays,
  rentalType,
  passengers,
  pickupLocation,
  returnLocation,
  extras,
  baseKilometers,     // 🔥 ADD
  extraKmPrice        // 🔥 ADD
} = req.body;

    /* ================= GET USER ================= */
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    /* ================= VALIDATION ================= */

    if (!vehicleIds || vehicleIds.length === 0) {
      return res.status(400).json({ message: "Vehicle required" });
    }

    if (!startDate || !startTime) {
      return res.status(400).json({ message: "Start date & time required" });
    }

    if (!pickupLocation || !returnLocation) {
      return res.status(400).json({ message: "Location required" });
    }

    if (rentalDays > 30) {
      return res.status(400).json({ message: "Max 30 days allowed" });
    }

    if (passengers > 20) {
      return res.status(400).json({ message: "Max 20 passengers allowed" });
    }

    /* ================= DATE ================= */

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(start);
    end.setDate(start.getDate() + Number(rentalDays));

    /* ================= FORMAT EXTRAS ================= */

    let formattedExtras = [];

    if (Array.isArray(extras)) {
      formattedExtras = extras.map(e => ({
        key: e.key,
        price: Number(e.price) || 0,
        type: e.type || "one_time"
      }));
    }
const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } });
// 🔥 CALCULATE TOTAL FIRST
const carTotal = vehicles.reduce((sum, v) => {
  const price = v.pricing?.dailyPrice || 0;
  return sum + (price * rentalDays);
}, 0);

const extrasTotal = formattedExtras.reduce((sum, e) => {
  if (e.type === "per_day") {
    return sum + (e.price * rentalDays);
  }
  return sum + e.price;
}, 0);

const security = Number(vehicles[0]?.securityDeposit || 0);

// ✅ DEFINE THIS (MAIN FIX)
const totalAmount = carTotal + extrasTotal + security;
// 🔥 PREVENT DUPLICATE REQUEST (SAME USER)
const existingUserReservation = await Reservation.findOne({
  customerId: user._id,
  vehicleIds: { $in: vehicleIds },

  // ❗ IMPORTANT → allow only if rejected
  approvalStatus: { $ne: "rejected" },

  // 🔥 DATE OVERLAP CHECK
  startDate: { $lte: end },
  endDate: { $gte: start }
});

if (existingUserReservation) {
  return res.status(400).json({
    message: "You already requested this vehicle for selected dates"
  });
}

    /* ================= CREATE ================= */

const reservation = new Reservation({
  vehicleIds,
  customerId: user._id,

  createdBy: {
    userId: req.user.uid,
    role: "user"
  },

  startDate: start,
  endDate: end,

  startTime,
  endTime,

  rentalDays,
  rentalType,
  passengers,

  pickupLocation,
  returnLocation,

  extras: formattedExtras,
baseKilometers: null,
extraKmPrice: null,
isUnlimitedKm: false,
  

  approvalStatus: "pending",

  // 🔥 ADD THIS
payment: {
  method: null,
  amount: 0, // temporary
  status: "Pending"
}
});
reservation.totalAmount = await calculateReservationTotal(reservation);
reservation.payment.amount = reservation.totalAmount;
    await reservation.save();

    res.status(201).json({
      message: "Request sent to owner",
      reservation
    });

  } catch (err) {
    console.error("USER RESERVATION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ APPROVE RESERVATION
router.put("/approve/:id", firebaseAuth, async (req, res) => {
  try {

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔥 GET VEHICLES
    const vehicles = await Vehicle.find({
      _id: { $in: reservation.vehicleIds }
    });

    const rentalDays = reservation.rentalDays || 1;

    // 🔥 VEHICLE TOTAL
    const carTotal = vehicles.reduce((sum, v) => {
      const price =
        v.pricing?.dailyPrice ||
        v.dailyPrice ||
        v.price ||
        0;

      return sum + (price * rentalDays);
    }, 0);

    // 🔥 EXTRAS
    const extrasTotal = (reservation.extras || []).reduce((sum, e) => {
      if (e.type === "per_day") {
        return sum + (e.price * rentalDays);
      }
      return sum + e.price;
    }, 0);

    const security = Number(reservation.securityDeposit) || 0;
// ✅ ADD THIS BLOCK (DO NOT REMOVE ANYTHING ELSE)

// ✅ ADD THIS (FOR EXTRAS + KM)

const {
  extras,
  baseKilometers,
  extraKmPrice,
  isUnlimitedKm
} = req.body;

// 🔥 UPDATE EXTRAS (VERY IMPORTANT)
if (Array.isArray(extras)) {
  reservation.extras = extras.map(e => ({
    key: e.key,
    price: Number(e.price) || 0,
    type: e.type || "one_time"
  }));
}

// 🔥 UPDATE KM
reservation.baseKilometers = isUnlimitedKm
  ? null
  : Number(baseKilometers) || 0;

reservation.extraKmPrice = Number(extraKmPrice) || 0;
reservation.isUnlimitedKm = Boolean(isUnlimitedKm);
    reservation.totalAmount = await calculateReservationTotal(reservation);

    // 🔥 APPROVE
    reservation.approvalStatus = "approved";
    reservation.status = "upcoming";
    reservation.approvedAt = new Date();

    await reservation.save();

    res.json({ message: "Approved", reservation });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/:id", firebaseAuth, async (req, res) => {
  try {

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/reject/:id", firebaseAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.length < 5) {
      return res.status(400).json({ message: "Reason too short" });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // ✅ ONLY BLOCK ONLINE PAID
    const isPaidOnline =
      reservation.payment?.method === "razorpay" &&
      reservation.payment?.status === "Paid";

    if (isPaidOnline) {
      return res.status(400).json({
        message: "User already paid online. Cannot reject."
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });

    await Reservation.findByIdAndUpdate(req.params.id, {
      approvalStatus: "rejected",
      rejectionReason: reason,
      approvedBy: user.role,
      approvedAt: new Date()
    });

    res.json({ message: "Rejected" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/my-reservations", firebaseAuth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const reservations = await Reservation.find({
      customerId: user._id
    })
      .populate("vehicleIds")
      .sort({ createdAt: -1 });

const data = await Promise.all(
  reservations.map(async (r) => {

    const vehicle = r.vehicleIds?.[0];

    // 🔥 CHECK IF SOMEONE ELSE ALREADY PAID
    const conflict = await Reservation.findOne({
      _id: { $ne: r._id },
      vehicleIds: { $in: r.vehicleIds },
      "payment.status": "Paid",
      startDate: { $lte: r.endDate },
      endDate: { $gte: r.startDate }
    });

    const isLocked = !!conflict;

    return {
      _id: r._id,

      vehicle: {
        name: vehicle?.name,
        model: vehicle?.model,
        image: vehicle?.imageUrl || vehicle?.images?.[0]
      },

      createdAt: r.createdAt,
      totalAmount: r.totalAmount,
      approvalStatus: r.approvalStatus,
      rejectionReason: r.rejectionReason,

      payment: r.payment || {
        method: null,
        status: "Pending",
        amount: r.totalAmount
      },

      isLocked, // 🔥🔥🔥 ADD THIS

      full: r
    };
  })
);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🔥 USER - GET RESERVATION PAYMENTS
router.get("/my-payments", firebaseAuth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const reservations = await Reservation.find({
      customerId: user._id
    })
      .populate("vehicleIds")
      .sort({ createdAt: -1 });

    const data = reservations.map((r) => {
      const vehicle = r.vehicleIds?.[0];

      return {
        type: "reservation",

        vehicleName: vehicle?.name || "Unknown",
        vehicleModel: vehicle?.model || "",
        vehicleImage:
          vehicle?.imageUrl ||
          vehicle?.images?.[0] ||
          "/default.png",

        userName: user.name,
        userImage: "",

        amount: r.payment?.amount || r.totalAmount,
        method: r.payment?.method || "pickup",

        paymentStatus: r.payment?.status || "Pending",

        bookingStatus: r.status || "pending",

        date: r.payment?.paymentDate || r.createdAt,
      };
    });

    res.json(data);

  } catch (err) {
    console.error("Reservation payment error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🔥 ADMIN - GET RESERVATION PAYMENTS
router.get("/admin-payments", firebaseAuth, async (req, res) => {
  try {
const reservations = await Reservation.find({
  approvalStatus: "approved",
  $or: [
    { "payment.method": "razorpay", "payment.status": "Paid" },
    { "payment.method": "pickup", "payment.status": "Paid" }
  ]
})
.populate("vehicleIds")
.populate("customerId", "name email firebaseUid")
.sort({ createdAt: -1 });
    const data = await Promise.all(
      reservations.map(async (r) => {
        const vehicle = r.vehicleIds?.[0];

        const profile = await Profile.findOne({
          firebaseUid: r.customerId?.firebaseUid
        });


        return {
  transactionId:
    r.payment?.transactions?.[0]?.razorpay_payment_id ||
    `RES-${r._id}`,

  vehicleName: `${vehicle?.brand || ""} ${vehicle?.model || ""}`,
  vehicleImage:
    vehicle?.imageUrl ||
    vehicle?.images?.[0] ||
    "/logo.png",

  userName: r.customerId?.name || "User",
  userImage: profile?.profileImage || "",

  // ✅ FIXED
  amount:
  (r.totalAmount || 0),

  method: r.payment?.method || "pickup",
  date: r.createdAt,

  paymentStatus: r.payment?.status || "Pending",
  bookingStatus: r.status || "pending",

  addedBy: r.createdBy?.role || "user"
};

      })
    );
res.json({
  totalReservations: reservations.length,
  data
});
    

  } catch (err) {
    console.error("Admin reservation payments error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🔥 CREATE RAZORPAY ORDER
router.post("/create-order/:id", firebaseAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
const totalWithDeposit =
  (reservation.totalAmount || 0) +
  (reservation.securityDeposit || 0);

const options = {
  amount: totalWithDeposit * 100,
  currency: "INR",
  receipt: `res_${reservation._id}`
};
    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/verify-payment", firebaseAuth, async (req, res) => {
  try {
    const {
      reservationId,
      razorpay_order_id,
      razorpay_payment_id,
      checkOnly // 🔥 ADD THIS
    } = req.body;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const vehicleIds = reservation.vehicleIds;
    const startDate = reservation.startDate;
    const endDate = reservation.endDate;

    // 🔥 FIRST PAY WINS
    const conflict = await Reservation.findOne({
      _id: { $ne: reservationId },
      vehicleIds: { $in: vehicleIds },
      "payment.status": "Paid",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    if (conflict) {
      return res.status(400).json({
        message: "Too late! Vehicle already booked by another user"
      });
    }

    // ✅ 🔥 IMPORTANT: CHECK MODE (DO NOT SAVE)
    if (checkOnly) {
      return res.json({ message: "Available" });
    }

    // ✅ SAVE PAYMENT (ONLY REAL PAYMENT)
    reservation.payment = {
      method: "razorpay",
      amount: reservation.totalAmount,
      status: "Paid",
        paymentDate: new Date(), 
      transactions: [
        {
          razorpay_order_id,
          razorpay_payment_id,
          amount: reservation.totalAmount
        }
      ]
    };

    await reservation.save();

    res.json({ message: "Payment successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE RESERVATION DETAIL
router.get("/:id", async (req, res) => {
  try {
    const r = await Reservation.findById(req.params.id)
      .populate("vehicleIds")
      .populate("customerId", "name email phone firebaseUid");

    if (!r) {
      return res.status(404).json({ message: "Not found" });
    }

    const vehicle = r.vehicleIds?.[0];

    const profile = await Profile.findOne({
      firebaseUid: r.customerId?.firebaseUid
    });

res.json({
  _id: r._id,

  vehicle: {
    brand: vehicle?.brand,
    model: vehicle?.model,
    category: vehicle?.category,
    image: vehicle?.imageUrl || vehicle?.images?.[0]
  },

  customer: {
    name: r.customerId?.name,
    email: r.customerId?.email,
    phone: r.customerId?.phone,
    image: profile?.profileImage
  },

  pickup: {
    date: r.startDate,
    time: r.startTime,
    location: r.pickupLocation
  },

  drop: {
    date: r.endDate,
    time: r.endTime,
    location: r.returnLocation
  },

  rentalDays: r.rentalDays,
  rentalType: r.rentalType,
  passengers: r.passengers,

pricing: {
  total: r.totalAmount,
  securityDeposit: r.securityDeposit,
  extras: r.extras || [],
  tollAmount: r.tollAmount || 0 // ✅ ADD
},

  payment: r.payment,

  status: r.status,
  approvalStatus: r.approvalStatus,
  rejectionReason: r.rejectionReason,

  // 🔥 IMPORTANT FOR HISTORY
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  approvedAt: r.approvedAt,
  startDate: r.startDate,
  endDate: r.endDate
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/pay-pickup/:id", firebaseAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const vehicleIds = reservation.vehicleIds;
    const startDate = reservation.startDate;
    const endDate = reservation.endDate;

    // 🔥 CHECK IF ALREADY BOOKED
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      vehicleIds: { $in: vehicleIds },
      "payment.status": "Paid",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    if (conflict) {
      return res.status(400).json({
        message: "Too late! Vehicle already booked by another user"
      });
    }

    // ✅ IMPORTANT CHANGE HERE ONLY
 reservation.payment = {
  method: "pickup",
  amount: reservation.totalAmount,
  status: "Pending",
  paymentDate: null // ✅ GOOD PRACTICE
};

    await reservation.save();

    res.json({ message: "Pickup selected" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

setInterval(async () => {
  const reservations = await Reservation.find({
    approvalStatus: "approved"
  });

  for (let r of reservations) {
    await updateReservationStatus(r);
  }

  console.log("🔄 Background sync done");

}, 60 * 60 * 1000);
router.put("/add-toll/:id", firebaseAuth, async (req, res) => {
  try {
    const { tollAmount } = req.body;

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Not found" });
    }

    // ✅ AUTO COMPLETE
    const now = new Date();
    if (now > new Date(reservation.endDate)) {
      reservation.status = "completed";
    }

    if (reservation.status !== "completed") {
      return res.status(400).json({
        message: "Toll can only be added after completion"
      });
    }

    if (reservation.tollAmount > 0) {
      return res.status(400).json({
        message: "Toll already added"
      });
    }

    reservation.tollAmount = Number(tollAmount) || 0;

    reservation.totalAmount = await calculateReservationTotal(reservation);

    await reservation.save();

    const vehicle = await Vehicle.findById(reservation.vehicleIds[0]);

res.json({
  _id: reservation._id,

  vehicle: {
    brand: vehicle?.brand,
    model: vehicle?.model,
    category: vehicle?.category,
    image: vehicle?.imageUrl || vehicle?.images?.[0]
  },

  customer: {}, // optional keep empty

  pickup: {
    date: reservation.startDate,
    location: reservation.pickupLocation
  },

  drop: {
    date: reservation.endDate,
    location: reservation.returnLocation
  },

  rentalDays: reservation.rentalDays,
  rentalType: reservation.rentalType,

  pricing: {
    total: reservation.totalAmount,
    securityDeposit: reservation.securityDeposit,
    extras: reservation.extras || [],
    tollAmount: reservation.tollAmount
  },

  totalAmount: reservation.totalAmount, // 🔥 ADD THIS
  tollAmount: reservation.tollAmount,   // 🔥 ADD THIS

  status: reservation.status,
  approvalStatus: reservation.approvalStatus,

  createdAt: reservation.createdAt,
  updatedAt: reservation.updatedAt,
  approvedAt: reservation.approvedAt,
  startDate: reservation.startDate,
  endDate: reservation.endDate
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= ADMIN: GET ALL RESERVATIONS ================= */
router.get("/admin", firebaseAuth, async (req, res) => {
  try {

    console.log("ADMIN UID:", req.user.uid);

    const mongoUser =
      await User.findOne({ firebaseUid: req.user.uid }) ||
      await User.findById(req.user.mongoId);

    if (!mongoUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (mongoUser.role !== "admin") {
      return res.status(403).json({ message: "Not admin" });
    }

    const {
      status,
      pickupLocation,
      dropLocation,
      startDate,
      endDate,
      search,
      sort
    } = req.query;

    let filter = {};

    if (status) filter.approvalStatus = status;
    if (pickupLocation) filter.pickupLocation = pickupLocation;
    if (dropLocation) filter.returnLocation = dropLocation;

if (
  startDate &&
  endDate &&
  startDate !== "" &&
  endDate !== ""
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!isNaN(start) && !isNaN(end)) {
    filter.startDate = {
      $gte: start,
      $lte: end
    };
  }
}

    let reservations = await Reservation
      .find(filter)
      .populate("vehicleIds")
      .populate("customerId", "name email phone firebaseUid");

    if (search) {
      const term = search.toLowerCase();

      reservations = reservations.filter(r => {
        return (
          `${r.vehicleIds?.[0]?.brand || ""} ${r.vehicleIds?.[0]?.model || ""}`.toLowerCase().includes(term) ||
          `${r.customerId?.name || ""}`.toLowerCase().includes(term) ||
          `${r.pickupLocation || ""}`.toLowerCase().includes(term) ||
          `${r.returnLocation || ""}`.toLowerCase().includes(term)
        );
      });
    }

    if (sort === "asc") {
      reservations.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      reservations.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    }

    const data = await Promise.all(
      reservations.map(async (r) => {
const vehicle = r.vehicleIds && r.vehicleIds.length > 0
  ? r.vehicleIds[0]
  : null;
   let profile = null;

if (r.customerId && r.customerId.firebaseUid) {
  profile = await Profile.findOne({
    firebaseUid: r.customerId.firebaseUid
  });
}
const status = await updateReservationStatus(r);

        return {
          _id: r._id,

          createdBy: r.createdBy || { role: "user" },

          vehicle: {
            brand: vehicle?.brand,
            model: vehicle?.model,
            image: vehicle?.imageUrl || vehicle?.images?.[0]
          },
            status,
          customer: {
            name: r.customerId?.name || "User",
            email: r.customerId?.email || "",
            phone: r.customerId?.phone || "",
            image:
              profile?.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          },

          pickup: {
            date: r.startDate,
            location: r.pickupLocation
          },

          drop: {
            date: r.endDate,
            location: r.returnLocation
          },

          approvalStatus: r.approvalStatus,
          payment: r.payment,
          createdAt: r.createdAt
        };
      })
    );

    res.json(data);

  } catch (err) {
    console.error("🔥 ADMIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin-all", async (req, res) => {
  try {

    const {
      status,
      pickupLocation,
      dropLocation,
      startDate,
      endDate,
      search,
      sort
    } = req.query;

    let filter = {
      approvalStatus: { $in: ["pending", "approved"] }
    };

    /* 🔥 NO OWNER FILTER → ALL VEHICLES */
    const allVehicleIds = await Vehicle.find().distinct("_id");

    filter.vehicleIds = { $in: allVehicleIds };

    if (status) filter.approvalStatus = status;
    if (pickupLocation) filter.pickupLocation = pickupLocation;
    if (dropLocation) filter.returnLocation = dropLocation;

    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let reservations = await Reservation
      .find(filter)
      .populate("vehicleIds")
      .populate("customerId", "name email phone firebaseUid");

    /* 🔍 SEARCH */
    if (search) {
      const term = search.toLowerCase();

      reservations = reservations.filter(r => {
        const vehicle = `${r.vehicleIds?.[0]?.brand || ""} ${r.vehicleIds?.[0]?.model || ""}`.toLowerCase();
        const customer = `${r.customerId?.name || ""}`.toLowerCase();
        const pickup = `${r.pickupLocation || ""}`.toLowerCase();
        const drop = `${r.returnLocation || ""}`.toLowerCase();

        return (
          vehicle.includes(term) ||
          customer.includes(term) ||
          pickup.includes(term) ||
          drop.includes(term)
        );
      });
    }

    /* SORT */
    if (sort === "asc") {
      reservations.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      reservations.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    }

    /* FORMAT SAME AS OWNER */
    const data = await Promise.all(
      reservations.map(async (r) => {

        const vehicle = r.vehicleIds?.[0];

        const profile = await Profile.findOne({
          firebaseUid: r.customerId?.firebaseUid
        });

      const status = await updateReservationStatus(r);
        return {
          _id: r._id,

          createdBy: r.createdBy || { role: "user" },
          status,
          vehicle: {
            brand: vehicle?.brand,
            model: vehicle?.model,
            image: vehicle?.imageUrl || vehicle?.images?.[0]
          },

          customer: {
            name: r.customerId?.name,
            email: r.customerId?.email,
            phone: r.customerId?.phone,
            image:
              profile?.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          },

          pickup: {
            date: r.startDate,
            location: r.pickupLocation
          },

          drop: {
            date: r.endDate,
            location: r.returnLocation
          },

          approvalStatus: r.approvalStatus,
          payment: r.payment,
          createdAt: r.createdAt
        };
      })
    );

    res.json(data);

  } catch (err) {
    console.error("ADMIN ALL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ================= ADMIN: LOCATIONS ================= */
router.get("/locations/admin", firebaseAuth, async (req, res) => {
  try {

    const reservations = await Reservation.find(); // ✅ ALL DATA

    const pickupLocations = [
      ...new Set(reservations.map(r => r.pickupLocation).filter(Boolean))
    ];

    const dropLocations = [
      ...new Set(reservations.map(r => r.returnLocation).filter(Boolean))
    ];

    res.json({
      pickupLocations,
      dropLocations
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= RESERVATION ANALYTICS ================= */

// 🔥 MONTHLY ANALYTICS
router.get("/analytics/monthly-reservations", firebaseAuth, async (req, res) => {
  try {

    const data = await Reservation.aggregate([
      {
        $match: {
          approvalStatus: "approved",
          "payment.status": "Paid"
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          bookings: { $sum: 1 },
       amount: {
  $sum: "$totalAmount"

          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const result = months.map((m, i) => {
      const found = data.find(d => d._id === i + 1);

      return {
        name: m,
        bookings: found ? found.bookings : 0,
        amount: found ? found.amount : 0
      };
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Reservation analytics failed" });
  }
});


// 🔥 TOP VEHICLES FROM RESERVATIONS
router.get("/analytics/top-vehicles", firebaseAuth, async (req, res) => {
  try {

    const data = await Reservation.aggregate([
      {
        $match: {
          approvalStatus: "approved",
          "payment.status": "Paid"
        }
      },

      { $unwind: "$vehicleIds" },

      {
        $group: {
          _id: "$vehicleIds",
          total: { $sum: 1 }
        }
      },

      { $sort: { total: -1 } },

      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "_id",
          as: "vehicle"
        }
      },

      {
        $project: {
          name: {
            $concat: [
              { $arrayElemAt: ["$vehicle.brand", 0] },
              " ",
              { $arrayElemAt: ["$vehicle.model", 0] }
            ]
          },
          value: "$total"
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Top vehicles failed" });
  }
});

module.exports = router;