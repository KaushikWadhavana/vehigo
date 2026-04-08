const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");

const Profile = require("../models/Profile"); // 🔥 ADD THIS TOP

const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Booking = require("../models/Booking");
const Reservation = require("../models/Reservation");

router.get("/", firebaseAuth, async (req, res) => {
  try {

    if (req.user.role !== "admin") {
  return res.status(403).json({ message: "Admin only" });
}

    const vehicles = await Vehicle.find();
    const bikes = await Bike.find();

const bookings = await Booking.find({
  isDeleted: { $ne: true },
  status: { $nin: ["Cancelled", "Rejected"] }
});

    const reservations = await Reservation.find();

    let inRental = 0;
    let upcoming = 0;
    let totalRevenue = 0;

const now = new Date();

bookings.forEach((b) => {
  if (b.status === "Cancelled" || b.status === "Rejected") return;

  totalRevenue += b.payment?.amount || b.totalAmount || 0;

  const pickup = new Date(b.pickupDate);   // ✅ FIX
  const drop = new Date(b.returnDate);

  if (now >= pickup && now <= drop) {
    inRental++; // 🔥 currently running
  } 
  else if (now < pickup) {
    upcoming++; // 🔥 future booking
  }
});
    /* ================= TOTAL RESERVATIONS ================= */
    const totalReservations = reservations.filter(
      (r) => r.status !== "rejected"
    ).length;

    /* ================= WEEKLY GROWTH ================= */
const today = new Date();

// 👉 get Monday of current week
const startOfWeek = new Date(today);
const day = startOfWeek.getDay();
const diff = day === 0 ? -6 : 1 - day;
startOfWeek.setDate(startOfWeek.getDate() + diff);
startOfWeek.setHours(0, 0, 0, 0);

// 👉 last week (Mon-Sun)
const lastWeek = new Date(startOfWeek);
lastWeek.setDate(startOfWeek.getDate() - 7);

// 👉 previous week
const prevWeek = new Date(startOfWeek);
prevWeek.setDate(startOfWeek.getDate() - 14);
const currentWeekBookings = bookings.filter(
  (b) =>
    new Date(b.createdAt) >= startOfWeek &&
    new Date(b.createdAt) <
      new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
);

const prevWeekBookings = bookings.filter(
  (b) =>
    new Date(b.createdAt) >= lastWeek &&
    new Date(b.createdAt) < startOfWeek
);
    const currentRevenue = currentWeekBookings.reduce(
      (sum, b) => sum + (b.payment?.amount || b.totalAmount || 0),
      0
    );

    const prevRevenue = prevWeekBookings.reduce(
      (sum, b) => sum + (b.payment?.amount || b.totalAmount || 0),
      0
    );

// ================= REVENUE GROWTH =================
let revenueGrowth;

if (prevRevenue === 0) {
  revenueGrowth = currentRevenue > 0 ? 100 : 0;
} else {
  revenueGrowth =
    ((currentRevenue - prevRevenue) / prevRevenue) * 100;
}

// ================= BOOKING GROWTH =================
// ================= RESERVATION GROWTH =================

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 7);

const currentWeekReservations = reservations.filter(
  (r) =>
    new Date(r.createdAt) >= startOfWeek &&
    new Date(r.createdAt) < endOfWeek
);

const prevWeekReservations = reservations.filter(
  (r) =>
    new Date(r.createdAt) >= lastWeek &&
    new Date(r.createdAt) < startOfWeek
);

let bookingGrowth;

if (prevWeekReservations.length === 0) {
  bookingGrowth =
    currentWeekReservations.length > 0 ? 100 : 0;
} else {
  bookingGrowth =
    ((currentWeekReservations.length - prevWeekReservations.length) /
      prevWeekReservations.length) *
    100;
}
    // ✅ LIMIT BETWEEN -100 to 100
    revenueGrowth = Math.max(-100, Math.min(100, revenueGrowth));
    bookingGrowth = Math.max(-100, Math.min(100, bookingGrowth));

    /* ================= LATEST VEHICLE ================= */
    const allVehicles = [...vehicles, ...bikes].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      totalVehicles: vehicles.length + bikes.length,
      totalReservations,
      totalRevenue,
      inRental,
      upcoming,
      revenueGrowth,
      bookingGrowth,
      latestVehicle: allVehicles[0] || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

// ================= WEEKLY INCOME vs EXPENSE =================
router.get("/analytics/weekly-income-expense", firebaseAuth, async (req, res) => {
  try {
    const { range } = req.query;

    const now = new Date();

    // ✅ GET MONDAY OF CURRENT WEEK
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    let start = new Date(startOfWeek);
    let end = new Date(startOfWeek);
    end.setDate(start.getDate() + 7);

    // ✅ LAST WEEK SHIFT
    if (range === "lastWeek") {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 7);
    }

    // ✅ USE pickupDate (IMPORTANT)
    const bookings = await Booking.find({
createdAt: { $gte: start, $lt: end },
      isDeleted: { $ne: true },
      status: { $nin: ["Cancelled", "Rejected"] }
    });

    // ✅ CREATE FULL 7 DAYS (SORTED)
    const result = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        date: new Date(d), // for sorting
        name: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        income: 0,
        expense: 0,
      };
    });

    // ✅ MAP BOOKINGS INTO DAYS
    bookings.forEach((b) => {
      const diff = Math.floor(
        (new Date(b.createdAt) - start) / (1000 * 60 * 60 * 24)
      );

      if (diff >= 0 && diff < 7) {
        const amount = b.payment?.amount || b.totalAmount || 0;

        result[diff].income += amount;

        const expense =
          (b.taxAmount || 0) +
          (b.deliveryCharge || 0) +
          (b.extras?.reduce((s, e) => s + (e.price || 0), 0) || 0);

        result[diff].expense += expense;
      }
    });

    // ✅ SORT SAFETY (always left → right)
    result.sort((a, b) => a.date - b.date);

    // ❌ REMOVE date before sending
    const final = result.map(({ date, ...rest }) => rest);

    res.json(final);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Weekly analytics failed" });
  }
});

