const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { createBooking } = require("../controllers/bookingController");
const firebaseAuth = require("../middleware/firebaseAuth");
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User"); // 🔥 ADD THIS

router.post(
  "/",
  firebaseAuth,
  upload.fields([
    { name: "driverPhoto", maxCount: 1 }
  ]),
  createBooking
);


router.get("/analytics/monthly-bookings", firebaseAuth, async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
  $match: {
  isDeleted: { $ne: true },
  status: { $nin: ["Cancelled", "Rejected"] },
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
}
      },
      {
        $group: {
          _id: { $month: "$createdAt" },

          bookings: { $sum: 1 },

          // ✅ IMPORTANT: handle null safely
 amount: {
  $sum: {
    $ifNull: ["$totalAmount", 0]
  }
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
        amount: found ? found.amount : 0 // ✅ MUST EXIST
      };
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Monthly analytics failed" });
  }
});
router.get("/analytics/top-vehicles", firebaseAuth, async (req, res) => {
  try {
const data = await Booking.aggregate([
  {
    $match: {
      isDeleted: { $ne: true },

      // ✅ REMOVE BAD BOOKINGS
      status: { $nin: ["Cancelled", "Rejected"] }
    }
  },

  {
    $group: {
      _id: "$listingId",
      total: { $sum: 1 }
    }
  },

  // ❌ REMOVE LIMIT (VERY IMPORTANT → SHOW ALL IN GRAPH)
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
    $lookup: {
      from: "bikes",
      localField: "_id",
      foreignField: "_id",
      as: "bike"
    }
  },

  {
    $project: {
      name: {
        $ifNull: [
          { $arrayElemAt: ["$vehicle.name", 0] },
          { $arrayElemAt: ["$bike.name", 0] }
        ]
      },

      addedBy: {
        $ifNull: [
          { $arrayElemAt: ["$vehicle.addedBy", 0] },
          { $arrayElemAt: ["$bike.addedBy", 0] }
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

// 🔥 ADMIN - GET ALL RENTALS (ADMIN + OWNER)
router.get("/admin-rentals", firebaseAuth, async (req, res) => {
  try {

    const bookings = await Booking.find({
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

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

        return {
          _id: b._id,

          vehicleName: listingData?.name || "Unknown",
          vehicleModel: listingData?.model || "",
addedBy: listingData?.addedBy || "admin",
          vehicleImage: listingData?.imageUrl || "",

          userName: userProfile?.name || "No Name",
          userImage: userProfile?.profileImage || "",

          amount: Number(
  b.totalAmount && b.totalAmount > 0
    ? b.totalAmount
    : b.payment?.amount || 0
),
          method: b.payment?.method || "pickup",
          paymentStatus: b.payment?.status || "Pending",

          // 🔥 BOOKING STATUS (DYNAMIC)
          bookingStatus: (() => {
    if (b.status === "Cancelled") return "Cancelled";
if (b.status === "Rejected") return "Rejected"; // ✅ ADD THIS
            const now = new Date();
            const pickup = new Date(b.pickupDate);
            const drop = new Date(b.returnDate);

            if (now < pickup) return "Upcoming";
            if (now >= pickup && now <= drop) return "In Progress";
            return "Completed";
          })(),

          date: b.createdAt,
        };
      })
    );

    res.json(final);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch rentals" });
  }
});
// 🔥 ADMIN - GET ALL PAYMENTS
router.get("/admin-payments", firebaseAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const final = await Promise.all(
      bookings.map(async (b) => {
        let listingData = null;
        let userProfile = null;

        try {
          if (b.listingType === "Vehicle") {
            listingData = await Vehicle.findById(b.listingId).lean();
          } else {
            listingData = await Bike.findById(b.listingId).lean();
          }

          userProfile = await Profile.findOne({
            firebaseUid: b.userId,
          }).lean();
        } catch (err) {}

        return {
          transactionId: b.payment?.transactions?.[0]?.razorpay_payment_id || `TX${b.bookingId}`,
          name: userProfile?.name || "Unknown",
          image: userProfile?.profileImage || "",
          amount: b.payment?.amount || 0,
          method: b.payment?.method || "pickup",
          date: b.createdAt,
          status: b.payment?.status || "Pending",
        };
      })
    );

    res.json(final);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.get("/my-bookings", firebaseAuth, async (req, res) => {
    try {
    const bookings = await Booking.find({
      userId: req.user.uid,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

const finalBookings = await Promise.all(
  bookings.map(async (b) => {
    let listingData = null;
    let userProfile = null;

    try {
      // 🔹 GET VEHICLE / BIKE
      if (b.listingType === "Vehicle") {
        listingData = await Vehicle.findById(b.listingId).lean();
      } else if (b.listingType === "Bike") {
        listingData = await Bike.findById(b.listingId).lean();
      }

      // 🔹 GET USER PROFILE (VERY IMPORTANT)
      userProfile = await Profile.findOne({
        firebaseUid: b.userId,
      }).lean();

    } catch (err) {
      console.log("Error fetching:", err);
    }

    return {
      ...b._doc,
status: b.status || null,
      // ✅ VEHICLE DATA
      name: listingData?.name || "Unknown",
      image: listingData?.imageUrl || "",
      mainLocation: listingData?.mainLocation || "No location",
  payment: {
    method: b.payment?.method || "pickup",
    status: b.payment?.status || "Pending",
    amount: b.payment?.amount || 0,
    transactions: b.payment?.transactions || []
  },
      // ✅ USER DATA (REAL)
      userName: userProfile?.name || "No Name",
      userEmail: userProfile?.email || "",
      userPhone: userProfile?.phone || "",

      userAddress: [
        userProfile?.addressLine,
        userProfile?.city,
        userProfile?.state,
        userProfile?.country,
        userProfile?.pinCode,
      ]
        .filter(Boolean)
        .join(", "),
    };
  })
);

    res.json(finalBookings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.put("/cancel/:id", firebaseAuth, async (req, res) => {

  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
if (booking.userId !== req.user?.uid) {
  return res.status(403).json({ message: "Unauthorized" });
}
    booking.status = "Cancelled";

// 🔥 ADD THIS
if (booking.payment?.method === "razorpay") {
  booking.payment.status = "Refunded";
}

    await booking.save();

    res.json({ message: "Booking cancelled" });

  } catch (err) {

    res.status(500).json({ message: "Cancel failed" });

  }

});


// 🔥 OWNER - GET USER BOOKINGS (who booked my vehicles)
router.get("/owner-bookings", firebaseAuth, async (req, res) => {
  try {
    // 🔥 STEP 1: get owner profile (to get Mongo _id)

// 🔥 get user (NOT profile)
const user = await User.findOne({
  firebaseUid: req.user.uid,
});

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

// 🔥 match using User._id (CORRECT)
// 🔥 VEHICLES
const vehicles = await Vehicle.find({
  owner: user._id,
}).select("_id");

// 🔥 BIKES
const bikes = await Bike.find({
  owner: user._id,
}).select("_id");

// 🔥 MERGE BOTH
const listingIds = [
  ...vehicles.map(v => v._id),
  ...bikes.map(b => b._id),
];
    // 🔥 STEP 3: get bookings for those vehicles
const bookings = await Booking.find({
  listingId: { $in: listingIds },
  isDeleted: { $ne: true }, // 🔥 ADD THIS
}).sort({ createdAt: -1 });

    // 🔥 STEP 4: format data
    const finalBookings = await Promise.all(
      bookings.map(async (b) => {
        let listingData = null;
        let userProfile = null;

        try {
          if (b.listingType === "Vehicle") {
            listingData = await Vehicle.findById(b.listingId).lean();
          } else {
            listingData = await Bike.findById(b.listingId).lean();
          }

          userProfile = await Profile.findOne({
            firebaseUid: b.userId,
          }).lean();

        } catch (err) {
          console.log("Fetch error:", err);
        }

        return {
          ...b._doc,

          vehicleName: listingData?.name || "Unknown",
          vehicleImage: listingData?.imageUrl || "",
          location: listingData?.mainLocation || "",

          userName: userProfile?.name || "No Name",
          userImage: userProfile?.profileImage || "",
          userEmail: userProfile?.email || "",
          userPhone: userProfile?.phone || "",

          payment: {
            method: b.payment?.method || "pickup",
            status: b.payment?.status || "Pending",
            amount: b.payment?.amount || 0,
          },
// 🔥 ADD FULL SCHEMA DATA (NO CHANGE, ONLY ADD)
driver: b.driver,
extras: b.extras,
billing: b.billing,
paymentFull: b.payment,   // keep existing payment also
planType: b.planType,
deliveryType: b.deliveryType,
pickupLocation: b.pickupLocation,
returnLocation: b.returnLocation,
pickupTime: b.pickupTime,
returnTime: b.returnTime,
basePrice: b.basePrice,
deliveryCharge: b.deliveryCharge,
taxAmount: b.taxAmount,
refundableDeposit: b.refundableDeposit,
totalAmount: b.totalAmount,
bookingId: b.bookingId,
          status: b.status,
          rejectReason: b.rejectReason || null, // ✅ ADD THIS
        };
      })
    );

    res.json(finalBookings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch owner bookings" });
  }
});

// 🔥 OWNER - GET USER PAYMENTS
router.get("/owner-payments", firebaseAuth, async (req, res) => {
  try {

    const user = await User.findOne({
      firebaseUid: req.user.uid,
    });

    const vehicles = await Vehicle.find({ owner: user._id }).select("_id");
    const bikes = await Bike.find({ owner: user._id }).select("_id");

    const listingIds = [
      ...vehicles.map(v => v._id),
      ...bikes.map(b => b._id),
    ];

    const bookings = await Booking.find({
      listingId: { $in: listingIds },
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

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
return {
  _id: b._id,

  vehicleName: listingData?.name || "Unknown",
  vehicleModel: listingData?.model || "",
  vehicleImage: listingData?.imageUrl || "",

  userName: userProfile?.name || "No Name",
  userImage: userProfile?.profileImage || "",

 amount: Number(
  b.totalAmount && b.totalAmount > 0
    ? b.totalAmount
    : b.payment?.amount || 0
),
  method: b.payment?.method || "pickup",

  // ✅ PAYMENT
  paymentStatus: b.payment?.status || "Pending",

  // ✅ BOOKING (THIS WAS MISSING)
bookingStatus: (() => {
if (b.status === "Cancelled") return "Cancelled";
if (b.status === "Rejected") return "Rejected"; // ✅ ADD THIS
  const now = new Date();
  const pickup = new Date(b.pickupDate);
  const drop = new Date(b.returnDate);

  if (now < pickup) return "Upcoming";
  if (now >= pickup && now <= drop) return "In Progress";
  return "Completed";
})(),
  date: b.createdAt,
};
      })
    );

    res.json(final);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch owner payments" });
  }
});


router.put("/owner-update/:id", firebaseAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ❌ BLOCK CANCELLED
    if (booking.status === "Cancelled") {
      return res.status(400).json({
        message: "Cancelled booking can't be updated",
      });
    }

    const {
      pickupLocation,
      returnLocation,
      pickupDate,
      returnDate,
      paymentMethod,
      paymentStatus,
      status,
      driver,
      billing,
      tollAmount,
    } = req.body;

    /* ================= BASIC ================= */
    if (pickupLocation) booking.pickupLocation = pickupLocation;
    if (returnLocation) booking.returnLocation = returnLocation;
    if (pickupDate) booking.pickupDate = pickupDate;
    if (returnDate) booking.returnDate = returnDate;

    /* ================= PAYMENT ================= */
    if (paymentMethod) booking.payment.method = paymentMethod;

    if (tollAmount !== undefined) {
  booking.tollAmount = Number(tollAmount);

  // ✅ RECALCULATE TOTAL
  const extrasTotal =
    booking.extras?.reduce((sum, e) => sum + (e.price || 0), 0) || 0;

  booking.totalAmount =
    booking.basePrice +
    booking.deliveryCharge +
    booking.taxAmount +
    booking.refundableDeposit +
    extrasTotal +
    booking.tollAmount;
}
    // 🔥 IMPORTANT RULE
    if (booking.payment.method === "pickup" && paymentStatus) {
      booking.payment.status = paymentStatus; // allow Paid
    }

    /* ================= STATUS ================= */
    if (status) {
      booking.status = status;
    }

    /* ================= DRIVER ================= */
    if (driver) {
      booking.driver = {
        ...booking.driver,
        ...driver,
      };
    }

    /* ================= BILLING ================= */
    if (billing) {
      booking.billing = {
        ...booking.billing,
        ...billing,
      };
    }

    await booking.save();

    res.json({
      message: "Booking updated successfully",
      booking,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// 🔥 OWNER ACTION CONTROL
// 🔥 OWNER ACTION CONTROL
router.put("/owner-action/:id", firebaseAuth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Not found" });

    const now = new Date();
    const pickup = new Date(booking.pickupDate);
    const drop = new Date(booking.returnDate);

    // 🔥 DETERMINE REAL STATUS
    let currentStatus = "Upcoming";

    if (booking.status === "Cancelled") currentStatus = "Cancelled";
    else if (booking.status === "Rejected") currentStatus = "Rejected";
    else if (now >= pickup && now <= drop) currentStatus = "In Progress";
    else if (now > drop) currentStatus = "Completed";

    // ================= CANCEL =================
    if (action === "cancel") {

      if (currentStatus !== "Upcoming") {
        return res.status(400).json({
          message: "Only upcoming bookings can be cancelled",
        });
      }

      booking.status = "Cancelled";

      // 🔥 REFUND
      if (booking.payment?.method === "razorpay") {
        booking.payment.status = "Refunded";
      }
    }

    // ================= REJECT =================
    if (action === "reject") {

      if (currentStatus !== "Upcoming") {
        return res.status(400).json({
          message: "Only upcoming bookings can be rejected",
        });
      }

      // ✅ VALIDATION
      if (!reason || typeof reason !== "string") {
        return res.status(400).json({
          message: "Reject reason is required",
        });
      }

      const trimmed = reason.trim();

      if (trimmed.length < 5) {
        return res.status(400).json({
          message: "Reason must be at least 5 characters",
        });
      }

      if (trimmed.length > 250) {
        return res.status(400).json({
          message: "Reason cannot exceed 250 characters",
        });
      }

      booking.status = "Rejected";
      booking.rejectReason = trimmed;

      // 🔥 REFUND
      if (booking.payment?.method === "razorpay") {
        booking.payment.status = "Refunded";
      }
    }

    // ================= COMPLETE =================
    if (action === "complete") {

      if (currentStatus !== "In Progress") {
        return res.status(400).json({
          message: "Only in-progress bookings can be completed",
        });
      }

      booking.status = "Completed";
    }

    // ================= START =================
    if (action === "start") {

      if (currentStatus !== "Upcoming") {
        return res.status(400).json({
          message: "Booking cannot be started",
        });
      }

      if (now < pickup) {
        return res.status(400).json({
          message: "Too early to start ride",
        });
      }

      booking.status = "Started";
    }
let extrasTotal = 0;

booking.extras.forEach((e) => {
  if (e.type === "per_day") {
    extrasTotal += e.price; // simplified
  } else {
    extrasTotal += e.price;
  }
});

booking.totalAmount =
  booking.basePrice +
  booking.deliveryCharge +
  booking.taxAmount +
  booking.refundableDeposit +
  extrasTotal +
  (booking.tollAmount || 0);

// 🔥 ALSO UPDATE PAYMENT
if (booking.payment) {
  booking.payment.amount = booking.totalAmount;
}
    await booking.save();

    res.json({
      message: "Action done",
      booking,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

router.delete("/delete/:id", firebaseAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Not found" });
    }

    booking.isDeleted = true; // 🔥 SOFT DELETE

    await booking.save();

    res.json({ message: "Booking hidden" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ADMIN BOOKINGS (same as owner but no owner filter)
router.get("/admin-bookings", firebaseAuth, async (req, res) => {
  try {

    // 🔥 GET ADMIN VEHICLES
    const vehicles = await Vehicle.find({ addedBy: "admin" }).select("_id");

    // 🔥 GET ADMIN BIKES
    const bikes = await Bike.find({ addedBy: "admin" }).select("_id");

    // 🔥 MERGE BOTH IDS
    const listingIds = [
      ...vehicles.map(v => v._id),
      ...bikes.map(b => b._id)
    ];

    // 🔥 GET BOOKINGS
 const bookings = await Booking.find({
  listingId: { $in: listingIds },
  isDeleted: { $ne: true }, // 🔥 ADD THIS
}).sort({ createdAt: -1 });

    // 🔥 FORMAT (SAME AS YOUR CODE)
    const finalBookings = await Promise.all(
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

        return {
          ...b._doc,

          vehicleName: listingData?.name || "Unknown",
          vehicleImage: listingData?.imageUrl || "",
          location: listingData?.mainLocation || "",

          userName: userProfile?.name || "No Name",
          userImage: userProfile?.profileImage || "",
          userEmail: userProfile?.email || "",
          userPhone: userProfile?.phone || "",

          payment: {
            method: b.payment?.method || "pickup",
            status: b.payment?.status || "Pending",
            amount: b.payment?.amount || 0,
          },

          driver: b.driver,
          extras: b.extras,
          billing: b.billing,
          paymentFull: b.payment,
          planType: b.planType,
          deliveryType: b.deliveryType,
          pickupLocation: b.pickupLocation,
          returnLocation: b.returnLocation,
          pickupDate: b.pickupDate,
          returnDate: b.returnDate,
          basePrice: b.basePrice,
          deliveryCharge: b.deliveryCharge,
          taxAmount: b.taxAmount,
          refundableDeposit: b.refundableDeposit,
          totalAmount: b.totalAmount,
          bookingId: b.bookingId,
          status: b.status,
          rejectReason: b.rejectReason || null, // ✅ ADD THIS
          userId: b.userId,
        };
      })
    );

    res.json(finalBookings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch admin bookings" });
  }
});
router.put("/admin-update/:id", firebaseAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Not found" });

    Object.assign(booking, req.body);
if (req.body.tollAmount !== undefined) {
  booking.tollAmount = Number(req.body.tollAmount);
}

// 🔥 RECALCULATE
let extrasTotal = 0;

booking.extras.forEach((e) => {
  extrasTotal += e.price || 0;
});

booking.totalAmount =
  booking.basePrice +
  booking.deliveryCharge +
  booking.taxAmount +
  booking.refundableDeposit +
  extrasTotal +
  (booking.tollAmount || 0);

if (booking.payment) {
  booking.payment.amount = booking.totalAmount;
}
    if (req.body.paymentStatus) {
      booking.payment.status = req.body.paymentStatus;
    }

    await booking.save();

    res.json({ message: "Updated", booking });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

router.delete("/admin-delete/:id", firebaseAuth, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;