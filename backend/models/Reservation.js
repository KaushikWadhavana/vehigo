const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({

  vehicleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true
  }],

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdBy: {
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "owner", "user"],
      required: true
    }
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  startTime: String,
  endTime: String,

  rentalDays: {
    type: Number,
    min: 1,
    max: 30,
    required: true
  },

  rentalType: {
    type: String,
    enum: ["Self Pickup", "Delivery"],
    required: true
  },

  passengers: {
    type: Number,
    min: 1,
    max: 20,
    required: true
  },

  pickupLocation: {
    type: String,
    required: true
  },

  returnLocation: {
    type: String,
    required: true
  },

securityDeposit: {
  type: Number,
  default: 0
},

// ✅ ADD HERE
tollAmount: {
  type: Number,
  default: 0
},

baseKilometers: Number,   // ✅ FIX
isUnlimitedKm: {
  type: Boolean,
  default: false
},
extraKmPrice: Number,
  extras: [{
    key: String,
    price: { type: Number, default: 0 },
  type: {
  type: String,
  enum: ["per_day", "one_time", "dynamic"], // ✅ ADD THIS
  default: "one_time"
}
  }],

  totalAmount: {
    type: Number,
    default: 0
  },

  approvedBy: {
    type: String // firebase UID
  },

  approvedAt: Date,
payment: {
  method: {
    type: String,
    enum: ["razorpay", "pickup"],
    default: null
  },

  amount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["Pending", "Paid", "Refunded"],
    default: "Pending"
  },
    paymentDate: {   // 🔥 ADD THIS
    type: Date,
    default: null
  },

  transactions: [
    {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      amount: Number
    }
  ]
},

  rejectionReason: {
    type: String,
    default: ""
  },

  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

status: {
  type: String,
  enum: ["pending", "upcoming", "in_rental", "completed"],
  default: "pending"
}

}, { timestamps: true });

/* 🔥 INDEX (GOOD) */
reservationSchema.index({
  vehicleIds: 1,
  startDate: 1,
  endDate: 1
});

module.exports = mongoose.model("Reservation", reservationSchema);