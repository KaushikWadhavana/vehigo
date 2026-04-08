const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Review = require("../models/reviewSchema");
const Profile = require("../models/Profile");
const Booking = require("../models/Booking");
const Reservation = require("../models/Reservation"); // ✅ ADD

/* ================= GET VEHICLE / BIKE DETAIL ================= */

exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // ================= FIND LISTING =================
let listing = await Vehicle.findOne({
  _id: id,
  status: "approved",
  isActive: true
})
      .populate("owner")
      .lean();

    let type = "Vehicle";

    if (!listing) {
    listing = await Bike.findOne({
  _id: id,
  status: "approved",
  isActive: true
})
        .populate("owner")
        .lean();
      type = "Bike";
    }

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // ================= SAFE OWNER DEFAULT =================
    let ownerData = {
      name: "Owner",
      email: "",
      phone: "",
      profileImage: "",
      address: "",
      avgRating: 0,
    };

    if (listing.owner) {
      const ownerId = listing.owner._id;

      // GET PROFILE
      let profile = null;
      if (listing.owner.firebaseUid) {
        profile = await Profile.findOne({
          firebaseUid: listing.owner.firebaseUid,
        }).lean();
      }

      // GET OWNER ALL LISTINGS
      const ownerVehicles = await Vehicle.find({ owner: ownerId }).select("_id");
      const ownerBikes = await Bike.find({ owner: ownerId }).select("_id");

      const ownerListingIds = [
        ...ownerVehicles.map((v) => v._id),
        ...ownerBikes.map((b) => b._id),
      ];

      // GET OWNER REVIEWS
      const ownerReviews = await Review.find({
        vehicleId: { $in: ownerListingIds },
      });

      const ownerAvgRating =
        ownerReviews.length > 0
          ? Number(
              (
                ownerReviews.reduce((sum, r) => sum + r.rating, 0) /
                ownerReviews.length
              ).toFixed(1)
            )
          : 0;
ownerData = {
  name: profile?.name || listing.owner.name,
  email: profile?.email || listing.owner.email,
  phone: profile?.phone || listing.owner.phone,

  // ✅ IMAGE FIX
  profileImage:
    profile?.profileImage ||
    listing.owner?.photoURL ||
    "",

  addressLine: profile?.addressLine || "",
  city: profile?.city || "",
  state: profile?.state || "",
  country: profile?.country || "",
  avgRating: ownerAvgRating,
};
    }

    // ================= VEHICLE REVIEWS =================
    const reviews = await Review.find({
      vehicleId: id,
      vehicleType: type,
    }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const calculateAverage = (field) =>
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + (r[field] || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    const avgRating = calculateAverage("rating");

    /* ================= BOOKING COUNT ================= */
// ✅ CHECK RESERVATION CONFLICT
const reservationConflict = await Reservation.findOne({
  vehicleIds: id,
  approvalStatus: "approved",
  $or: [
    { "payment.status": "Paid" },
    { "payment.method": "pickup" }
  ],
  endDate: { $gt: new Date() }
});

const bookingCount = await Booking.countDocuments({
  listingId: id,
  status: { $in: ["Confirmed", "Pending"] }
});
/* ================= BOOKED DATE & TIME ================= */
const bookedSlots = await Booking.find({
  listingId: id,
  status: { $in: ["Confirmed", "Pending"] },

  // only future bookings
  returnDate: { $gt: new Date() }

})
.select("pickupDate returnDate pickupTime returnTime")
.sort({ pickupDate: 1 })
.lean();
// ✅ RESERVATION SLOTS
const reservedSlots = await Reservation.find({
  vehicleIds: id,
  approvalStatus: "approved",
  $or: [
    { "payment.status": "Paid" },
    { "payment.method": "pickup" }
  ],
  endDate: { $gt: new Date() }
})
.select("startDate endDate startTime endTime")
.sort({ startDate: 1 })
.lean();
    // ================= FINAL RESPONSE =================
res.json({
  ...listing,
  type,
  isReserved: !!reservationConflict,
  owner: ownerData,
  reviews,
  totalReviews,
  avgRating,
  bookingCount,
  bookedSlots,
  reservedSlots
});


  } catch (err) {
    console.error("DETAIL ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};


/* ================= ADD REVIEW ================= */

exports.addReview = async (req, res) => {
  try {
const {
  vehicleId,
  vehicleType,
  fullName,
  email,
  profileImage,
  userId,
  ownerId,
  addedBy,
  service,
  location,
  value,
  facilities,
  cleanliness,
  comment,
} = req.body;
    if (!vehicleId || !vehicleType) {
      return res.status(400).json({ message: "Missing vehicle info" });
    }

    if (!fullName || !email || !comment) {
      return res.status(400).json({ message: "Missing basic fields" });
    }

    if (
      service === undefined ||
      location === undefined ||
      value === undefined ||
      facilities === undefined ||
      cleanliness === undefined
    ) {
      return res.status(400).json({ message: "Rating fields missing" });
    }

    const overall =
      (
        Number(service) +
        Number(location) +
        Number(value) +
        Number(facilities) +
        Number(cleanliness)
      ) / 5;

const review = await Review.create({
  vehicleId,
  vehicleType,
  fullName,
  email,
  profileImage,
  userId,
  ownerId,
  addedBy,
  service: Number(service),
  location: Number(location),
  value: Number(value),
  facilities: Number(facilities),
  cleanliness: Number(cleanliness),
  rating: Number(overall.toFixed(1)),
  comment,
});

    res.status(201).json(review);
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Review failed" });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { reviewId, message, userId, name, email, profileImage } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.replies.push({
      userId,
      name,
      email,
      profileImage,
      message,
    });

    // ✅ FIX HERE
    await review.save({ validateBeforeSave: false });

    res.json(review);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply failed" });
  }
};
/* ================= CHECK AVAILABILITY ================= */
exports.checkAvailability = async (req, res) => {
  try {

    const { listingId, pickupDate, returnDate } = req.body;

    const requestedStart = new Date(pickupDate);
    const requestedEnd = new Date(returnDate);

    if (requestedEnd <= requestedStart) {
      return res.status(400).json({
        available: false,
        message: "Invalid booking time"
      });
    }

// ✅ BOOKING CHECK
const overlappingBooking = await Booking.findOne({
  listingId,
  status: { $in: ["Confirmed", "Pending"] },
  pickupDate: { $lt: requestedEnd },
  returnDate: { $gt: requestedStart }
});

if (overlappingBooking) {
  return res.json({
    available: false,
    message: "Vehicle already booked in this time slot"
  });
}

// ✅ ADD THIS BELOW 👇 (YOUR NEW CODE)
const overlappingReservation = await Reservation.findOne({
  vehicleIds: listingId,
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
  startDate: { $lt: requestedEnd },
  endDate: { $gt: requestedStart }
});

if (overlappingReservation) {
  return res.json({
    available: false,
    message: "Vehicle already reserved in this time slot"
  });
}
    res.json({
      available: true
    });

  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
