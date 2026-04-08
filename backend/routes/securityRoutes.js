const express = require("express");
const router = express.Router();
const controller = require("../controllers/securityController");
const firebaseAuth = require("../middleware/firebaseAuth"); // 🔥 import middleware

router.delete(
  "/delete/:firebaseUid",
  firebaseAuth,                // 🔥 ADD THIS
  controller.deleteAccount
);

router.put(
  "/deactivate/:firebaseUid",
  firebaseAuth,                // 🔥 ADD THIS
  controller.deactivateAccount
);

router.put(
  "/reactivate/:firebaseUid",
  firebaseAuth,
  controller.reactivateAccount
);

module.exports = router;
