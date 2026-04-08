const User = require("../models/User");
const Profile = require("../models/Profile");
const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
/* ================= GET ALL OWNERS ================= */
exports.getOwnersList = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" })
      .select("name email profileImage createdAt")
      .lean();

    res.json(owners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET OWNER VEHICLES ================= */
exports.getOwnerVehicles = async (req, res) => {
  try {
    const { ownerId } = req.params;

const vehicles = await Vehicle.find({
  owner: ownerId,
  status: "approved"
}).lean();

const bikes = await Bike.find({
  owner: ownerId,
  status: "approved"
}).lean();
    res.json({
      vehicles,
      bikes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET SINGLE OWNER VEHICLE ================= */
exports.getSingleOwnerVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    let vehicle = await Vehicle.findById(vehicleId).lean();

    if (!vehicle) {
      vehicle = await Bike.findById(vehicleId).lean();
    }

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET CUSTOMERS ================= */
/* ================= GET CUSTOMERS ================= */

exports.getCustomers = async (req, res) => {
  try {

    const { search, sort, role, date } = req.query;

    /* ================= BASE QUERY ================= */

    let query = {
      role: { $ne: "admin" } // hide admin
    };

    /* ================= ROLE FILTER (RENTER / OWNER TAB) ================= */

    if (role && role !== "all") {
      query.role = role; // user or owner
    }

    /* ================= SEARCH ================= */

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    /* ================= DATE FILTER ================= */

    if (date && date !== "all") {

      const now = new Date();
      let startDate;

      if (date === "today") {
        startDate = new Date(now.setHours(0,0,0,0));
      }

      if (date === "yesterday") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
      }

      if (date === "7days") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }

      if (date === "30days") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      if (date === "year") {
        startDate = new Date(new Date().getFullYear(), 0, 1);
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }

    }

    /* ================= SORT ================= */

    let sortOption = { createdAt: -1 }; // newest

    if (sort === "old") sortOption = { createdAt: 1 };
    if (sort === "asc") sortOption = { name: 1 };
    if (sort === "desc") sortOption = { name: -1 };

    /* ================= GET USERS ================= */

    const users = await User.find(query)
      .sort(sortOption)
      .lean();

    /* ================= GET PROFILE IMAGES ================= */

    const firebaseUids = users.map(u => u.firebaseUid);

    const profiles = await Profile.find({
      firebaseUid: { $in: firebaseUids }
    }).lean();

    const profileMap = {};

    profiles.forEach(p => {
      profileMap[p.firebaseUid] = p;
    });

    /* ================= MERGE USER + PROFILE ================= */

    const result = users.map(user => {

      const profile = profileMap[user.firebaseUid];

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,

        profileImage: profile?.profileImage || ""
      };

    });

    res.json(result);

  } catch (err) {

    console.error("Get customers error:", err);

    res.status(500).json({
      message: "Failed to fetch customers"
    });

  }
};

/* ================= DELETE CUSTOMER ================= */

exports.deleteCustomer = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};