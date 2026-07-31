//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\models\AgentAccount.js
const mongoose = require("mongoose");

const agentAccountSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    surname: {
      type: String,
      default: ""
    },
    idType: {
      type: String,
      enum: ["NATIONAL_ID", "PASSPORT"],
      default: "NATIONAL_ID"
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["APPROVED", "SUSPENDED", "INACTIVE"],
      default: "APPROVED"
    },

    // 🔑 Unique Agent Wallet Identifiers
    agentAccountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    agentCode: {
      type: String, // e.g. AGT-789012
      required: true,
      unique: true,
      index: true
    },
    agentShopNumber: {
      type: String, // e.g. ASN0000001
      required: true,
      unique: true,
      index: true
    },

    // 💰 Balances
    balance: {
      type: Number,
      default: 0.0
    },
    floatBalance: {
      type: Number,
      default: 0.0
    },
    commissionBalance: {
      type: Number,
      default: 0.0
    },
    currency: {
      type: String,
      default: "KES"
    },

    // 🔐 Security Credentials
    password: {
      type: String,
      default: null
    },
    pin: {
      type: String,
      default: null
    },
    isPasswordSet: {
      type: Boolean,
      default: false
    },
    isPinSet: {
      type: Boolean,
      default: false
    },

    // 📩 Activation Token (One-time link token sent via email)
    activationToken: {
      type: String,
      default: null
    },
    activationTokenExpires: {
      type: Date,
      default: null
    },

    accountStatus: {
      type: String,
      enum: ["PENDING_SET_CREDENTIALS", "ACTIVE", "FROZEN"],
      default: "PENDING_SET_CREDENTIALS"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AgentAccount ||
  mongoose.model("AgentAccount", agentAccountSchema);