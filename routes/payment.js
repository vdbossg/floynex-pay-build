//FLOYNEX PAY\backend\routes\payment.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getToken,
  stkPush,
  callback,
  getTransactions,
  getTransactionAuditLogs
} = require("../controllers/paymentController");

// =========================
// MPESA TOKEN (PUBLIC)
// =========================
router.get("/token", getToken);

// =========================
// STK PUSH (PROTECTED)
// =========================
router.post("/stk", auth, stkPush);

// =========================
// CALLBACK (PUBLIC - MPESA)
// =========================
router.post("/callback", callback);

// =========================
// GET TRANSACTIONS (PROTECTED)
// =========================
router.get("/transactions", auth, getTransactions);

// =========================
// TEST PROTECTED ROUTE
// =========================
router.get("/", auth, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user
  });
});
// =========================
// GET LOGGED-IN USER RECORDS (PROTECTED)
// =========================
router.get("/myrecords", auth, async (req, res) => {
  try {
    // Find transactions only for the logged-in user
    const transactions = await require("../models/Transaction")
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: transactions
    });
  } catch (error) {
    console.error("❌ MyRecords Error:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});
// =========================
// ADMIN: TRANSACTION AUDIT LOGS
// =========================
router.get(
  "/admin/transactions/audit",
  auth,
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  },
  getTransactionAuditLogs
);
module.exports = router;
