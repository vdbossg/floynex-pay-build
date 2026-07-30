//backend\models\Affiliate.js
const mongoose = require("mongoose");

const AffiliateSchema = new mongoose.Schema(
  {
    // Link if affiliate later creates a user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    promoCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },

    national: {
      type: {
        type: String,
        enum: ["id", "passport"],
        required: true
      },

      number: {
        type: String,
        required: true,
        unique: true
      }
    },

    documents: {
      front: {
        type: String,
        default: null
      },

      back: {
        type: String,
        default: null
      },

      agreements: [
        {
          type: String
        }
      ]
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending"
    },

    active: {
      type: Boolean,
      default: false
    },

    commissionRate: {
      type: Number,
      default: 30
    },

    totalReferredUsers: {
      type: Number,
      default: 0
    },

    totalSubscribedUsers: {
      type: Number,
      default: 0
    },

    totalCommissionEarned: {
      type: Number,
      default: 0
    },

    lastPaidDate: {
      type: Date,
      default: null
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    declinedReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Affiliate", AffiliateSchema);
