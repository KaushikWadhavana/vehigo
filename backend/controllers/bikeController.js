const Bike = require("../models/Bike");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

exports.addBike = async (req, res) => {
  try {
    // 1️⃣ Image check
    if (!req.files?.image) {
      return res.status(400).json({ message: "Image required" });
    }

    const imageFile = req.files.image[0];
    const documentFiles = req.files.documents || [];
    const docTypes = req.body.documentsType || {};

const {
  name,
  brand,
  model,
  category,
  mainLocation,
  fuel,
  year,
  bikeType,
  plateNumber,
  mileage,
  pricing,
  faqs,
} = req.body;

// ✅ SAFE JSON PARSE (ADD THIS BLOCK HERE)
let parsedPricing = {};
let parsedFaqs = [];

try {
  parsedPricing = JSON.parse(pricing || "{}");
} catch (e) {
  console.error("❌ Pricing parse error:", pricing);
}

try {
  parsedFaqs = JSON.parse(faqs || "[]");
} catch (e) {
  console.error("❌ FAQs parse error:", faqs);
}
    // 2️⃣ Required validation
    if (
      !name ||
      !brand ||
      !model ||
      !category ||
      !mainLocation ||
      !fuel ||
      !year ||
      !bikeType ||
      !plateNumber ||
      !mileage
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 3️⃣ Upload image
    const imageUrl = await uploadToCloudinary(imageFile, "bikes");
// 4️⃣ Upload documents (SAFE)
const uploadedDocuments = [];

for (let i = 0; i < documentFiles.length; i++) {
  const file = documentFiles[i];

  if (!file || !file.buffer || file.size === 0) continue;

  const url = await uploadToCloudinary(file, "bike-documents");

  uploadedDocuments.push({
    name: file.originalname,
    url,
    docType: docTypes?.[i],
  });
}

// ✅ ADD THIS BLOCK HERE
if (!req.mongoUser) {
  return res.status(401).json({
    message: "User not authenticated",
  });
}


// 5️⃣ Create bike
const bike = await Bike.create({
  owner: req.mongoUser._id,
  addedBy: req.mongoUser.role === "admin" ? "admin" : "owner",

  name,
  brand,
  model,
  category,
  mainLocation,
  fuel,
  year: Number(year),
  bikeType,
  plateNumber,
  mileage,
  imageUrl,
pricing: parsedPricing,
faqs: parsedFaqs,
  documents: uploadedDocuments,

  status: req.mongoUser.role === "admin" ? "approved" : "pending"
});

    res.status(201).json({
      message: "Bike added successfully ✅",
      bike,
    });
  } catch (err) {
    console.error("ADD BIKE ERROR ❌", err);
    res.status(500).json({
      message: err.message || "Failed to add bike",
    });
  }
};

/* ================= GET BIKES ================= */

exports.getBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({
  owner: req.mongoUser?._id
}).lean();

    res.status(200).json(bikes);
  } catch (err) {
    console.error("GET BIKES ERROR ❌", err);
    res.status(500).json({
      message: err.message || "Failed to fetch bikes",
    });
  }
};
