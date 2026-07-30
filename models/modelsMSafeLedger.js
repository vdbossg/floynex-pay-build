//FLOYNEX PAY\backend\models\modelsMSafeLedger.js
const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["deposit", "transfer", "withdraw"],
    required: true
  },

  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MSafeWallet",
    default: null
  },

  
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MSafeWallet",
    default: null
  },

  amount: {
    type: Number,
    required: true
  },

  reference: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.models.MSafeLedger || mongoose.model("MSafeLedger", ledgerSchema);
