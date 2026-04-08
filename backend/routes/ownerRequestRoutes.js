const express = require("express");
const router = express.Router();

const firebaseAuth = require("../middleware/firebaseAuth");
const adminAuth = require("../middleware/adminAuth");

const {
  createOwnerRequest,
  getMyOwnerRequest,
  getAllRequests,
  updateRequestStatus,
  getMyOwnerPayments,
  getOwnerPayments, // ✅ ADD THIS
} = require("../controllers/ownerRequestController");
/* ================= USER ROUTES ================= */

router.post("/request", firebaseAuth, createOwnerRequest);
router.get("/my-request", firebaseAuth, getMyOwnerRequest);

/* ================= ADMIN ROUTES ================= */

router.get("/all", firebaseAuth, adminAuth, getAllRequests);
router.put("/status/:id", firebaseAuth, adminAuth, updateRequestStatus);
router.get(
  "/payments",
  firebaseAuth,
  adminAuth,
  getOwnerPayments
);
router.get(
  "/my-payment",
  firebaseAuth,
  getMyOwnerPayments
);
module.exports = router;