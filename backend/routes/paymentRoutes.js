const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");

router.post("/create-orders", async (req, res) => {
  try {

    const totalAmount = Number(req.body.amount);

    const LIMIT = 10000; // Razorpay test mode limit

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let remaining = totalAmount;
    const orders = [];
    let part = 1;

    while (remaining > 0) {

      const currentAmount = remaining > LIMIT ? LIMIT : remaining;

      const order = await razorpay.orders.create({
        amount: currentAmount * 100,
        currency: "INR",
        receipt: `vehigo_${part}_${Date.now()}`
      });

      orders.push({
        id: order.id,
        amount: currentAmount * 100
      });

      remaining -= currentAmount;
      part++;

    }

    res.json({ orders });

  } catch (err) {

    console.error("RAZORPAY ERROR:", err);
    res.status(500).json({ message: "Order creation failed" });

  }
});


router.post("/verify-payment", async (req, res) => {

  try {

    const crypto = require("crypto");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {

      return res.json({
        success: true,
        message: "Payment verified"
      });

    } else {

      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });

    }

  } catch (err) {

    console.error("VERIFY ERROR", err);

    res.status(500).json({
      message: "Payment verification failed"
    });

  }

});



module.exports = router;