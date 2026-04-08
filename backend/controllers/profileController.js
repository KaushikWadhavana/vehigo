const Profile = require("../models/Profile");
const User = require("../models/User");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    let profile = await Profile.findOne({ firebaseUid });

    if (!profile) {
      const user = await User.findOne({ firebaseUid });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

profile = await Profile.create({
  firebaseUid: user.firebaseUid,
  name: req.user.name || user.name || "",
  email: user.email,
  phone: user.phone || "",
  profileImage: req.user.picture || "",
  provider: user.provider,
  role: user.role,
});
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const allowedFields = [
      "name",
      "phone",
      "addressLine",
      "country",
      "state",
      "city",
      "pinCode",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedProfile = await Profile.findOneAndUpdate(
      { firebaseUid },
      updates,
      { new: true }
    );

    // 🔥 ALSO UPDATE USER COLLECTION NAME
    if (updates.name) {
      await User.findOneAndUpdate(
        { firebaseUid },
        { name: updates.name }
      );
    }

    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= IMAGE UPLOAD =================
exports.uploadProfileImage = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const imageUrl = await uploadToCloudinary(
      req.file,
      "vehigo/profiles"
    );

    const updated = await Profile.findOneAndUpdate(
      { firebaseUid },
      { profileImage: imageUrl },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
