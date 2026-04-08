const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const User = require("../models/User"); // ✅ ADD THIS
const Review = require("../models/reviewSchema");

const { getDetail, addReview, checkAvailability, addReply } = require("../controllers/vehicleDetailController");
// ✅ PUT THIS FIRST


router.get("/user/my-reviews", async (req, res) => {
  const userId = req.query.userId; // ✅ FIX (no auth used)

const reviews = await Review.find({ userId })
  .populate("vehicleId") // ✅ ADD THIS
  .sort({ createdAt: -1 });

  res.json(reviews);
});
// ✅ DELETE REVIEW
router.delete("/user/review/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await Review.findByIdAndDelete(id);

    res.json({ message: "Review deleted successfully" });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});
// ✅ OWNER REVIEWS
// ✅ ADMIN - GET ALL REVIEWS
// ✅ ADMIN - ALL REVIEWS (OWNER + ADMIN)
router.get("/admin/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("vehicleId") // supports Vehicle + Bike
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


router.get("/owner/reviews", async (req, res) => {
  try {
    const userId = req.query.userId;

    // 🔥 STEP 1: find user by firebase UID
    const user = await require("../models/User").findOne({
      firebaseUid: userId,
    });

    if (!user) {
      return res.json([]);
    }

    // 🔥 STEP 2: find vehicles of this owner
    const vehicles = await Vehicle.find({ owner: user._id }).select("_id name imageUrl gallery");
    const bikes = await Bike.find({ owner: user._id }).select("_id name imageUrl gallery");

    const ids = [
      ...vehicles.map(v => v._id),
      ...bikes.map(b => b._id),
    ];

    // 🔥 STEP 3: find reviews
    const reviews = await Review.find({
      vehicleId: { $in: ids }
    })
      .populate("vehicleId") // works with refPath ✅
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Owner review fetch failed" });
  }
});
// THEN OTHER ROUTES
router.get("/:id", getDetail);
router.post("/review", addReview);
router.post("/check-availability", checkAvailability);
router.post("/reply", addReply);
module.exports = router;
