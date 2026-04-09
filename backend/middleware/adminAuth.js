const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    // ✅ AUTO CREATE USER IF NOT FOUND
    if (!user) {
      user = await User.create({
        firebaseUid: req.user.uid,
        email: req.user.email,
        role: "owner", // default role
      });
    }

    // ✅ ROLE CHECK
    if (!["admin", "owner"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.mongoUser = user;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    res.status(500).json({ message: "Admin verification failed" });
  }
};

module.exports = adminAuth;
