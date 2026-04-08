const mongoose = require("mongoose");

const ownerRequestSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true },
    name: { type: String, required: true },
    currentEmail: { type: String, required: true },
    requestedEmail: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejection: {
  reason: { type: String },
  rejectedAt: { type: Date },
},

    // ✅ EXISTING
    isActivated: {
      type: Boolean,
      default: false,
    },

    // 🔥 ADD THIS BLOCK (PAYMENT DATA)
    payment: {
      orderId: { type: String },
      paymentId: { type: String },
      amount: { type: Number, default: 999 },
      status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
      },
      paidAt: { type: Date },
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("OwnerRequest", ownerRequestSchema);