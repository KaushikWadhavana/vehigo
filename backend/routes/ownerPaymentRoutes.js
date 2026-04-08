const express = require("express");
const router = express.Router();

const firebaseAuth = require("../middleware/firebaseAuth");

const {
  createOrder,
  verifyPayment,
} = require("../controllers/ownerPaymentController");

router.post("/create-order", firebaseAuth, createOrder);
router.post("/verify", firebaseAuth, verifyPayment);

module.exports = router;