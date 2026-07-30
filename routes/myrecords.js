const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getMyRecords } = require("../controllers/myrecordsController");

// ✅ GET transactions for logged-in user
router.get("/", auth, getMyRecords);

module.exports = router;