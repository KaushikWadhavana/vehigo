const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
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
    type: { type: String, default: "Bike" },

    brand: { type: String, required: true },
    model: { type: String, required: true },
    category: { type: String, required: true },
    mainLocation: { type: String, required: true },

    fuel: { type: String, required: true },
    year: { type: Number, required: true },
    bikeType: { type: String, required: true },

    plateNumber: { type: String, required: true },
    mileage: { type: String, required: true },

    imageUrl: { type: String, required: true },

    /* ✅ PRICING (from Pricing tab) */
    pricing: {
      dailyPrice: Number,
      weeklyPrice: Number,
      monthlyPrice: Number,
      yearlyPrice: Number,
      baseKm: Number,
      unlimited: { type: Boolean, default: false },
      extraKmPrice: Number,
    },

    /* ✅ DOCUMENTS */
    documents: [
      {
        name: String,
        url: String,
        docType: {
          type: String,
          enum: ["rc", "policy", "puc"],
        },
      },
    ],

    /* ✅ FAQ */
    faqs: [
      {
        question: String,
        answer: String,
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
  mongoose.models.Bike || mongoose.model("Bike", bikeSchema);
