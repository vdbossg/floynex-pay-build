//backend\routes\routesMSafeTransfer.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  sendMoney,
  lookupAccount
} = require("../controllers/controllersMSafeTransfer");
// Wallet → Wallet transfer
router.post("/send", auth, sendMoney);
// Add this below your existing send/transfer routes
router.get("/lookup/:accountNumber", auth, lookupAccount);
module.exports = router;
