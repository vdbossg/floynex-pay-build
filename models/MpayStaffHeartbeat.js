const mongoose = require("mongoose");

const staffHeartbeatSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MpayStaff",
    required: true
  },
  date: {
    type: String, // Stored as "YYYY-MM-DD"
    required: true
  },
  firstLogin: { type: Date },
  lastSeen: { type: Date },
  totalOnlineSeconds: { type: Number, default: 0 },
  totalWorkingSeconds: { type: Number, default: 0 }
});

// Ensures performance remains blazing fast by indexing queries
staffHeartbeatSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MpayStaffHeartbeat", staffHeartbeatSchema);