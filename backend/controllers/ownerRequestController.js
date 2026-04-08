const OwnerRequest = require("../models/OwnerRequest");
const Profile = require("../models/Profile"); // ✅ for image + name
const User = require("../models/User"); // ✅ optional (role)

/* ================= CREATE REQUEST ================= */

const createOwnerRequest = async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const { requestedEmail } = req.body;

    if (!requestedEmail) {
      return res.status(400).json({
        message: "Owner email is required",
      });
    }

    if (requestedEmail === email) {
      return res.status(400).json({
        message: "You cannot use your current account email as Owner email",
      });
    }

    // Check if email already exists in system
    const existingUser = await User.findOne({ email: requestedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered in the system",
      });
    }

    const currentUser = await User.findOne({
      firebaseUid: uid,
    });

    if (currentUser?.role === "owner") {
      return res.status(400).json({
        message: "You are already an Owner",
      });
    }

    // 🔥 CHECK PREVIOUS REQUEST (IMPORTANT FIX)
    const previousRequest = await OwnerRequest.findOne({
      firebaseUid: uid,
    }).sort({ createdAt: -1 });

    if (previousRequest) {
      if (previousRequest.status === "pending") {
        return res.status(400).json({
          message: "You already have a pending request",
        });
      }

      if (previousRequest.status === "approved") {
        return res.status(400).json({
          message: "You are already approved as Owner",
        });
      }

if (previousRequest.status === "rejected") {
  const diffHours =
new Date(previousRequest.rejection?.rejectedAt || previousRequest.createdAt) / (1000 * 60 * 60);

  if (diffHours < 48) {
    return res.status(400).json({
      message: "You can reapply after 48 hours from rejection",
    });
  }

  // delete old rejected request after 48h
  await OwnerRequest.deleteOne({ _id: previousRequest._id });
}
    }

    const request = await OwnerRequest.create({
      firebaseUid: uid,
      name: name || email.split("@")[0],
      currentEmail: email,
      requestedEmail,
    });

    res.status(201).json({
      success: true,
      message: "Owner request submitted successfully",
      request,
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error",
    });
  }
};
/* ================= GET MY REQUEST ================= */

const getMyOwnerRequest = async (req, res) => {
  try {
    const request = await OwnerRequest.findOne({
      firebaseUid: req.user.uid,
    }).sort({ createdAt: -1 });

    res.json(request);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ADMIN: GET ALL ================= */

const getAllRequests = async (req, res) => {
  try {
    const requests = await OwnerRequest.find()
      .sort({ createdAt: -1 });

    res.json(requests);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ADMIN: UPDATE STATUS ================= */

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await OwnerRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

const { reason } = req.body;

request.status = status;

if (status === "rejected") {
  request.rejection = {
    reason: reason || "No reason provided",
    rejectedAt: new Date(),
  };
}

await request.save();
 

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getMyOwnerPayments = async (req, res) => {
  try {
    const request = await OwnerRequest.findOne({
      firebaseUid: req.user.uid,
    });

    if (!request) return res.json([]);

    res.json([request]);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};
/* ================= ADMIN: OWNER PAYMENTS ================= */
const getOwnerPayments = async (req, res) => {
  try {

    const requests = await OwnerRequest.find({
      "payment.paymentId": { $exists: true },
    }).sort({ "payment.paidAt": -1 });

    const data = await Promise.all(
      requests.map(async (r) => {

        const profile = await Profile.findOne({
          firebaseUid: r.firebaseUid,
        });

        const user = await User.findOne({
          firebaseUid: r.firebaseUid,
        });

        return {
          _id: r._id,

          // ✅ USE PROFILE FIRST
          name: profile?.name || r.name,
          email: profile?.email || r.currentEmail,
          image: profile?.profileImage || "",

          // ✅ OPTIONAL ROLE
          role: user?.role || "user",

          // PAYMENT
          payment: r.payment,
        };
      })
    );

    res.json(data);

  } catch (err) {
    console.error("OWNER PAYMENT ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch owner payments",
    });
  }
};

module.exports = {
  createOwnerRequest,
  getMyOwnerRequest,
  getAllRequests,
  updateRequestStatus,
  getOwnerPayments,
  getMyOwnerPayments,

};