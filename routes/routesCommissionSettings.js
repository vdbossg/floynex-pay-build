// backend/routes/routesCommissionSettings.js

const express = require("express");
const router = express.Router();

const staffAuth = require("../middleware/staffAuth");

const {
  createCommissionSettings,
  getCommissionSettings,
  updateCommissionSettings
} = require("../controllers/controllerCommissionSettings");

// Create
router.post("/", staffAuth, createCommissionSettings);

// Read
router.get("/", staffAuth, getCommissionSettings);

// Update
router.put("/", staffAuth, updateCommissionSettings);

module.exports = router;
