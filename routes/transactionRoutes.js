//M-Safe\backend\routes\transactionRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const MSafeWallet = require("../models/modelsMSafewallet");
const auth = require("../middleware/authMiddleware");
const TransactionStatement = require("../models/modelstransactionStatment");
const { sendSendReceivedStatementEmail } = require("../serviceEmail"); 
// ✅ GET USER STATEMENT
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await TransactionStatement.find({
      user: userId
    })
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      status: "success",
      data: transactions
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

// ✅ POST: Email Sent/Received Statement
router.post("/email-sr-statement", auth, async (req, res) => {
  try {
    const { startDate, endDate, email, pin } = req.body;
    const userId = req.user.id;

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required" });
    }

    // ✅ Fetch wallet
    const wallet = await MSafeWallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    // ✅ Compare PIN
    const isPinValid = await bcrypt.compare(pin, wallet.pin);
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: "Invalid PIN" });
    }

    // ✅ Fetch Sent/Received transactions within date range
    const transactions = await TransactionStatement.find({
      user: userId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59") }
    }).sort({ createdAt: -1 });

    // ✅ Send email using the new service function
    await sendSendReceivedStatementEmail(email, wallet, transactions, startDate, endDate);

    res.json({ success: true, message: "Sent/Received statement emailed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || "Failed to send email" });
  }
});
module.exports = router;
