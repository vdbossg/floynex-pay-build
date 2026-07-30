//backend\models\AffiliateMonthlySummary.js
const mongoose = require("mongoose");

const AffiliateMonthlySummarySchema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
      index: true
    },

    affiliateName: {
      type: String,
      required: true
    },

    promoCode: {
      type: String,
      required: true,
      index: true
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    monthName: {
      type: String,
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    commissionRate: {
      type: Number,
      required: true,
      default: 0
    },

    subscriptionFee: {
      type: Number,
      required: true,
      default: 0
    },

    totalReferredUsers: {
      type: Number,
      default: 0
    },

    totalSubscribedUsers: {
      type: Number,
      default: 0
    },

    grossSales: {
      type: Number,
      default: 0
    },

    commissionEarned: {
      type: Number,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now
    },
paidAt: Date,

paidBy: {
  adminId: String,
  fullName: String,
  email: String,
  role: String
},
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/*
One record only
per affiliate
per month
per year
*/
AffiliateMonthlySummarySchema.index(
  {
    affiliateId: 1,
    month: 1,
    year: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "AffiliateMonthlySummary",
  AffiliateMonthlySummarySchema
);
