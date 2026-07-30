//M-Safe\backend\models\modelsM-SafeSupport.js
const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  category: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  ticketId: {
    type: String,
    unique: true
  },

  status: {
  type: String,
  enum: ["pending", "replied"],
  default: "pending"
},
reply: {
  type: String,
  default: ""
},

repliedAt: {
  type: Date,
  default: null
},

  createdAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportSchema);
