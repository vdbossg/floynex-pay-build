// M-Safe/backend/models/Transaction.js

const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
        user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    merchantRequestID: {
      type: String,
      required: true
    },
    checkoutRequestID: {
      type: String,
      required: true,
      unique: true // prevents duplicate transactions
    },
    resultCode: {
      type: Number,
      required: true
    },
    resultDesc: {
      type: String
    },
    amount: {
      type: Number,
      default: 0
    },
    mpesaReceiptNumber: {
      type: String,
      default: null
    },
    phoneNumber: {
      type: String,
      default: null
    },
    transactionDate: {
      type: String,
      default: null
    },

    // ✅ NEW FIELDS
    name: {
      type: String,
      default: "Customer"
    },
    time: {
      type: String,
      default: null
    },
    date: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
