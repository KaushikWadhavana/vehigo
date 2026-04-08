const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
{
listingId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  refPath: "listingType", // 🔥 IMPORTANT
},

  listingType: {
    type: String,
    enum: ["Vehicle", "Bike"],
    required: true,
  },

  userId: {
    type: String, // firebase UID
    required: true,
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  addedBy: {
  type: String,
  enum: ["admin", "owner"],
  required: true   // ✅ add this
},
  name: String,
  email: String,
  phone: String,
  message: String,
reply: {
  message: String,
  updatedAt: Date
},
status: {
  type: String,
  enum: ["Not Opened", "Opened", "Replied"],
  default: "Not Opened"
}
},
{ timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);