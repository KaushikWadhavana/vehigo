const User = require("../models/User");
const { admin } = require("../config/firebaseAdmin");
const Profile = require("../models/Profile");


// Helper to verify ownership
const checkOwner = (req, res) => {
  if (req.user.uid !== req.params.firebaseUid) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

// ================= DELETE ACCOUNT =================
exports.deleteAccount = async (req, res) => {
  try {

    if (!checkOwner(req, res)) return;

    const { firebaseUid } = req.params;

    // 🔥 Delete from Firebase Authentication
    await admin.auth().deleteUser(firebaseUid);

    // 🔥 Delete from MongoDB collections
    await User.deleteOne({ firebaseUid });
    await Profile.deleteOne({ firebaseUid });

    res.json({ message: "Account deleted successfully" });

  } catch (err) {

    res.status(500).json({ message: err.message });

  }
};
// ================= DEACTIVATE ACCOUNT =================
exports.deactivateAccount = async (req, res) => {
  try {
    if (!checkOwner(req, res)) return;

    await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      { isActive: false }
    );

    res.json({ message: "Account deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reactivateAccount = async (req, res) => {
  try {
    if (!checkOwner(req, res)) return;

    await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      { isActive: true }
    );

    res.json({ message: "Account reactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
