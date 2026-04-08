const User = require("../models/User");
const OwnerRequest = require("../models/OwnerRequest");

const ADMIN_EMAIL = "wadhvanakaushik@gmail.com";

const syncUser = async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const { phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ 1. Check by firebase UID
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      user.isVerified = req.user.email_verified;

      if (name && user.name !== name) user.name = name;
      if (phone && !user.phone) user.phone = phone;

      await user.save();
      return res.status(200).json({ success: true, user });
    }

    // ✅ 2. Prevent duplicate email crash
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(200).json({
        success: true,
        user: existingEmail,
      });
    }

    // ✅ 3. Owner approval check
    const approvedOwner = await OwnerRequest.findOne({
      requestedEmail: email,
      status: "approved",
    });

    if (approvedOwner && !approvedOwner.isActivated) {
      return res.status(403).json({
        message: "Owner email approved but payment not completed",
      });
    }

    let role = "user";

    if (email === ADMIN_EMAIL) {
      role = "admin";
    } else if (approvedOwner) {
      role = "owner";
      approvedOwner.isActivated = true;
      await approvedOwner.save();
    }

    // ✅ 4. Create user
    user = await User.create({
      firebaseUid: uid,
      name: name || email.split("@")[0],
      email,
      phone: phone || "",
      provider: req.user.provider || "password", // ✅ FIXED (no firebase object)
      isVerified: req.user.email_verified,
      role,
    });

    return res.status(200).json({ success: true, user });

  } catch (error) {
    console.error("🔥 FULL ERROR:", error); // IMPORTANT
    return res.status(500).json({
      success: false,
      message: "User sync failed",
    });
  }
};

module.exports = { syncUser };