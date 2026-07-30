//FLOYNEX PAY\backend\controllers\controllersMSafeTransfer.js
const {
  transferWalletToWallet
} = require("../services/servicesMSafeTransfer");

exports.sendMoney = async (req, res) => {
  try {
    const {
  accountNumber,
  amount,
  pin,
  identityType
} = req.body;

    if (!accountNumber || !amount || !pin) {
      return res.status(400).json({
        status: "error",
        message: "Account, amount and PIN are required"
      });
    }

    const result = await transferWalletToWallet(
  req.user.id,
  accountNumber,
  Number(amount),
  pin,
  identityType
);

    res.json({
      status: "success",
      message: "Transfer successful",
      data: result
    });

  } catch (error) {
    console.error("❌ Transfer Error:", error.message);

    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};
// 🔥 NEW: Look up receiver account and resolve active display identity
exports.lookupAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const Wallet = require("../models/modelsMSafewallet");
    const User = require("../models/User");

    const targetWallet = await Wallet.findOne({ accountNumber });
    if (!targetWallet) {
      return res.status(404).json({ status: "error", message: "Account not found" });
    }

    const targetUser = await User.findById(targetWallet.user);
    if (!targetUser) {
      return res.status(404).json({ status: "error", message: "User profile not found" });
    }

    // Determine the live presentation name state
    const displayName =
      targetWallet.paymentIdentity === "business" && targetUser.businessName && targetUser.businessName.trim()
        ? targetUser.businessName
        : `${targetUser.firstName} ${targetUser.lastName}`;

    return res.json({
      status: "success",
      accountNumber: targetWallet.accountNumber,
      displayName
    });

  } catch (err) {
    console.error("❌ Lookup Error:", err.message);
    return res.status(500).json({ status: "error", message: "Server error during lookup" });
  }
};
