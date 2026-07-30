// backend/routes/settingsUser.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  updateBusiness,
  changePassword
} = require("../controllers/settingsController");

// Get user profile
router.get("/profile", auth, getProfile);

// Update profile info
router.put("/profile", auth, updateProfile);

// Update business info
router.put("/business", auth, updateBusiness);

// Change password
router.put("/password", auth, changePassword);

module.exports = router;