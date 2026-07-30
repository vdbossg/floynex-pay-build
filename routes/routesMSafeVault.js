//M-Safe\backend\routes\routesMSafeVault.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { getVault } = require("../controllers/controllersMSafeVault");

// ✅ ADMIN VAULT VIEW
router.get("/", auth, getVault);

module.exports = router;
