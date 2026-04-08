const express = require("express");
const router = express.Router();

const { 
  getLocations,
  getRandomListings
} = require("../controllers/listingController");

const { getSidebarFilters } = require("../controllers/listingFilterController");

const {
  searchListings,
  getSuggestions,
  getLocationSuggestions
} = require("../controllers/listingSearchController");

router.get("/", getLocations);
router.get("/filters", getSidebarFilters);
router.get("/search", searchListings);
router.get("/suggestions", getSuggestions);
router.get("/random", getRandomListings); // 👈 ADD HERE
router.get("/location-suggestions", getLocationSuggestions);

module.exports = router;
