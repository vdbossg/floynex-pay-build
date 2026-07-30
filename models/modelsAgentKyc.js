const mongoose = require("mongoose");
const agentDB = require("../config/agentDB");

const agentKycSchema = new mongoose.Schema({
  applicationNumber: String,
  firstName: String,
  lastName: String,
  surname: String,
  idType: String,
  idNumber: String,
  email: String,
  phone: String,

  status: {
    type: String,
    enum: [
      "PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "NEEDS_CORRECTION"
    ],
    default: "PENDING"
  },

  rejectionReason: {
    type: String,
    default: null
  },

  reviewerNote: {
    type: String,
    default: null
  },

  reviewedAt: {
    type: Date,
    default: null
  },

  reviewedBy: {
    adminId: String,
    adminCode: String,
    adminName: String
  },

  documents: Array,

  createdAt: Date,
  updatedAt: Date

});

// IMPORTANT:
// Register this model on the FLOYNEX-AGENT connection,
// not the default FLOYNEX-BUILD connection.
module.exports = agentDB.model(
  "AgentKyc",
  agentKycSchema,
  "agentapplies"
);