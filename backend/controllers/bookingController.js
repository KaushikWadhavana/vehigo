const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Reservation = require("../models/Reservation"); // ✅ ADD
const uploadToCloudinary = require("../utils/uploadToCloudinary");
exports.createBooking = async (req, res) => {

  try {
   
const {
  listingId,
  listingType,
  deliveryType,
  pickupLocation,
  returnLocation,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  
    planType
} = req.body;

const driver = JSON.parse(req.body.driver || "{}");
const extras = JSON.parse(req.body.extras || "[]");
const billing = JSON.parse(req.body.billing || "{}");    // ================= BASIC VALIDATION =================
const payments = JSON.parse(req.body.payments || "[]");
const paymentMethod = req.body.paymentMethod || "pickup";

    if (!listingId || !listingType) {
      return res.status(400).json({ message: "Invalid listing" });
    }

    if (!pickupDate || !returnDate) {
      return res.status(400).json({ message: "Pickup and return dates required" });
    }

    if (!planType) {
      return res.status(400).json({ message: "Plan type required" });
    }
// ================= DRIVER VALIDATION =================
if (!driver) {
  return res.status(400).json({ message: "Driver details required" });
}

if (
  !driver.firstName ||
  !driver.lastName ||
  !driver.age ||
  !driver.mobile ||
  !driver.licenseNumber
) {
  return res.status(400).json({
    message: "Incomplete driver details",
  });
}

// ================= DRIVER FILE VALIDATION =================
const file = req.files?.driverPhoto?.[0];

if (!file) {
  return res.status(400).json({ message: "Driver license PDF required" });
}

if (file.mimetype !== "application/pdf") {
  return res.status(400).json({ message: "Only PDF allowed" });
}

let driverPhotoUrl = null;

if (req.files?.driverPhoto) {
  driverPhotoUrl = await uploadToCloudinary(
    req.files.driverPhoto[0],
    "driver-documents"
  );
}

driver.photo = driverPhotoUrl;
if (
  !billing.name ||
  !billing.email ||
  !billing.phone ||
  !billing.addressLine ||
  !billing.city ||
  !billing.country ||
  !billing.pinCode
) {
  return res.status(400).json({
    message: "Billing details incomplete",
  });
}
    // ================= FIND LISTING =================

    const Model = listingType === "Vehicle" ? Vehicle : Bike;
    const listing = await Model.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
// ================= VALIDATE EXTRAS =================
let validatedExtras = [];

if (listingType === "Vehicle" && extras.length > 0) {
  extras.forEach((selectedExtra) => {
    const exists = listing.extras.find(
      (e) => e.key === selectedExtra.key
    );

    if (exists) {
validatedExtras.push({
  key: exists.key,
  title: exists.title,
  price: exists.type === "dynamic" ? 0 : exists.price,
  type: exists.type,
});
    }
  });
}
    // ================= FULL DATE + TIME VALIDATION =================

if (!pickupTime || !returnTime) {
  return res.status(400).json({
    message: "Pickup and return time required",
  });
}

const startDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
const endDateTime = new Date(`${returnDate}T${returnTime}:00`);

if (endDateTime <= startDateTime) {
  return res.status(400).json({
    message: "Return date & time must be after pickup",
  });
}

const diffMs = endDateTime - startDateTime;
const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    // ================= LOCATION VALIDATION =================
// ================= MAX BOOKING LIMIT =================
if (diffDays > 365) {
  return res.status(400).json({
    message: "Maximum booking allowed is 1 year",
  });
}
    let finalPickupLocation = pickupLocation;
    let finalReturnLocation = returnLocation;

    if (deliveryType === "delivery") {
      if (!pickupLocation) {
        return res.status(400).json({
          message: "Delivery location required",
        });
      }

      if (!returnLocation) {
        return res.status(400).json({
          message: "Return location required",
        });
      }
    }

    if (deliveryType === "pickup") {
      // Force listing location
      finalPickupLocation = listing.mainLocation;
      finalReturnLocation = listing.mainLocation;
    }


// ================= PREVENT OVERLAPPING BOOKINGS =================

const existing = await Booking.findOne({
  listingId,
  status: { $in: ["Confirmed", "Pending"] },
  pickupDate: { $lt: endDateTime },
  returnDate: { $gt: startDateTime }
});
// ✅ CHECK RESERVATION ALSO
const reservationConflict = await Reservation.findOne({
  vehicleIds: listingId,
  approvalStatus: "approved",
  $or: [
    { "payment.status": "Paid" },
    { "payment.method": "pickup" }
  ],
  startDate: { $lt: endDateTime },
  endDate: { $gt: startDateTime }
});

if (reservationConflict) {
  return res.status(400).json({
    message: "Vehicle already reserved for selected dates"
  });
}
if (existing) {
  return res.status(400).json({
    message: "Vehicle already booked for selected dates"
  });
}
    // ================= PRICE CALCULATION =================

    let remainingDays = diffDays;
let basePrice = 0;

const daily = listing.pricing?.dailyPrice || 0;
const weekly = listing.pricing?.weeklyPrice || 0;
const monthly = listing.pricing?.monthlyPrice || 0;
const yearly = listing.pricing?.yearlyPrice || 0;

// YEAR
if (remainingDays >= 365 && yearly) {
  const years = Math.floor(remainingDays / 365);
  basePrice += years * yearly;
  remainingDays -= years * 365;
}

// MONTH
if (remainingDays >= 30 && monthly) {
  const months = Math.floor(remainingDays / 30);
  basePrice += months * monthly;
  remainingDays -= months * 30;
}

// WEEK
if (remainingDays >= 7 && weekly) {
  const weeks = Math.floor(remainingDays / 7);
  basePrice += weeks * weekly;
  remainingDays -= weeks * 7;
}

// DAY
if (remainingDays > 0 && daily) {
  basePrice += remainingDays * daily;
}

const deliveryCharge =
  deliveryType === "delivery" ? 200 : 0;

const taxAmount = Math.round(basePrice * 0.05);

const refundableDeposit = 1000;

// ================= EXTRAS PRICE =================
let extrasTotal = 0;

// ✅ CALCULATE EXTRAS FIRST
validatedExtras.forEach((extra) => {
  if (extra.type === "per_day") {
    extrasTotal += diffDays * extra.price;
  } else {
    extrasTotal += extra.price;
  }
});

// ✅ DEFAULT TOLL (USER SIDE)
const tollAmount = 0;

// ✅ FINAL TOTAL
const totalAmount =
  basePrice +
  deliveryCharge +
  taxAmount +
  refundableDeposit +
  extrasTotal +
  tollAmount;



    // ================= CREATE BOOKING =================
let paymentStatus = "Pending";
let bookingStatus = "Pending";

if (payments.length > 0) {
  paymentStatus = "Paid";
  bookingStatus = "Confirmed";
}
// 🔥 GENERATE UNIQUE BOOKING ID
const lastBooking = await Booking.findOne().sort({ bookingId: -1 });

let bookingId = 1000;

if (lastBooking && lastBooking.bookingId) {
  bookingId = lastBooking.bookingId + 1;
}

const booking = await Booking.create({
  listingId,
  listingType,
  userId: req.user.uid,
  ownerId: listing.owner,
  bookingId,

  planType,
  deliveryType,

  pickupLocation: finalPickupLocation,
  returnLocation: finalReturnLocation,

  pickupDate: startDateTime,
  returnDate: endDateTime,
  pickupTime,
  returnTime,

  basePrice,
  deliveryCharge,
  taxAmount,
  refundableDeposit,
  totalAmount,
  tollAmount, // 🔥 ADD

  driver,
  extras: validatedExtras,
  billing,

payment: {
  method: paymentMethod,   // ✅ ADD THIS LINE
  transactions: payments,
  amount: totalAmount,
  status: paymentStatus
},

  status: bookingStatus
});

    return res.status(201).json(booking);

  } catch (err) {
    console.error("BOOKING ERROR ❌", err);
    return res.status(500).json({
      message: "Booking failed",
    });
  }
};