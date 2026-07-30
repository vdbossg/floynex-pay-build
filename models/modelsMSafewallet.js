//FLOYNEX PAY\backend\models\modelsMSafewallet.js
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },

  accountNumber: {
    type: String,
    unique: true,
    required: true
  },

  firstName: String,
  middleName: String,
  lastName: String,

  idNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/empty fields if email isn't provided
    index: true
  },

 // Account Type
paymentIdentity: {
  type: String,
  enum: ["personal", "business"],
  default: "personal"
},
  documentType: {
    type: String,
    enum: ["id", "passport"],
    default: "id"
  },

  documentFront: {
    type: String
  },

  documentBack: {
    type: String
  },

  balance: {
    type: Number,
    default: 0
  },

  currency: {
    type: String,
    default: "KES"
  },

  pin: {
    type: String,
    required: true
  },

  kycStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },

  isVerified: {
    type: Boolean,
    default: false
  },
otp: {
  type: String
},
otpExpires: {
  type: Date
},
pendingPin: {
  type: String
},

  status: {
    type: String,
    enum: ["active", "frozen"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.models.MSafeWallet || mongoose.model("MSafeWallet", walletSchema);
