const express = require("express");
const router = express.Router();
const firebaseAuth = require("../middleware/firebaseAuth");

const { createEnquiry, getOwnerEnquiries, updateStatus, deleteEnquiry, replyEnquiry, getAllEnquiriesAdmin, getUserEnquiries } = require("../controllers/enquiryController");

router.post("/create", firebaseAuth, createEnquiry);

router.get("/owner", firebaseAuth, getOwnerEnquiries);
router.put("/status/:id", firebaseAuth, updateStatus);
router.delete("/:id", firebaseAuth, deleteEnquiry);

router.put("/reply/:id", firebaseAuth, replyEnquiry);
router.get("/user", firebaseAuth, getUserEnquiries);

router.get("/admin", firebaseAuth, getAllEnquiriesAdmin);
module.exports = router;