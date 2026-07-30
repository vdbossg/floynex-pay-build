//FLOYNEX PAY\backend\routes\MpayStaffsAdmins.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/MpayStaffsAdmins");

const staffAuth = require("../middleware/staffAuth");
const allowRoles = require("../middleware/staffRoles");
// Create staff (POST)
router.post("/create", staffController.createStaff);

// Get all staff (GET)
router.get("/", staffController.getAllStaff);

// Update staff status (POST)
router.post("/update", staffController.updateStaffStatus);

router.post("/login", staffController.loginStaff); // <-- ADD THIS
// Get currently logged in staff
router.get(
  "/me",
  staffAuth,
  staffController.getCurrentStaff
);
router.get(
  "/secure",
  staffAuth,
  allowRoles(
    "CEO",
    "Manager",
    "Stafs Manager",
    "HR",
    "Owner",
    "Dev"
  ),
  staffController.getAllStaffSecure
);
router.post(
  "/update-access",
  staffAuth,
  allowRoles(
    "CEO",
    "Manager",
    "Stafs Manager",
    "HR",
    "Owner",
    "Dev"
  ),
  staffController.updateStaffAccess
);
module.exports = router;
