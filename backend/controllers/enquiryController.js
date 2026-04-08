const Enquiry = require("../models/Enquiry");
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");

exports.createEnquiry = async (req, res) => {
  try {
    const {
      listingId,
      listingType,
      name,
      email,
      phone,
      message
    } = req.body;

    const userId = req.user.uid;

    // ✅ VALIDATION
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (message.length > 250) {
      return res.status(400).json({
        message: "Message cannot exceed 250 characters"
      });
    }

    // ================= GET LISTING =================
    let listing;

    if (listingType === "Vehicle") {
      listing = await Vehicle.findById(listingId);
    } else {
      listing = await Bike.findById(listingId);
    }

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found"
      });
    }

    // ✅ SAFE DATA FROM DB
    const ownerId = listing.owner;
    const addedBy = listing.addedBy || "owner";

    // ================= SAVE =================
    const enquiry = await Enquiry.create({
      listingId,
      listingType,
      ownerId,
      userId,
      name,
      email,
      phone,
      message,
      addedBy   // ✅ NOW SAVED
    });

    res.status(201).json({
      success: true,
      message: "Enquiry submitted",
      data: enquiry
    });

  } catch (err) {
    console.error("Enquiry error:", err);
    res.status(500).json({ message: "Failed to submit enquiry" });
  }
};

exports.getOwnerEnquiries = async (req, res) => {
  try {
    const ownerId = req.user.mongoId;

    // ✅ SAFETY CHECK
    if (!ownerId) {
      console.log("❌ ownerId missing");
      return res.json([]); // 🔥 prevent crash
    }

    const enquiries = await Enquiry.find({ ownerId })
      .populate({
        path: "listingId",
        refPath: "listingType", // ✅ FIX (IMPORTANT)
      })
      .sort({ createdAt: -1 });

    res.json(enquiries || []); // ✅ ALWAYS ARRAY

  } catch (err) {
    console.error("❌ getOwnerEnquiries ERROR:", err);

    // ✅ NEVER SEND OBJECT → always array
    res.json([]); 
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.mongoId;

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, ownerId }, // ✅ SECURITY CHECK
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.json(enquiry);

  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.mongoId;

    const enquiry = await Enquiry.findOneAndDelete({
      _id: id,
      ownerId
    });

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.replyEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const ownerId = req.user.mongoId;

    // ✅ VALIDATION
    if (!message || message.trim().length < 3) {
      return res.status(400).json({
        message: "Reply must be at least 3 characters"
      });
    }

    if (message.length > 250) {
      return res.status(400).json({
        message: "Reply too long (max 250)"
      });
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, ownerId },
      {
        status: "Replied",
        reply: {
          message,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found"
      });
    }

    res.json(enquiry);

  } catch (err) {
    res.status(500).json({ message: "Reply failed" });
  }
};

// ✅ ADMIN: GET ALL ENQUIRIES
exports.getAllEnquiriesAdmin = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate({
        path: "listingId",
        refPath: "listingType", // 🔥 IMPORTANT
      })
      .sort({ createdAt: -1 });

    res.json(enquiries || []);
  } catch (err) {
    console.error("Admin Enquiry Error:", err);
    res.json([]); // ✅ prevent frontend crash
  }
};

// ✅ USER: GET OWN ENQUIRIES
exports.getUserEnquiries = async (req, res) => {
  try {
    const userId = req.user.uid;

    const enquiries = await Enquiry.find({ userId })
      .populate({
        path: "listingId",
        refPath: "listingType",
      })
      .sort({ createdAt: -1 });

    res.json(enquiries || []);
  } catch (err) {
    console.error("User Enquiry Error:", err);
    res.json([]); // prevent crash
  }
};

