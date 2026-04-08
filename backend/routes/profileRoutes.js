const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const controller = require("../controllers/profileController");
const firebaseAuth = require("../middleware/firebaseAuth");

router.get("/:firebaseUid", firebaseAuth, controller.getProfile);
router.put("/:firebaseUid", firebaseAuth, controller.updateProfile);

// Image upload route
router.post(
  "/upload-image/:firebaseUid",
  upload.single("image"),
  firebaseAuth,
  controller.uploadProfileImage
);

module.exports = router;
