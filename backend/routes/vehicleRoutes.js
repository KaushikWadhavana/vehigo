// routes/vehicleRoutes.js
const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");
const upload = require("../middleware/upload");
const {
  addVehicle,
  getVehicles,
  addVehiclePricing,
  updateExtraPricing,
  uploadDocument,
  getDamages,
  addDamage,
  deleteDamage,
  getFaqs,
  addFaq,
  deleteFaq,
  rejectVehicle,
  updateVehicleBasic,
  toggleActive // ✅ ADD THIS
} = require("../controllers/vehicleController");
const adminAuth = require("../middleware/adminAuth");

const { addBike, getBikes } = require("../controllers/bikeController");
router.put(
  "/:id/toggle-active",
  firebaseAuth,
  toggleActive
);
// ✅ ADD VEHICLE
router.post(
  "/",
    firebaseAuth,
  adminAuth,   // ✅ ADD THIS 
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  addVehicle
);

// GET
router.get("/", firebaseAuth, getVehicles);
// PRICING
router.post("/:id/pricing", addVehiclePricing);
router.put("/:id/extras", updateExtraPricing);

// DOCUMENT UPLOAD (later)
router.post("/:id/documents", upload.single("file"), uploadDocument);

// DAMAGES
router.get("/:id/damages", getDamages);
router.post("/:id/damages", addDamage);
router.delete("/:id/damages/:damageId", deleteDamage);

// FAQ
router.get("/:id/faqs", getFaqs);
router.post("/:id/faqs", addFaq);
router.delete("/:id/faqs/:faqId", deleteFaq);

// BIKE

router.post(
  "/bikes",
  firebaseAuth,
  adminAuth,   // ✅ ADD THIS
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  addBike
);
router.put(
  "/:id/reject",
  firebaseAuth,
  adminAuth,
  rejectVehicle
);
router.put("/:id/update-basic", firebaseAuth, updateVehicleBasic);

router.get("/bikes", getBikes);

module.exports = router;
