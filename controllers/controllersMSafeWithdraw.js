const bcrypt = require("bcryptjs");
const MSafeWallet = require("../models/modelsMSafewallet");
const { debitVault } = require("../services/servicesMSafeVault");
const { debitUserWallet } = require("../services/servicesMSafewallet");
const { sendToMpesa } = require("../services/servicesMpesaB2C"); // We'll create this service next

// POST /api/withdraw
exports.withdrawToMpesa = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountNumber, amount, pin, phone } = req.body;

    if (!accountNumber || !amount || !pin || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: "accountNumber, amount, pin and phone are required" 
      });
    }

    
    // 1️⃣ Get wallet and validate
    const wallet = await MSafeWallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    if (wallet.accountNumber !== accountNumber) {
      return res.status(400).json({ success: false, message: "Invalid account number" });
    }

    // 2️⃣ Check PIN
    const isPinValid = await bcrypt.compare(pin, wallet.pin);
    if (!isPinValid) return res.status(401).json({ success: false, message: "Incorrect PIN" });

    // 3️⃣ Check wallet balance
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // 4️⃣ Debit wallet
    const updatedWallet = await debitUserWallet(userId, amount);

    // 5️⃣ Debit Vault (includes tariff)
    const vaultResult = await debitVault({ amount, userId, reference: "MPESA_WITHDRAWAL" });

    // 6️⃣ Send to Mpesa via B2C service
    const mpesaResult = await sendToMpesa({ phone, amount });

    // 7️⃣ Return structured response
    res.json({
      success: true,
      walletBalance: updatedWallet.balance,
      withdrawnAmount: vaultResult.withdrawnAmount,
      tariff: vaultResult.tariff,
      totalDeducted: vaultResult.totalDeducted,
      remainingVaultBalance: vaultResult.remainingVaultBalance,
      mpesaResult
    });

  } catch (err) {
    console.error("❌ Withdraw Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
