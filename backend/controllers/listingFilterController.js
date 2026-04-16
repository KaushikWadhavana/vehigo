const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");

exports.getSidebarFilters = async (req, res) => {
  try {
    /* ================= VEHICLES ================= */
const vehicleBrands = await Vehicle.distinct("brand", { status: "approved", isActive: true });
const vehicleYears = await Vehicle.distinct("year", { status: "approved", isActive: true });
const vehicleFuels = await Vehicle.distinct("fuel", { status: "approved", isActive: true });
const transmissions = await Vehicle.distinct("transmission", { status: "approved", isActive: true });
const seats = await Vehicle.distinct("seats", { status: "approved", isActive: true });
const features = await Vehicle.distinct("features", { status: "approved", isActive: true });
const vehicleCategories = await Vehicle.aggregate([
  { $match: { status: "approved", isActive: true } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
]);

const priceStats = await Vehicle.aggregate([
  { $match: { status: "approved", isActive: true } },
  {
    $group: {
      _id: null,
      min: { $min: "$pricing.dailyPrice" },
      max: { $max: "$pricing.dailyPrice" }
    }
  }
]);
    /* ================= BIKES ================= */
const bikeBrands = await Bike.distinct("brand", { status: "approved", isActive: true });
const bikeYears = await Bike.distinct("year", { status: "approved", isActive: true });
const bikeTypes = await Bike.distinct("bikeType", { status: "approved", isActive: true });

const bikeCategories = await Bike.aggregate([
  { $match: { status: "approved", isActive: true } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
]);
const categoryMap = {};

[...vehicleCategories, ...bikeCategories].forEach(c => {
  if (!categoryMap[c._id]) {
    categoryMap[c._id] = { _id: c._id, count: 0 };
  }
  categoryMap[c._id].count += c.count;
});
  const bikeFuels = await Bike.distinct("fuel", { status: "approved", isActive: true });

const mergedCategories = Object.values(categoryMap);
    res.json({
brands: [
  ...new Set(
    [...vehicleBrands, ...bikeBrands].map(b => b.trim())
  )
],
      categories: mergedCategories,
      years: [...new Set([...vehicleYears, ...bikeYears])].sort((a, b) => b - a),
    
fuels: [
  ...new Set(
    [...vehicleFuels, ...bikeFuels].map(f => f.trim())
  )
],
      bikeTypes,
      transmissions,
      seats,
      features: [...new Set(features)],
      price: {
        min: priceStats[0]?.min || 0,
        max: priceStats[0]?.max || 10000,
      },
      rentalTypes: ["Any", "Per Day", "Per Week"],
    });
  } catch (err) {
    console.error("FILTER ERROR ❌", err);
    res.status(500).json({ message: "Failed to load filters" });
  }
};
