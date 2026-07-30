const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  servedBy: {
    type: String,
    required: true
  },

  to: {
    type: String,
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  targetType: {
    type: String,
    enum: ["individual", "all"],
    default: "individual"
  },

  type: {
    type: String,
    enum: [
      "normal",
      "urgent",
      "security",
      "promotion",
      "system"
    ],
    default: "normal"
  },

  sentStatus: {
    type: String,
    enum: ["pending", "sent", "failed", "received"],
    default: "pending"
  },

  receiverStatus: {
    type: String,
    enum: ["unread", "read"],
    default: "unread"
  },

  errorMessage: {
    type: String,
    default: null
  },

  sentAt: {
    type: Date,
    default: Date.now
  },

  readAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);