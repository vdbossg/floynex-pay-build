const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const TransactionStatement = require("../models/modelstransactionStatment");

// ✅ GET ALL TRANSACTIONS FOR LOGGED USER
router.get("/", auth, async (req, res) => {
  try {

    const transactions = await TransactionStatement.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: transactions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch transactions"
    });
  }
});

module.exports = router;
