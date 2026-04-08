const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");

const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const User = require("../models/User");

router.get("/vehicle-status", firebaseAuth, async (req,res)=>{

try{

const firebaseUid = req.user.uid;

const user = await User.findOne({ firebaseUid });

if(!user){
 return res.status(404).json({message:"User not found"});
}

const vehicles = await Vehicle.find({ owner:user._id });
const bikes = await Bike.find({ owner:user._id });

const allVehicles = [...vehicles,...bikes];

res.json(allVehicles);

}catch(err){
console.error(err);
res.status(500).json({message:"Server error"});
}

});

module.exports = router;