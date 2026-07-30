// C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\routes\routesApproveAgentKycs.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/controllersApproveAgentKycs");
const staffAuth = require("../middleware/staffAuth");

// Protected staff routes
router.get("/", staffAuth, controller.getAgentKycs);
router.post("/review", staffAuth, controller.processAgentKycApproval);

module.exports = router;