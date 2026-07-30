//M-Safe\backend\controllers\controllerWithdrawUSDT.js
const bcrypt = require("bcryptjs");
const MSafeWallet = require("../models/modelsMSafewallet");
const { withdrawUSDT } = require("../services/withdrawalService");

exports.withdrawUSDT = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountKES, tronAddress, pin, requestId } = req.body;

    // 1. Basic validation
    if (!amountKES || !tronAddress || !pin) {
  return res.status(400).json({ error: "Missing fields" });
}

    if (amountKES <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 2. Get wallet safely
    const wallet = await MSafeWallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // 3. PIN check
    const isMatch = await bcrypt.compare(pin, wallet.pin);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    // 4. Call service
    const result = await withdrawUSDT({
  userId,
  amountKES,
  tronAddress
});

    // 5. Response (FIXED)

// ✅ SUCCESS
if (result.status === "success" || result.status === "confirmed") {
  return res.json({
    message: "Withdrawal successful",
    txHash: result.txHash,
    data: result
  });
}

// ⏳ PENDING (NO TRX)
if (result.status === "pending") {
  return res.json({
    message: "Withdrawal pending (low TRX, will process soon)",
    data: result
  });
}

// ❌ FAILED
return res.status(400).json({
  message: "Withdrawal failed",
  error: result.error
});

  } catch (err) {
    console.log("Withdrawal error:", err.message);

    return res.status(500).json({
      error: err.message || "Internal server error"
    });
  }
};