// M-Safe/backend/msafe-backend/controllers/controllersBankVault.js

const { getVaultData, withdrawToWallet } = require("../services/servicesBankVault");
const Subscription = require("../models/Subscription"); // <-- ADD THIS

// ✅ GET FULL VAULT DATA (SUBSCRIPTIONS ONLY)
exports.getVault = async (req, res) => {
  try {

    const subscriptions = await Subscription.find({
      status: "active"
    });

    const totalDeposits = subscriptions.reduce(
      (sum, sub) => sum + Number(sub.amount || 0),
      0
    );

    res.json({
      status: "success",
      vault: {
        balance: totalDeposits,
        totalDeposits: totalDeposits,
        totalWithdrawals: 0,
        currency: "KES"
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ WITHDRAW TO WALLET
exports.withdraw = async (req, res) => {
  try {
    const { walletAccountNumber, amount, staffPassword } = req.body;
    const staffId = req.user.id;

    if (!walletAccountNumber || !amount || !staffPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await withdrawToWallet({
      staffId,
      staffPassword,
      walletAccountNumber,
      amount
    });

    res.json({
      status: "success",
      message: "Withdrawal successful",
      vault: result.vault,
      wallet: result.wallet
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
