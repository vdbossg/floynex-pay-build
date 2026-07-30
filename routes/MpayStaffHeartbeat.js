const express = require("express");
const router = express.Router();
const controller = require("../controllers/MpayStaffHeartbeat");

const staffAuth = require("../middleware/staffAuth");
const allowRoles = require("../middleware/staffRoles");

router.post("/pulse", staffAuth, controller.pulse);
router.get("/performance/me", staffAuth, controller.getMyPerformance);
router.get(
  "/performance/all", 
  staffAuth, 
  allowRoles("CEO", "Manager", "Stafs Manager", "HR", "Owner", "Dev"), 
  controller.getAllStaffPerformance
);

module.exports = router;