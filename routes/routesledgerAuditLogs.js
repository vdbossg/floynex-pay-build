//backend\routes\routesledgerAuditLogs.js
const express = require("express");

const router = express.Router();

const controller =
require("../controllers/controllersledgerAuditLogs");

router.get(
  "/all",
  controller.getAllLedgerAuditLogs
);

router.get(
  "/:id",
  controller.getLedgerAuditLogById
);

module.exports = router;