const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");

const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const User = require("../models/User");

/* ================= GET OWNER VEHICLES ================= */
router.get("/vehicles", firebaseAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const vehicles = await Vehicle.find({ owner: user._id });
    const bikes = await Bike.find({ owner: user._id });

    const allVehicles = [...vehicles, ...bikes];

    res.json(allVehicles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE VEHICLE ================= */
router.get("/vehicles/:id", firebaseAuth, async (req, res) => {
  try {
    const vehicleId = req.params.id;

    let vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      vehicle = await Bike.findById(vehicleId);
    }

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;