const mongoose = require("mongoose");

const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Review = require("../models/reviewSchema");

exports.getLocations = async (req, res) => {
  try {
    // get distinct locations from both collections
const vehicleLocations = await Vehicle.distinct("mainLocation", {
  status: "approved",
  isActive: true
});

const bikeLocations = await Bike.distinct("mainLocation", {
  status: "approved",
  isActive: true
});
    // merge + remove duplicates
    const locations = [...new Set([...vehicleLocations, ...bikeLocations])];

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

/* ===========================================================
   GET SINGLE LISTING DETAIL
=========================================================== */

exports.getListingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    let listing = await Vehicle.findOne({
  _id: id,
  status: "approved",
isActive: true
})
      .populate("owner", "name email phone");

    if (!listing) {
      listing = await Bike.findOne({
        _id: id,
        status: "approved",
isActive: true
      })
        .populate("owner", "name email phone");
    }

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);

  } catch (err) {
    console.error("DETAIL ERROR ❌", err);
    res.status(500).json({ message: "Failed to load listing" });
  }
};
/* ================= RANDOM LISTINGS ================= */
exports.getRandomListings = async (req, res) => {
  try {
    const { excludeId } = req.query;

    let objectId = null;

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      objectId = new mongoose.Types.ObjectId(excludeId);
    }

    /* ================= VEHICLES ================= */
    const vehiclePipeline = [];

    if (objectId) {
      vehiclePipeline.push({
        $match: { _id: { $ne: objectId } },
      });
    }

    vehiclePipeline.push(
      { $sample: { size: 15 } },
      { $addFields: { type: "Vehicle" } }
    );

vehiclePipeline.unshift({
  $match: { status: "approved",
isActive: true }
});

const vehicles = await Vehicle.aggregate(vehiclePipeline);

    /* ================= BIKES ================= */
    const bikePipeline = [];

    if (objectId) {
      bikePipeline.push({
        $match: { _id: { $ne: objectId } },
      });
    }

    bikePipeline.push(
      { $sample: { size: 15 } },
      { $addFields: { type: "Bike" } }
    );

bikePipeline.unshift({
  $match: { status: "approved",
isActive: true}
});

const bikes = await Bike.aggregate(bikePipeline);

    const combined = [...vehicles, ...bikes];

    /* ================= ADD RATING DATA ================= */
    const listingsWithRatings = await Promise.all(
      combined.map(async (item) => {

        const reviews = await Review.find({
          vehicleId: item._id,
          vehicleType: item.type,
        });

        let avgRating = 0;

        if (reviews.length > 0) {
          const total = reviews.reduce((sum, r) => {
            const reviewAvg =
              ((r.service || 0) +
                (r.location || 0) +
                (r.value || 0) +
                (r.facilities || 0) +
                (r.cleanliness || 0)) / 5;

            return sum + reviewAvg;
          }, 0);

          avgRating = total / reviews.length;
        }

        return {
          ...item,
          avgRating: Number(avgRating.toFixed(1)),
          totalReviews: reviews.length,
        };
      })
    );

    res.json(listingsWithRatings);

  } catch (err) {
    console.error("Random listing error:", err);
    res.status(500).json({ message: "Failed to fetch random listings" });
  }
};
