const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },

    // Basic Info
name: { type: String, default: "" },

    email: { type: String, required: true },
    phone: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    // Address Info
    addressLine: { type: String, default: "" },
    country: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pinCode: { type: String, default: "" },

    provider: String,
    role: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
