//FLOYNEX PAY\backend\models\Withdrawal.js
const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletAccountNumber: { type: String, required: true },
  fullName: { type: String, required: true },
  amountWithdrawn: { type: Number, required: true },
  tariff: { type: Number, default: 0 },
  totalDeducted: { type: Number, required: true },
  remainingWalletBalance: { type: Number, required: true },
  remainingVaultBalance: { type: Number, required: true },
  conversationId: { type: String, required: true, unique: true, index: true }, // AG_...
  mpesaTransactionId: { type: String, default: null }, // UCV... comes later
  receiverName: {
  type: String,
  default: null
},


status: {
  type: String,
  default: "pending"
},
  phone: { type: String, required: true },
  date: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
