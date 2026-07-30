//M-Safe\backend\models\MSafeLedger.js
const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["deposit", "transfer", "withdraw"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  reference: {
    type: String
  },

  description: {
    type: String
  },

  status: {
    type: String,
    default: "completed"
  }

}, { timestamps: true });

module.exports = mongoose.model("MSafeLedger", ledgerSchema);
