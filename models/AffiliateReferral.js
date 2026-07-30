//backend\models\AffiliateReferral.js
const mongoose = require("mongoose");

const AffiliateReferralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    promoCode: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    firstTimeSubscriptionStatus: {
  type: String,
  enum: ["pending", "subscribed"],
  default: "pending"
},

firstSubscriptionDate: {
  type: Date,
  default: null
},

subscriptionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Subscription",
  default: null
},

mpesaReceipt: {
  type: String,
  default: null
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("AffiliateReferral", AffiliateReferralSchema);
