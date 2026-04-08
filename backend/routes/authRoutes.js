const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");
const { syncUser } = require("../controllers/authController");
const OwnerRequest = require("../models/OwnerRequest");
const User = require("../models/User"); 

router.post("/sync", firebaseAuth, syncUser);

router.post("/find-email", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ email: user.email });
  } catch (err) {
    console.error("Find email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/check-user", firebaseAuth, async (req, res) => {
  try {
    const { uid } = req.user;

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({
        exists: false,
        message: "User not registered",
      });
    }

    res.json({ exists: true, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/check-owner-email", async (req, res) => {
  try {
    const { email } = req.body;

    const request = await OwnerRequest.findOne({
      requestedEmail: email,
      status: "approved",
    });

    if (request && !request.isActivated) {
      return res.status(403).json({
        message: "Owner email approved but payment not completed",
      });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
