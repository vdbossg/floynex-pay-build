//FLOYNEX PAY\backend\routes\routesMSafeRequest.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const MSafeWallet = require("../models/modelsMSafewallet");
const controller = require("../controllers/controllersMSafeRequest");

// 🔥 ADD THIS IMPORT
const {
  sendStatementRequestEmail
} = require("../serviceEmail");
const { generateTransactionPDF } = require("../servicePDF");
const Transaction = require("../models/Transaction"); // ⚠️ adjust if your model name is different
router.post("/create", auth, controller.create);
router.get("/pending", auth, controller.pending);
router.post("/approve", auth, controller.approve);
router.post("/reject", auth, controller.reject);
router.get("/status/:id", auth, controller.status);

router.post("/statement", auth, async (req, res) => {
  try {
    const { startDate, endDate, email, pin } = req.body;
    const userId = req.user.id;

    if (!startDate || !endDate || !email) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN required" });
    }

    // 1. Get wallet
    const wallet = await MSafeWallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    // 2. Verify PIN (HASHED)
    const isPinValid = await bcrypt.compare(pin, wallet.pin);
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: "Invalid PIN" });
    }

    // 3. FETCH TRANSACTIONS
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // FORMAT DATES FOR DISPLAY CLEANING
    const formatDate = (d) =>
      new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

    const displayStart = formatDate(startDate);
    const displayEnd = formatDate(endDate);

    const filtered = await Transaction.find({
  user: userId,
  resultCode: 0, // 🔥 Only fetch successful/paid transactions
  createdAt: {
    $gte: start,
    $lte: end
  }
}).sort({ createdAt: -1 });

    console.log("🔥 Transactions found:", filtered.length);

    if (filtered.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for selected period"
      });
    }

    // ✅ FIXED PARAMETER MAPPING COMPATIBILITY HERE
    // Send email using exact structure defined in serviceEmail.js: 
    // sendStatementRequestEmail(to, wallet, startDate, endDate, transactions)
    // 🔥 5. SEND EMAIL WITH PDF
await sendStatementRequestEmail(
  email,
  wallet,
  displayStart,  // Fixes the broken period date labels
  displayEnd,    // Fixes the broken period date labels
  filtered       // Fixes the empty table data by passing the actual transactions array!
);

    return res.json({
      success: true,
      message: "Statement request email sent"
    });

  } catch (err) {
    console.log("EMAIL ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
