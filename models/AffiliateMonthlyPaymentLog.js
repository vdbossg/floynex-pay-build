//backend\models\AffiliateMonthlyPaymentLog.js
const mongoose = require("mongoose");

const AffiliateMonthlyPaymentLogSchema = new mongoose.Schema(
  {
    affiliateMonthlySummaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AffiliateMonthlySummary",
      required: true
    },

    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true
    },

    promoCode: String,
    month: Number,
    year: Number,

    amountPaid: Number,

    paymentStatusBefore: String,
    paymentStatusAfter: String,

    paidBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MpayStaff"
      },
      name: String,
      email: String,
      role: String
    },

    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AffiliateMonthlyPaymentLog",
  AffiliateMonthlyPaymentLogSchema
);