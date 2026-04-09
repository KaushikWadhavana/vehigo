const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    // 🔥 ONLY FIND USER (NO CREATE)
    const user = await User.findOne({
      firebaseUid: req.user.uid,
    });

    // ❌ If user not found → reject
    if (!user) {
      return res.status(403).json({
        message: "User not registered in system",
      });
    }

    // ❌ Role check
    if (!["admin", "owner"].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // ✅ attach
    req.mongoUser = user;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    res.status(500).json({
      message: "Admin verification failed",
    });
  }
};

module.exports = adminAuth;
