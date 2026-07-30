//M-Safe\backend\models\modelsBankVault.js
const mongoose = require("mongoose");

const bankVaultSchema = new mongoose.Schema({
  name: { type: String, default: "MSAFE_MAIN_VAULT" },
  balance: { type: Number, default: 0 },
  totalDeposits: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  currency: { type: String, default: "KES" },
}, { timestamps: true });

module.exports = mongoose.models.BankVault || mongoose.model("BankVault", bankVaultSchema);