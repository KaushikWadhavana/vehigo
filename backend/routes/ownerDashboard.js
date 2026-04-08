const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");

const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Booking = require("../models/Booking");
const Profile = require("../models/Profile");
const Reservation = require("../models/Reservation");
const User = require("../models/User"); // 🔥 ADD TOP
/* ================= HELPER ================= */

const formatINR = (num) => {
  if (!num) return "₹0";

  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;

  return `₹${num}`;
};
/* ================= DASHBOARD ================= */
router.get("/", firebaseAuth, async (req, res) => {
  try {
const ownerId = req.user.mongoId;
let vehicles;

if (req.user.role === "admin") {
  // 🔥 ADMIN → ALL VEHICLES
  vehicles = await Vehicle.find({ status: "approved" });
} else {
  // OWNER (NO CHANGE)
  vehicles = await Vehicle.find({
    owner: ownerId,
    status: "approved"
  });
}

let bikes;

if (req.user.role === "admin") {
  bikes = await Bike.find({ status: "approved" });
} else {
  bikes = await Bike.find({
    owner: ownerId,
    status: "approved"
  });
}
    const all = [...vehicles, ...bikes];

let bookings;

if (req.user.role === "admin") {
  // 🔥 ADMIN → ALL BOOKINGS
  bookings = await Booking.find({
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
} else {
  // OWNER (NO CHANGE)
  bookings = await Booking.find({
    ownerId: ownerId,
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
}
    let inRental = 0;
    let upcoming = 0;
    
    
 
let bookingCount = 0;
let reservationCount = 0;

    const now = new Date();

   


    const latestVehicle = all.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

/* ================= TOTAL RESERVATIONS ================= */
let reservations;
let reservationsForStatus;
if (req.user.role === "admin") {
  // ✅ ADMIN → ALL RESERVATIONS
reservations = await Reservation.find({
  approvalStatus: "approved",
  $or: [
    {
      "payment.method": "razorpay",
      "payment.status": "Paid"
    },
    {
      "payment.method": "pickup",
      "payment.status": "Paid"
    }
  ]
});

} else {
  // ✅ OWNER → ONLY HIS VEHICLES
  const ownerVehicleIds = all.map(v => v._id);

reservations = await Reservation.find({
  vehicleIds: { $in: ownerVehicleIds },
  approvalStatus: "approved",
  $or: [
    {
      "payment.method": "razorpay",
      "payment.status": "Paid"
    },
    {
      "payment.method": "pickup",
      "payment.status": "Paid"
      
    }
  ]
});
}

// 🔥 FOR STATUS (INCLUDE PENDING PICKUP)
if (req.user.role === "admin") {
  reservationsForStatus = await Reservation.find({
    approvalStatus: "approved"
  });
} else {
  const ownerVehicleIds = all.map(v => v._id);

  reservationsForStatus = await Reservation.find({
    vehicleIds: { $in: ownerVehicleIds },
    approvalStatus: "approved"
  });
}



// RESET COUNTERS

inRental = 0;
upcoming = 0;

// ================= BOOKINGS =================
bookings.forEach((b) => {

  const isPaid =
    (b.payment?.method === "razorpay" && b.payment?.status === "Paid") ||
    (b.payment?.method === "pickup" && b.payment?.status === "Paid");

  // ✅ REVENUE ONLY IF PAID

  // ✅ STATUS (SHOW ALSO PICKUP PENDING)
  const isValid =
    b.payment?.method === "pickup" ||
    b.payment?.status === "Paid";

  if (!isValid) return;

  const pickup = new Date(b.pickupDate);
  const drop = new Date(b.returnDate);

  if (now >= pickup && now <= drop) inRental++;
  else if (now < pickup) upcoming++;


if (isPaid) {
  bookingCount++;
}
});


// ================= RESERVATIONS =================
reservationsForStatus.forEach((r) => {

  const isPaid =
    (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
    (r.payment?.method === "pickup" && r.payment?.status === "Paid");

  // ✅ REVENUE ONLY IF PAID
 

  // ✅ STATUS (SHOW ALSO PICKUP PENDING)
  const isValid =
    r.payment?.method === "pickup" ||
    r.payment?.status === "Paid";

  if (!isValid) return;

  const start = new Date(r.startDate);
  const end = new Date(r.endDate);

  if (now >= start && now <= end) inRental++;
  else if (now < start) upcoming++;
if (isPaid && r.approvalStatus === "approved") {
  reservationCount++;
}
});
const totalReservations = reservationCount;

/* ================= RESERVATION WEEKLY (SAFE - NO CONFLICT) ================= */

// 👉 USE DIFFERENT VARIABLE NAMES
const now2 = new Date();

// START OF THIS WEEK
const resStartOfWeek = new Date(now2);
const resDay = resStartOfWeek.getDay();
const resDiff = resDay === 0 ? -6 : 1 - resDay;

resStartOfWeek.setDate(resStartOfWeek.getDate() + resDiff);
resStartOfWeek.setHours(0, 0, 0, 0);

// END OF THIS WEEK
const resEndOfWeek = new Date(resStartOfWeek);
resEndOfWeek.setDate(resStartOfWeek.getDate() + 7);

// LAST WEEK
const resStartOfLastWeek = new Date(resStartOfWeek);
resStartOfLastWeek.setDate(resStartOfWeek.getDate() - 7);

const resEndOfLastWeek = new Date(resStartOfWeek);

// CURRENT WEEK
const currentWeekReservations = reservations.filter(
  (r) =>
    new Date(r.createdAt) >= resStartOfWeek &&
    new Date(r.createdAt) < resEndOfWeek
);

// LAST WEEK
const lastWeekReservations = reservations.filter(
  (r) =>
    new Date(r.createdAt) >= resStartOfLastWeek &&
    new Date(r.createdAt) < resEndOfLastWeek
);

// % CALCULATION (SAME AS BOOKING)
let reservationGrowth =
  lastWeekReservations.length === 0
    ? currentWeekReservations.length > 0
      ? 100
      : 0
    : ((currentWeekReservations.length - lastWeekReservations.length) /
        lastWeekReservations.length) *
      100;

// LIMIT
reservationGrowth = Math.max(-100, Math.min(100, reservationGrowth));
/* ================= WEEKLY GROWTH ================= */
const today = new Date();

const startOfWeek = new Date(today);
const day = startOfWeek.getDay();
const diff = day === 0 ? -6 : 1 - day;
startOfWeek.setDate(startOfWeek.getDate() + diff);
startOfWeek.setHours(0, 0, 0, 0);

const lastWeek = new Date(startOfWeek);
lastWeek.setDate(startOfWeek.getDate() - 7);

const currentWeekBookings = bookings.filter(
  (b) =>
    new Date(b.createdAt) >= startOfWeek &&
    new Date(b.createdAt) <
      new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
);
// 🔥 CURRENT WEEK RESERVATION REVENUE
const currentWeekReservationRevenue = reservations
  .filter((r) =>
    new Date(r.createdAt) >= startOfWeek &&
    new Date(r.createdAt) <
      new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  )
  .reduce((sum, r) => {
    const isPaid =
      (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
      (r.payment?.method === "pickup" && r.payment?.status === "Paid");

    if (!isPaid) return sum;

    return sum + (r.totalAmount || r.payment?.amount || 0);
  }, 0);


const prevWeekBookings = bookings.filter(
  (b) =>
    new Date(b.createdAt) >= lastWeek &&
    new Date(b.createdAt) < startOfWeek
);

// 🔥 LAST WEEK RESERVATION REVENUE
const prevWeekReservationRevenue = reservations
  .filter((r) =>
    new Date(r.createdAt) >= lastWeek &&
    new Date(r.createdAt) < startOfWeek   // ✅ FIXED
  )
  .reduce((sum, r) => {
    const isPaid =
      (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
      (r.payment?.method === "pickup" && r.payment?.status === "Paid");

    if (!isPaid) return sum;
    return sum + (r.totalAmount || r.payment?.amount || 0);
  }, 0);


const currentBookingRevenue = currentWeekBookings.reduce((sum, b) => {
  const isPaid =
    (b.payment?.method === "razorpay" && b.payment?.status === "Paid") ||
    (b.payment?.method === "pickup" && b.payment?.status === "Paid");

  if (!isPaid) return sum;

  return sum + (b.totalAmount || b.payment?.amount || 0);
}, 0);

const prevBookingRevenue = prevWeekBookings.reduce((sum, b) => {
  const isPaid =
    (b.payment?.method === "razorpay" && b.payment?.status === "Paid") ||
    (b.payment?.method === "pickup" && b.payment?.status === "Paid");

  if (!isPaid) return sum;

  return sum + (b.totalAmount || b.payment?.amount || 0);
}, 0);

// 🔥 FINAL COMBINED
const currentRevenue =
  currentBookingRevenue + currentWeekReservationRevenue;

const prevRevenue =
  prevBookingRevenue + prevWeekReservationRevenue;



/* ================= GROWTH ================= */
let revenueGrowth =
  prevRevenue === 0
    ? currentRevenue > 0 ? 100 : 0
    : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

let bookingGrowth =
  prevWeekBookings.length === 0
    ? currentWeekBookings.length > 0 ? 100 : 0
    : ((currentWeekBookings.length - prevWeekBookings.length) /
        prevWeekBookings.length) *
      100;

revenueGrowth = Math.max(-100, Math.min(100, revenueGrowth));
bookingGrowth = Math.max(-100, Math.min(100, bookingGrowth));

// ================= FULL TOTAL (ALL TIME) =================
let fullTotalEarning = 0;

let allBookings;
let allReservations;

// ================= BOOKINGS =================
if (req.user.role === "admin") {
  // 🔥 ADMIN → ALL BOOKINGS
  allBookings = await Booking.find({
    isDeleted: { $ne: true }
  });
} else {
  // 🔥 OWNER → ONLY HIS BOOKINGS
  allBookings = await Booking.find({
    ownerId: req.user.mongoId,
    isDeleted: { $ne: true }
  });
}

// ================= RESERVATIONS =================
if (req.user.role === "admin") {
  // 🔥 ADMIN → ALL RESERVATIONS
  allReservations = await Reservation.find({
    approvalStatus: "approved"
  });
} else {
  // 🔥 OWNER → ONLY HIS VEHICLES
  const ownerVehicleIds = all.map(v => v._id);

  allReservations = await Reservation.find({
    vehicleIds: { $in: ownerVehicleIds },
    approvalStatus: "approved"
  });
}// BOOKINGS LOOP ✅ KEEP SAME
allBookings.forEach((b) => {
  const amount = Number(
    b.totalAmount && b.totalAmount > 0
      ? b.totalAmount
      : b.payment?.amount || 0
  );

  const isPaid =
    (b.payment?.method === "razorpay" && b.payment?.status === "Paid") ||
    (b.payment?.method === "pickup" && b.payment?.status === "Paid");

  if (isPaid) {
    fullTotalEarning += amount;
  }
});

// RESERVATIONS LOOP ✅ KEEP SAME
allReservations.forEach((r) => {
  const amount = Number(
    r.totalAmount && r.totalAmount > 0
      ? r.totalAmount
      : r.payment?.amount || 0
  );

  const isPaid =
    (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
    (r.payment?.method === "pickup" && r.payment?.status === "Paid");

  if (isPaid) {
    fullTotalEarning += amount;
  }
});
res.json({
  totalVehicles: all.length,
  totalReservations,   // ✅ ADD
  
  inRental,
  upcoming,
  revenueGrowth,       // ✅ ADD
  bookingGrowth,
  reservationGrowth, 
  totalRevenue: fullTotalEarning,
weeklyRevenue: currentRevenue,
previousRevenue: prevRevenue,

  formattedTotal: formatINR(fullTotalEarning),
formattedWeekly: formatINR(currentRevenue),
formattedPrevWeekly: formatINR(prevRevenue),
bookingCount,
reservationCount,
        // ✅ ADD
  latestVehicle
});
// 🔥 FINAL TOTAL (BOOKING + RESERVATION)

  } catch (err) {
    res.status(500).json({ message: "Owner dashboard error" });
  }
});

/* ================= TOP CUSTOMERS ================= */
router.get("/top-customers", firebaseAuth, async (req, res) => {
  try {
 const ownerId = req.user.mongoId;

let bookings;

if (req.user.role === "admin") {
  bookings = await Booking.find({
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
} else {
  bookings = await Booking.find({
    ownerId: ownerId,
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
}

// 🔥 GET OWNER VEHICLES
let ownerVehicleIds;

if (req.user.role === "admin") {
  ownerVehicleIds = await Vehicle.find().distinct("_id");
} else {
  ownerVehicleIds = await Vehicle.find({ owner: ownerId }).distinct("_id");
}

// 🔥 GET RESERVATIONS
const reservations = await Reservation.find({
  vehicleIds: { $in: ownerVehicleIds },
  approvalStatus: "approved",
  "payment.status": "Paid"
});

    const map = {};

 // BOOKINGS
bookings.forEach((b) => {
if (!map[b.userId]) {
  map[b.userId] = { booking: 0, reservation: 0 };
}
map[b.userId].booking++;
});

// RESERVATIONS
reservations.forEach((r) => {
  const uid = r.customerId?.toString();
  if (!uid) return;

if (!map[uid]) {
  map[uid] = { booking: 0, reservation: 0 };
}
map[uid].reservation++;
});

let users = Object.keys(map).map(uid => ({
  userId: uid,
  bookingCount: map[uid].booking,
  reservationCount: map[uid].reservation,
  total: map[uid].booking + map[uid].reservation
}));
    users.sort((a, b) => b.total - a.total);
    users = users.slice(0, 6);

const final = await Promise.all(
  users.map(async (u) => {

    let name = "User";
    let image = "";

    // ✅ TRY BOOKING USER (firebase UID)
    const profile = await Profile.findOne({
      firebaseUid: u.userId
    });

    if (profile) {
      name = profile.name;
      image = profile.profileImage;
    } else {
      // ✅ RESERVATION USER (Mongo ID)
      const user = await User.findById(u.userId);

      if (user) {
        const profile2 = await Profile.findOne({
          firebaseUid: user.firebaseUid
        });

        name = profile2?.name || user.name || "User";
        image = profile2?.profileImage || "";
      }
    }

    return {
      name,
      image,
      bookingCount: u.bookingCount,
      reservationCount: u.reservationCount,
      total: u.total
    };
  })
);
    res.json(final);

  } catch (err) {
  console.error("ERROR 👉", err);
    res.status(500).json({ message: "Customers error" });
  }
});

/* ================= WEEKLY INCOME ================= */
router.get("/weekly-income", firebaseAuth, async (req, res) => {
  try {
    const { range } = req.query;
const ownerId = req.user.mongoId;

   
    const now = new Date();

    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    if (range === "lastWeek") {
      start.setDate(start.getDate() - 7);
    }

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

 let bookings;

if (req.user.role === "admin") {
  bookings = await Booking.find({
    createdAt: { $gte: start, $lt: end },
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
} else {
  bookings = await Booking.find({
    ownerId: ownerId,
    createdAt: { $gte: start, $lt: end },
    isDeleted: { $ne: true },
    status: { $nin: ["Cancelled", "Rejected"] }
  });
}
// 🔥 GET RESERVATIONS
let ownerVehicleIds;

if (req.user.role === "admin") {
  ownerVehicleIds = await Vehicle.find().distinct("_id");
} else {
  ownerVehicleIds = await Vehicle.find({ owner: ownerId }).distinct("_id");
}

const reservations = await Reservation.find({
  vehicleIds: { $in: ownerVehicleIds },
  createdAt: { $gte: start, $lt: end },
  approvalStatus: "approved",
  "payment.status": "Paid"
});

    const result = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        name: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        income: 0,
      };
    });
// ================= BOOKINGS =================
bookings.forEach((b) => {
  const diff = Math.floor(
    (new Date(b.createdAt) - start) / (1000 * 60 * 60 * 24)
  );

  const isPaid =
    (b.payment?.method === "razorpay" && b.payment?.status === "Paid") ||
    (b.payment?.method === "pickup" && b.payment?.status === "Paid");

  if (!isPaid) return;

  if (diff >= 0 && diff < 7) {
    result[diff].income += Number(
      b.totalAmount && b.totalAmount > 0
        ? b.totalAmount
        : b.payment?.amount || 0
    );
  }
});


// ================= RESERVATIONS =================
reservations.forEach((r) => {
  const diff = Math.floor(
    (new Date(r.createdAt) - start) / (1000 * 60 * 60 * 24)
  );

  const isPaid =
    (r.payment?.method === "razorpay" && r.payment?.status === "Paid") ||
    (r.payment?.method === "pickup" && r.payment?.status === "Paid");

  if (!isPaid) return;

  if (diff >= 0 && diff < 7) {
    result[diff].income += Number(
      r.totalAmount && r.totalAmount > 0
        ? r.totalAmount
        : r.payment?.amount || 0
    );
  }
});
    res.json(result);

  } catch (err) {
  console.error("ERROR 👉", err);
    res.status(500).json({ message: "Weekly error" });
  }
});

/* ================= RECENT BOOKINGS ================= */
router.get("/recent-bookings", firebaseAuth, async (req, res) => {
  try {
const ownerId = req.user.mongoId;

let bookings;

if (req.user.role === "admin") {
  bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(7);
} else {
  bookings = await Booking.find({
    ownerId: ownerId
  })
    .sort({ createdAt: -1 })
    .limit(7);
}

// 🔥 GET OWNER VEHICLES
let ownerVehicleIds;

if (req.user.role === "admin") {
  ownerVehicleIds = await Vehicle.find().distinct("_id");
} else {
  ownerVehicleIds = await Vehicle.find({ owner: ownerId }).distinct("_id");
}
// 🔥 GET RESERVATIONS
const reservations = await Reservation.find({
  vehicleIds: { $in: ownerVehicleIds },
  approvalStatus: "approved",
  "payment.status": "Paid"
})
.sort({ createdAt: -1 })
.limit(7);

// 🔥 BOOKINGS
const bookingData = await Promise.all(
  bookings.map(async (b) => {
    const listing =
      b.listingType === "Vehicle"
        ? await Vehicle.findById(b.listingId)
        : await Bike.findById(b.listingId);

    const user = await Profile.findOne({
      firebaseUid: b.userId
    });
const now = new Date();
const pickup = new Date(b.pickupDate);
const drop = new Date(b.returnDate);

let status = "Completed";

if (b.status === "Cancelled") status = "Cancelled";
else if (b.status === "Rejected") status = "Rejected";
else if (now < pickup) status = "Upcoming";
else if (now >= pickup && now <= drop) status = "In Progress";

    return {
      _id: b._id,
      type: "booking", // 🔥 IMPORTANT
      vehicleName: listing?.name,
      vehicleImage: listing?.imageUrl,
      vehicleModel: listing?.model,
      addedBy: listing?.addedBy,
      userName: user?.name,
      userImage: user?.profileImage,
      amount: b.totalAmount || b.payment?.amount || 0,
      date: b.createdAt,
      status
    };
  })
);

// 🔥 RESERVATIONS
const reservationData = await Promise.all(
  reservations.map(async (r) => {

    const vehicle = await Vehicle.findById(r.vehicleIds?.[0]);

    const user = await User.findById(r.customerId);
    const profile = await Profile.findOne({
      firebaseUid: user?.firebaseUid
    });

    const now = new Date();
const start = new Date(r.startDate);
const end = new Date(r.endDate);
let status = "Completed";

// ❌ CANCEL / REJECT
if (r.approvalStatus === "rejected") status = "Rejected";
else if (r.status === "cancelled") status = "Cancelled";

// ✅ APPROVED FLOW
else if (now < start) status = "Upcoming";
else if (now >= start && now <= end) status = "In Progress";

return {
  _id: r._id,
  type: "reservation",
  vehicleName: vehicle?.name,
  vehicleImage: vehicle?.imageUrl,
  vehicleModel: vehicle?.model,
  addedBy: vehicle?.addedBy,
  userName: profile?.name || user?.name,
  userImage: profile?.profileImage,
  amount: r.totalAmount || r.payment?.amount || 0,
  date: r.createdAt,
  status
};
  })
);

// 🔥 MERGE BOTH
const final = [...bookingData, ...reservationData]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 7);

res.json(final);

  } catch (err) {
  console.error("ERROR 👉", err);
    res.status(500).json({ message: "Recent bookings error" });
  }
});

module.exports = router;