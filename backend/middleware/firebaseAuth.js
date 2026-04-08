const { admin } = require("../config/firebaseAdmin");
const User = require("../models/User");

const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    // ✅ TRY FETCH USER (DON'T BLOCK)
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    // ✅ ATTACH EVERYTHING
    req.user = {
      uid: decodedToken.uid,
      mongoId: user ? user._id : null, // 🔥 IMPORTANT
      email: decodedToken.email,
      name: decodedToken.name || "",
      picture: decodedToken.picture || "",
      email_verified: decodedToken.email_verified,
      provider: decodedToken.firebase?.sign_in_provider || "password",
      role: user ? user.role : null, // 🔥 ADD THIS
    };

    next();
  } catch (error) {
    console.error("Firebase Auth Error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = firebaseAuth;