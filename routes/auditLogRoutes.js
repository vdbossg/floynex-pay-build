//backend\routes\auditLogRoutes.js
const express = require("express");
const router = express.Router();

const {
  getUserAuditLogs,
  getAllAuditLogs
} = require("../controllers/auditLogController");

const staffAuth = require("../middleware/staffAuth");

router.get("/user/:userId", staffAuth, getUserAuditLogs);
router.get("/all", staffAuth, getAllAuditLogs);

module.exports = router;
