const Vehicle = require("../models/Vehicle");
const Bike = require("../models/Bike");
const Review = require("../models/reviewSchema");
const Booking = require("../models/Booking");
const Reservation = require("../models/Reservation");
/* ===========================================================
   SEARCH LISTINGS (Vehicles + Bikes Combined Pagination)
=========================================================== */

exports.searchListings = async (req, res) => {
  try {

    const {
      brands,
      categories,
      years,
      fuels,
      bikeTypes,
      features,
      transmissions,
      minPrice,
      maxPrice,
      search,
      location,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      sortBy = "newest",
      page = 1,
      limit = 9,
    } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    /* ================= COMMON FILTER ================= */

    const buildFilter = (type) => {

const filter = {
  status: "approved",
  isActive: true
};

      /* LOCATION */
      if (location) {
        const regex = new RegExp(location, "i");
        filter.mainLocation = regex;
      }

      /* BRAND */
      if (brands) {
        filter.brand = { $in: brands.split(",") };
      }

      /* CATEGORY */
      if (categories) {
        filter.category = { $in: categories.split(",") };
      }

      /* YEAR */
      if (years) {
        filter.year = { $in: years.split(",").map(Number) };
      }

      /* FUEL */
      if (fuels) {
        filter.fuel = { $in: fuels.split(",") };
      }

 /* VEHICLE TRANSMISSION */
if (type === "vehicle" && transmissions) {
  filter.transmission = { $in: transmissions.split(",") };
}

/* BIKE TYPE */
if (type === "bike" && bikeTypes) {
  filter.bikeType = { $in: bikeTypes.split(",") };
}
      /* FEATURES (vehicles only) */
      if (features && type === "vehicle") {
        filter.features = { $all: features.split(",") };
      }

      /* PRICE */
      if (minPrice || maxPrice) {

        filter["pricing.dailyPrice"] = {};

        if (minPrice) {
          filter["pricing.dailyPrice"].$gte = Number(minPrice);
        }

        if (maxPrice) {
          filter["pricing.dailyPrice"].$lte = Number(maxPrice);
        }

      }

      /* SEARCH */
      if (search) {

        const regex = new RegExp(search, "i");

        filter.$or = [
          { name: regex },
          { brand: regex },
          { model: regex },
          { category: regex },
          { mainLocation: regex }
        ];

      }

      return filter;
    };

    const vehicleFilter = buildFilter("vehicle");
    const bikeFilter = buildFilter("bike");

    /* ================= FETCH DATA ================= */

let vehicles = [];
let bikes = [];

/* ================= DETERMINE WHICH COLLECTION TO QUERY ================= */

const bikeFilterActive = bikeTypes;
const vehicleFilterActive = transmissions || features;

/* ONLY BIKES */
if (bikeFilterActive && !vehicleFilterActive) {

  bikes = await Bike.find(bikeFilter).lean();

}

/* ONLY VEHICLES */
else if (vehicleFilterActive && !bikeFilterActive) {

  vehicles = await Vehicle.find(vehicleFilter).lean();

}

/* BOTH */
else {

  [vehicles, bikes] = await Promise.all([
    Vehicle.find(vehicleFilter).lean(),
    Bike.find(bikeFilter).lean()
  ]);

}


const allIds = [
  ...vehicles.map(v => v._id),
  ...bikes.map(b => b._id),
];

// Aggregate ratings
const ratings = await Review.aggregate([
  {
    $match: {
      vehicleId: { $in: allIds },
    },
  },
  {
    $group: {
      _id: "$vehicleId",
      avgRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 },
    },
  },
]);

// Convert to lookup map
const ratingMap = {};
ratings.forEach(r => {
  ratingMap[r._id.toString()] = {
    avgRating: r.avgRating,
    totalReviews: r.totalReviews,
  };
});


    /* ================= ADD TYPE FIELD ================= */

const getCity = (location) => {
  if (!location) return "";
  return location.split(",")[0].trim(); // only first part
};

const vehicleData = vehicles.map((v) => {
  const ratingData = ratingMap[v._id.toString()] || {
    avgRating: 0,
    totalReviews: 0,
  };

  return {
    ...v,
    ...ratingData,
    type: "Vehicle",
    mainLocation: getCity(v.mainLocation),
  };
});

const bikeData = bikes.map((b) => {
  const ratingData = ratingMap[b._id.toString()] || {
    avgRating: 0,
    totalReviews: 0,
  };

  return {
    ...b,
    ...ratingData,
    type: "Bike",
    mainLocation: getCity(b.mainLocation),
  };
});


    let combined = [...vehicleData, ...bikeData];


    /* ================= REMOVE BOOKED VEHICLES ================= */

const isAvailabilitySearch =
  location &&
  pickupDate &&
  returnDate &&
  pickupTime &&
  returnTime;

if (isAvailabilitySearch) {

  const startDateTime = new Date(`${pickupDate}T${pickupTime}`);
  const endDateTime = new Date(`${returnDate}T${returnTime}`);

const reservedIds = await Reservation.distinct("vehicleIds", {
  approvalStatus: "approved",
  $or: [
    { "payment.status": "Paid" },
    { "payment.method": "pickup" }
  ],
  startDate: { $lt: endDateTime },
  endDate: { $gt: startDateTime }
});
  const bookedIds = await Booking.distinct("listingId", {
    status: { $in: ["Confirmed", "Pending"] },
    pickupDate: { $lt: endDateTime },
    returnDate: { $gt: startDateTime }
  });

  const bookedSet = new Set(bookedIds.map(id => id.toString()));

  // ✅ MERGE BOOKING + RESERVATION
const blockedIds = [
  ...new Set([
    ...bookedIds.map(id => id.toString()),
    ...reservedIds.map(id => id.toString())
  ])
];

combined = combined.filter(
  item => !blockedIds.includes(item._id.toString())
);
}




    /* ================= SORTING ================= */

    if (sortBy === "priceLow") {
      combined.sort(
        (a, b) =>
          (a.pricing?.dailyPrice || 0) -
          (b.pricing?.dailyPrice || 0)
      );
    }

    if (sortBy === "priceHigh") {
      combined.sort(
        (a, b) =>
          (b.pricing?.dailyPrice || 0) -
          (a.pricing?.dailyPrice || 0)
      );
    }

    if (sortBy === "newest") {
      combined.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
    }

    const total = combined.length;

    /* ================= PAGINATION ================= */

    const paginatedData = combined.slice(
      skip,
      skip + perPage
    );
if (combined.length === 0) {
  return res.json({
    total: 0,
    page: currentPage,
    limit: perPage,
    totalPages: 0,
    data: [],
    message: location
      ? `No vehicles available in ${location}`
      : "No vehicles found",
  });
}


res.json({
  total,
  page: currentPage,
  limit: perPage,
  totalPages: Math.ceil(total / perPage),
  data: paginatedData,
});


  } catch (err) {
    console.error("SEARCH ERROR ❌", err);
    res.status(500).json({ message: "Search failed" });
  }
};

