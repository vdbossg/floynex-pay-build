//backend\models\AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "TRANSFER",
        "DEPOSIT",
        "WITHDRAW",
        "REQUEST",
        "SYSTEM"
      ]
    },

    entityType: {
      type: String,
      required: true
    },

    entityId: {
      type: String,
      default: null
    },

    ipAddress: {
      type: String,
      default: null
    },
// ... existing code ...
    entityId: {
      type: String,
      default: null,
      index: true // Add this line
    },
// ...
    device: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
