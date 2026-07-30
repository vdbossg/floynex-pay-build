//FLOYNEX PAY\backend\models\modelstransactionStatment.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["send", "receive", "request"],
    required: true
  },

  direction: {
    type: String,
    enum: ["in", "out"], // in = + , out = -
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  accountNumber: String,

fullName: String,
counterpartyName: String,

status: {
  type: String,
  enum: ["pending", "success", "failed"],
  default: "success"
}


}, { timestamps: true });

module.exports = mongoose.model("TransactionStatement", transactionSchema);
