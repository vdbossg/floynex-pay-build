//M-Safe\backend\models\MSafeVault.js
const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "MSafe_MAIN_VAULT"
  },
  balance: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: "KES"
  }
}, { timestamps: true });

module.exports = mongoose.models.MSafeVault || mongoose.model("MSafeVault", vaultSchema);
