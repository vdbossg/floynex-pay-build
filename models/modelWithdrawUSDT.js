//M-Safe\backend\models\modelWithdrawUSDT.js
const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  amountKES: Number,
  amountUSDT: Number,

  tronAddress: String,

  status: {
    type: String,
    enum: ["pending", "processing", "success", "failed"],
    default: "pending"
  },

  txHash: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WithdrawUSDT", withdrawSchema);