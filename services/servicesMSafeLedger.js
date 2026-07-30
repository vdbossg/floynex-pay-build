// services/servicesMSafeLedger.js
const MSafeLedger = require("../models/MSafeLedger");

exports.getVaultWithdrawals = async () => {
  // Fetch only withdrawals from the vault
  const withdrawals = await MSafeLedger.find({ type: "withdraw" })
    .sort({ createdAt: -1 }) // latest first
    .populate("fromUser toUser", "first_name last_name email"); // optional, populate user info

  return withdrawals;
};