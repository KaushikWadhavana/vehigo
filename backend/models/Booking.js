const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
{
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  listingType: {
    type: String,
    enum: ["Vehicle", "Bike"],
    required: true,
  },

  userId: {
    type: String,
    required: true,
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  
bookingId: {
  type: Number,
  unique: true,
},
  deliveryType: {
    type: String,
    enum: ["delivery", "pickup"],
    required: true,
  },

  pickupLocation: {
    type: String,
    required: true,
  },

  returnLocation: {
    type: String,
    required: true,
  },

  pickupDate: {
    type: Date,
    required: true,
  },

  returnDate: {
    type: Date,
    required: true,
  },

  pickupTime: String,
  returnTime: String,

  planType: {
    type: String,
    enum: ["daily", "weekly", "monthly", "yearly"],
    required: true,
  },

  basePrice: Number,
  deliveryCharge: Number,
  taxAmount: Number,
  refundableDeposit: Number,

  totalAmount: {
    type: Number,
    required: true,
  },
driver: {
  driverType: String,
  firstName: String,
  lastName: String,
  age: Number,
  mobile: String,
  licenseNumber: String,
  photo: String,   // 👈 ADD THIS
},
extras: [
  {
    key: String,
    title: String,
    price: Number,
type: {
  type: String,
  enum: ["per_day", "one_time", "dynamic"], 
},
  },
],
tollAmount: {
  type: Number,
  default: 0
},

billing: {
  name: String,
  email: String,
  phone: String,
  addressLine: String,
  country: String,
  state: String,
  city: String,
  pinCode: String,
  additionalInfo: String,
},


payment: {
  method: {
    type: String,
    enum: ["razorpay", "pickup"],
    default: "pickup"
  },

  transactions: [
    {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      amount: Number
    }
  ],

  amount: Number,

status: {
  type: String,
  enum: ["Pending", "Paid", "Refunded"], // ✅ added
  default: "Pending"
}
},

isDeleted: {
  type: Boolean,
  default: false,
},
status: {
  type: String,
  enum: ["Pending", "Confirmed", "Cancelled", "Rejected"], // ✅ add Rejected
  default: "Pending",
},

rejectReason: {
  type: String,
  maxlength: 250,
},
},
{ timestamps: true }
);
module.exports = mongoose.model("Booking", bookingSchema);