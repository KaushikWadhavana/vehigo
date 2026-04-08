const Vehicle = require("../models/Vehicle");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const Bike = require("../models/Bike");


/* ================= ADD VEHICLE ================= */

exports.addVehicle = async (req, res) => {
  try {
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
      transmission,
      year,
      passengers,
      seats,
      mileage,
      plateNumber,
      features,
      pricing,
      extras,
      damages,
      faqs,
    } = req.body;

    if (
      !name || !brand || !model || !category ||
      !mainLocation || !fuel || !transmission ||
      !year || !passengers || !seats || !mileage || !plateNumber
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedFeatures = JSON.parse(features || "[]");
    if (!parsedFeatures.length) {
      return res.status(400).json({ message: "Select at least one feature" });
    }

    const imageUrl = await uploadToCloudinary(imageFile, "vehicles");

   // ✅ SAFE DOCUMENT UPLOAD (FIXES "Empty file")
const uploadedDocuments = [];

for (let i = 0; i < documentFiles.length; i++) {
  const file = documentFiles[i];

  // 🚨 Prevent empty / invalid files (Cloudinary crash fix)
  if (!file || !file.buffer || file.size === 0) {
    continue;
  }

  const url = await uploadToCloudinary(file, "documents");

  uploadedDocuments.push({
    name: file.originalname,
    url,
    docType: docTypes?.[i], // safe optional access
  });
}

const vehicle = await Vehicle.create({
  owner: req.mongoUser._id,
  addedBy: req.mongoUser.role === "admin" ? "admin" : "owner",

  name,
  brand,
  model,
  category,
  mainLocation,
  fuel,
  transmission,
  year: Number(year),
  passengers: Number(passengers),
  seats: Number(seats),
  mileage,
  plateNumber,
  imageUrl,
  features: parsedFeatures,
  pricing: JSON.parse(pricing || "{}"),
  extras: JSON.parse(extras || "[]"),
  damages: JSON.parse(damages || "[]"),
  faqs: JSON.parse(faqs || "[]"),
  documents: uploadedDocuments,

  status: req.mongoUser.role === "admin" ? "approved" : "pending"
});
    res.status(201).json({
      message: "Vehicle added successfully ✅",
      vehicle,
    });
  } catch (err) {
    console.error("ADD VEHICLE ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET VEHICLES (THIS WAS MISSING) ================= */

exports.getVehicles = async (req, res) => {
  try {
    let vehicles;

    // 🔥 SAFE CHECK (ONLY CHANGE THIS)
    if (req.mongoUser && req.mongoUser.role === "admin") {

      vehicles = await Vehicle.find().lean();

    } else if (req.mongoUser) {

      vehicles = await Vehicle.find({
        owner: req.mongoUser._id
      }).lean();

    } else {
      // 🔥 USER SIDE (NO LOGIN / NO mongoUser)
      vehicles = await Vehicle.find({
        status: "approved",
        isActive: true
      }).lean();
    }

    res.json(vehicles);

  } catch (err) {
    console.error("GET VEHICLES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addVehiclePricing = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    vehicle.pricing = req.body;
    await vehicle.save();

    res.json({ message: "Pricing added successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateExtraPricing = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    vehicle.extras = req.body.extras;
    await vehicle.save();

    res.json({ message: "Extra pricing updated ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    const fileUrl = await uploadToCloudinary(req.file, "documents");

    vehicle.documents.push({
      name: req.file.originalname,
      url: fileUrl,
      docType: req.body.docType,
    });

    await vehicle.save();

    res.json({
      message: "Document uploaded ✅",
      url: fileUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD DAMAGE
exports.addDamage = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  vehicle.damages.push(req.body);
  await vehicle.save();

  res.json(vehicle.damages);
};

// GET DAMAGES
exports.getDamages = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  res.json(vehicle.damages);
};

// DELETE DAMAGE
exports.deleteDamage = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  vehicle.damages.id(req.params.damageId).remove();
  await vehicle.save();
  res.json({ message: "Deleted" });
};
// ADD FAQ
exports.addFaq = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  vehicle.faqs.push(req.body);
  await vehicle.save();
  res.json(vehicle.faqs);
};

// GET FAQ
exports.getFaqs = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  res.json(vehicle.faqs);
};

// DELETE FAQ
exports.deleteFaq = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  vehicle.faqs.id(req.params.faqId).remove();
  await vehicle.save();
  res.json({ message: "Deleted" });
};

exports.rejectVehicle = async (req, res) => {
  try {

    const { reason } = req.body;

    // ✅ validation
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        message: "Rejection reason required"
      });
    }

    // 🔍 check Vehicle first
    let item = await Vehicle.findById(req.params.id);

    if (item) {
      item.status = "rejected";
      item.rejectionReason = reason;
      await item.save();

      return res.json({
        message: "Vehicle rejected",
        data: item
      });
    }

    // 🔍 check Bike
    item = await Bike.findById(req.params.id);

    if (item) {
      item.status = "rejected";
      item.rejectionReason = reason;
      await item.save();

      return res.json({
        message: "Bike rejected",
        data: item
      });
    }

    return res.status(404).json({ message: "Not found" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    let item = await Vehicle.findById(req.params.id);

    if (item) {
      item.isActive = !item.isActive;
      await item.save();

      return res.json({
        message: item.isActive ? "Vehicle Activated" : "Vehicle Deactivated",
        data: item
      });
    }

    item = await Bike.findById(req.params.id);

    if (item) {
      item.isActive = !item.isActive;
      await item.save();

      return res.json({
        message: item.isActive ? "Bike Activated" : "Bike Deactivated",
        data: item
      });
    }

    return res.status(404).json({ message: "Not found" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVehicleBasic = async (req, res) => {
  try {
    let item = await Vehicle.findById(req.params.id);

    if (!item) {
      item = await Bike.findById(req.params.id);
    }

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    const {
      mileage,
      mainLocation,
      features,
      pricing,
      faqs,
      damages,
      extras,
    } = req.body;

    if (mileage !== undefined) item.mileage = mileage;
    if (mainLocation !== undefined) item.mainLocation = mainLocation;

    if (features !== undefined) item.features = features;
    if (pricing !== undefined) item.pricing = pricing;

    if (faqs !== undefined) item.faqs = faqs;
    if (damages !== undefined) item.damages = damages;

    if (extras !== undefined && item.extras !== undefined) {
      item.extras = extras;
    }

    await item.save();

    res.json({
      message: "Updated successfully ✅",
      data: item,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};