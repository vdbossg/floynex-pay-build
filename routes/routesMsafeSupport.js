const express = require("express");
const router = express.Router();
const { replySupport } = require("../controllers/controllersMsafeSupport");

const {
  createSupport,
  getSupport
} = require("../controllers/controllersMsafeSupport");

// ================= ROUTES =================

// POST → Create ticket
router.post("/", createSupport);

// GET → Get all tickets
router.get("/", getSupport);
router.post("/reply/:id", replySupport);
module.exports = router;