/* ===========================================================
   SEARCH SUGGESTIONS
=========================================================== */

exports.getSuggestions = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length < 2)
      return res.json({ data: [] });

    const regex = new RegExp(search, "i");

    const [vehicles, bikes] = await Promise.all([
      Vehicle.find({
        status: "approved",
        isActive: true,
        $or: [
          { name: regex },
          { brand: regex },
          { model: regex },
        ],
      })
        .select("name brand")
        .limit(5)
        .lean(),

      Bike.find({
        status: "approved",
        isActive: true,
        $or: [
          { name: regex },
          { brand: regex },
          { model: regex },
        ],
      })
        .select("name brand")
        .limit(5)
        .lean(),
    ]);

    const combined = [...vehicles, ...bikes].slice(0, 5);

    res.json({ data: combined });

  } catch (err) {
    console.error("SUGGESTION ERROR ❌", err);
    res.status(500).json({ message: "Suggestion failed" });
  }
};

exports.getLocationSuggestions = async (req, res) => {
  try {

    const { search } = req.query;

    const regex = new RegExp(search || "", "i");

    const vehicleLocations = await Vehicle.aggregate([
      {
        $match: {
          status: "approved",
          isActive: true,
          mainLocation: regex
        }
      },
      {
        $group: {
          _id: "$mainLocation"
        }
      },
      { $limit: 5 }
    ]);

    const bikeLocations = await Bike.aggregate([
      {
        $match: {
          status: "approved",
isActive: true,
          mainLocation: regex
        }
      },
      {
        $group: {
          _id: "$mainLocation"
        }
      },
      { $limit: 5 }
    ]);

    const locations = [
      ...vehicleLocations.map(v => v._id),
      ...bikeLocations.map(b => b._id)
    ];

    const uniqueLocations = [...new Set(locations)].slice(0,5);

    res.json({ data: uniqueLocations });

  } catch (err) {
    console.error("LOCATION SUGGESTION ERROR ❌", err);
    res.status(500).json({ message: "Location suggestion failed" });
  }
};

exports.getPopularLocations = async (req, res) => {
const vehicleLocations = await Vehicle.distinct("mainLocation", {
  status: "approved",
  isActive: true
});

const bikeLocations = await Bike.distinct("mainLocation", {
  status: "approved",
  isActive: true
});
  const locations = [...new Set([...vehicleLocations, ...bikeLocations])];

  res.json({
    data: locations.slice(0,8)
  });

};
