const Transaction = require("../models/Transaction");

// GET /api/myrecords
exports.getMyRecords = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ get logged-in user from JWT

    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: transactions.map(t => ({
        status: t.resultCode === 0 ? "success" : t.resultCode === 1 ? "pending" : "failed",
        message: t.resultDesc,
        amount: t.amount,
        phone: t.phoneNumber,
        receipt: t.mpesaReceiptNumber,
        name: t.name,
        time: t.time,
        date: t.date || "",
      }))
    });
  } catch (err) {
    console.error("❌ Error fetching user records:", err);
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
};