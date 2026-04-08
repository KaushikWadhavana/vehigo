const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");

/* ================= GET ALL PENDING VEHICLES ================= */

exports.getPendingVehicles = async (req, res) => {
  try {

    const vehicles = await Vehicle.find({ status: "pending" })
      .populate("owner", "name email")
      .lean();

    const bikes = await Bike.find({ status: "pending" })
      .populate("owner", "name email")
      .lean();

    res.json({
      vehicles,
      bikes
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET OWNER PENDING VEHICLES ================= */

exports.getOwnerPendingVehicles = async (req, res) => {
  try {

    const { ownerId } = req.params;

    const vehicles = await Vehicle.find({
      owner: ownerId,
      status: "pending"
    }).lean();

    const bikes = await Bike.find({
      owner: ownerId,
      status: "pending"
    }).lean();

    res.json({
      vehicles,
      bikes
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= APPROVE VEHICLE ================= */

exports.approveVehicle = async (req, res) => {
  try {

    const { vehicleId } = req.params;

    let vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      vehicle = await Bike.findById(vehicleId);
    }

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    vehicle.status = "approved";

    await vehicle.save();

    res.json({
      success: true,
      message: "Vehicle approved"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= REJECT VEHICLE ================= */

exports.rejectVehicle = async (req, res) => {
  try {

    const { vehicleId } = req.params;

    let vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      vehicle = await Bike.findById(vehicleId);
    }

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    vehicle.status = "rejected";

    await vehicle.save();

    res.json({
      success: true,
      message: "Vehicle rejected"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};