router.get("/analytics/top-customers", firebaseAuth, async (req, res) => {
  try {

    // 🔥 STEP 1: GET BOOKINGS
    const bookings = await Booking.find({
      isDeleted: { $ne: true },
      status: { $nin: ["Cancelled", "Rejected"] }
    });

    // 🔥 STEP 2: COUNT BOOKINGS PER USER
    const map = {};

    bookings.forEach((b) => {
      if (!map[b.userId]) {
        map[b.userId] = 0;
      }
      map[b.userId]++;
    });

    // 🔥 STEP 3: CONVERT TO ARRAY
    let users = Object.keys(map).map((uid) => ({
      userId: uid,
      bookings: map[uid]
    }));

    // 🔥 STEP 4: SORT + LIMIT
    users.sort((a, b) => b.bookings - a.bookings);
    users = users.slice(0, 6);

    // 🔥 STEP 5: GET PROFILE (SAME AS YOUR OTHER ROUTES)
    const final = await Promise.all(
      users.map(async (u) => {

        const profile = await Profile.findOne({
          firebaseUid: u.userId
        }).lean();

        return {
          name: profile?.name || "Unknown User",
          image: profile?.profileImage || "",
          bookings: u.bookings
        };
      })
    );

    res.json(final);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Customers failed" });
  }
});

// ================= RECENT BOOKINGS =================
router.get("/analytics/recent-bookings", firebaseAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(7);

    const final = await Promise.all(
      bookings.map(async (b) => {
        let listingData = null;
        let userProfile = null;

        if (b.listingType === "Vehicle") {
          listingData = await Vehicle.findById(b.listingId).lean();
        } else {
          listingData = await Bike.findById(b.listingId).lean();
        }

        userProfile = await Profile.findOne({
          firebaseUid: b.userId,
        }).lean();

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
  vehicleName: listingData?.name || "Vehicle",
  vehicleImage: listingData?.imageUrl || "",
  vehicleModel: listingData?.model || "",
  addedBy: listingData?.addedBy || "admin", // ✅ ADD THIS
  userName: userProfile?.name || "User",
  userImage: userProfile?.profileImage || "",
  amount: b.payment?.amount || 0,
  date: b.createdAt,
  status,
};
      })
    );

    res.json(final);
  } catch (err) {
    res.status(500).json({ message: "Recent bookings failed" });
  }
});

module.exports = router;