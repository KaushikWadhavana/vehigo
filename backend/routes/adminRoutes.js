const express = require("express");
const router = express.Router();

const firebaseAuth = require("../middleware/firebaseAuth");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const {
  getOwnersList,
  getOwnerVehicles,
  getSingleOwnerVehicle,
  getCustomers,
  deleteCustomer
} = require("../controllers/adminOwnerController");

const {
  getPendingVehicles,
  getOwnerPendingVehicles,
  approveVehicle,
  rejectVehicle
} = require("../controllers/adminVehicleApprovalController");

const Vehicle = require("../models/Vehicle");   // ✅ ADD
const Bike = require("../models/Bike");         // ✅ ADD

/* GET ALL VEHICLES FOR ADMIN */
router.get("/vehicles", adminAuth, async (req, res) => {
  try {

    const vehicles = await Vehicle.find({
      addedBy: "admin",
      status: "approved"
    }).lean();

    const bikes = await Bike.find({
      addedBy: "admin",
      status: "approved"
    }).lean();

    res.json({
      vehicles,
      bikes
    });

  } catch (err) {

    console.error("ADMIN VEHICLES ERROR:", err);

    res.status(500).json({
      vehicles: [],
      bikes: []
    });

  }
});



/* ================= VEHICLE APPROVAL ================= */

router.get(
  "/vehicles/pending",
  adminAuth,
  getPendingVehicles
);

router.get(
  "/owners/:ownerId/pending-vehicles",
  adminAuth,
  getOwnerPendingVehicles
);

router.put(
  "/vehicles/:vehicleId/approve",
  adminAuth,
  approveVehicle
);

router.put(
  "/vehicles/:vehicleId/reject",
  adminAuth,
  rejectVehicle
);

router.get("/users", firebaseAuth, adminAuth, async (req, res) => {
  const users = await User.find().select("-__v");
  res.json(users);
});
router.get(
  "/owners/:ownerId/vehicle/:vehicleId",
  adminAuth,
  getSingleOwnerVehicle
);
router.get("/owners", adminAuth, getOwnersList);
router.get("/owners/:ownerId/vehicles", adminAuth, getOwnerVehicles);


/* ================= CUSTOMERS ================= */

router.get("/customers", adminAuth, getCustomers);

router.delete("/customers/:userId", adminAuth, deleteCustomer);

router.get("/vehicle/:vehicleId", adminAuth, async (req,res)=>{
  try{

    const { vehicleId } = req.params;

    let vehicle = await Vehicle.findById(vehicleId).lean();

    if(!vehicle){
      vehicle = await Bike.findById(vehicleId).lean();
    }

    if(!vehicle){
      return res.status(404).json({ message:"Vehicle not found"});
    }

    res.json(vehicle);

  }catch(err){
    res.status(500).json({message:err.message});
  }
});
module.exports = router;
