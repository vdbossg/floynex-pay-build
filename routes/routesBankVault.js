//FLOYNEX PAY\backend\routes\routesBankVault.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getVault, withdraw } = require("../controllers/controllersBankVault");

// Vault data (GET)
router.get("/", auth, getVault);

// Withdraw to wallet (POST)
router.post("/withdraw", auth, withdraw);

module.exports = router;
