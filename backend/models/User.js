const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: String,
  email: {
  type: String,
  required: true,
  unique: true,
},

    phone: String,
    provider: String,
  isVerified: { type: Boolean, default: false },
role: {
  type: String,
  enum: ["user", "owner", "admin"],
  default: "user",
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
