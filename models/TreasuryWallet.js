//M-Safe\backend\models\TreasuryWallet.js
const mongoose = require("mongoose");

const treasurySchema = new mongoose.Schema({
  usdtBalance: {
    type: Number,
    default: 0
  },

  trxBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("TreasuryWallet", treasurySchema);