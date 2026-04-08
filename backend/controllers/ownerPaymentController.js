const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const OwnerRequest = require("../models/OwnerRequest");

/* ================= CREATE ORDER ================= */
exports.createOrder = async (req, res) => {
  try {
    const { uid } = req.user;

    const request = await OwnerRequest.findOne({
      firebaseUid: uid,
      status: "approved",
    });

    if (!request) {
      return res.status(400).json({
        message: "Owner request not approved",
      });
    }

    // 🔥 ADD THIS BLOCK
    if (request.isActivated) {
      return res.status(400).json({
        message: "Owner already activated (payment done)",
      });
    }

// ✅ FIX: keep receipt under 40 chars
const shortUid = uid.slice(0, 8);

const options = {
  amount: 999 * 100,
  currency: "INR",
  receipt: `own_${shortUid}_${Date.now().toString().slice(-6)}`,
};
const order = await razorpay.orders.create(options);

// 🔥 SAVE ORDER ID
request.payment = {
  orderId: order.id,
  amount: 999,
  status: "pending",
};

await request.save();
    

    res.json(order);

  }catch (err) {
  console.error("CREATE ORDER ERROR:", err); // 🔥 ADD THIS
  res.status(500).json({ 
    message: "Order creation failed",
    error: err.message 
  });
}
};

/* ================= VERIFY PAYMENT ================= */
exports.verifyPayment = async (req, res) => {
  try {
    const { uid } = req.user;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    // ✅ Mark activated
const request = await OwnerRequest.findOne({
  firebaseUid: uid,
  status: "approved",
});

if (!request) {
  return res.status(404).json({
    message: "Request not found",
  });
}

request.isActivated = true;

// 🔥 SAVE PAYMENT DETAILS
request.payment = {
  orderId: razorpay_order_id,
  paymentId: razorpay_payment_id,
  amount: 999,
  status: "success",
  paidAt: new Date(),
};

await request.save();
    res.json({
      success: true,
      message: "Payment successful, Owner Activated",
    });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};