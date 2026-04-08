const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    addedBy:{
 type:String,
 enum:["admin","owner"],
 required:true
},
    owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},
isActive: {
  type: Boolean,
  default: true
},
    name: { type: String, required: true },
    type: { type: String, default: "Vehicle" },

    brand: { type: String, required: true },
    model: { type: String, required: true },
    category: { type: String, required: true },
    mainLocation: { type: String, required: true },

    fuel: {
      type: String,
      required: true,
      enum: ["Petrol", "Diesel", "Electric"],
    },

    transmission: {
      type: String,
      required: true,
      enum: ["Manual", "Automatic", "Semi Automatic"],
    },

    year: { type: Number, required: true },
    passengers: { type: Number, required: true },
    seats: { type: Number, required: true },

    mileage: { type: String, required: true },
    plateNumber: { type: String, required: true },

    imageUrl: { type: String, required: true },

    /* ✅ NEW */
    features: {
      type: [String],
      default: [],
    },

    pricing: {
  dailyPrice: Number,
  weeklyPrice: Number,
  monthlyPrice: Number,
  yearlyPrice: Number,

  baseKm: Number,
  unlimited: { type: Boolean, default: false },
  extraKmPrice: Number,
},

extras: [
  {
    key: String,
    title: String,
type: {
  type: String,
  enum: ["per_day", "one_time", "dynamic"], // ✅ ADD dynamic
  default: "per_day",
},
    price: Number,
  },
],

documents: [
  {
    name: String,
    url: String,
    docType: {
      type: String,
      enum: ["car", "policy", "puc"],
    },
  },
],
// Vehicle.js
damages: [
  {
    location: {
      type: String,
      enum: ["Interior", "Exterior"],
      required: true,
    },
    type: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now },
  },
],

faqs: [
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
],


status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},
rejectionReason: {
  type: String,
  default: ""
},
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
