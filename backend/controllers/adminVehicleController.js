const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");

// 🔍 helper (handle both models)
const getModel = (type) => {
  return type === "Bike" ? Bike : Vehicle;
};


// ✅ APPROVE
exports.approveVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { type } = req.query; // Vehicle or Bike

    const Model = getModel(type);

    const vehicle = await Model.findByIdAndUpdate(
      vehicleId,
      {
        status: "approved",
        rejectionReason: "" // clear old reason
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ❌ REJECT
exports.rejectVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { reason } = req.body;
    const { type } = req.query;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const Model = getModel(type);

    const vehicle = await Model.findByIdAndUpdate(
      vehicleId,
      {
        status: "rejected",
        rejectionReason: reason
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};