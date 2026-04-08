const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user || !["admin", "owner"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.mongoUser = user;

    next();
  } catch (err) {
    res.status(500).json({ message: "Admin verification failed" });
  }
};

module.exports = adminAuth;