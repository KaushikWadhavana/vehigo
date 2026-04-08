const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  userId: {
    type: String, // firebase UID
    required: true,
  },
  name: String,
  email: String,
  profileImage: String,

  message: {
    type: String,
    required: true,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const reviewSchema = new mongoose.Schema(
  {
vehicleId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  refPath: "vehicleType", // ✅ THIS IS THE FIX
},

    vehicleType: {
      type: String,
      enum: ["Vehicle", "Bike"],
      required: true,
    },

    // ✅ WHO ADDED LISTING
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    addedBy: {
      type: String,
      enum: ["admin", "owner"],
    },

    // ✅ REVIEW USER
    userId: {
      type: String, // firebase UID
      required: true,
    },

    fullName: String,
    email: String,
    profileImage: String,

    service: Number,
    location: Number,
    value: Number,
    facilities: Number,
    cleanliness: Number,

    rating: Number,

    comment: String,

    // ✅ NEW REPLIES
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);