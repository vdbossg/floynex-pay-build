//M-Safe\backend\models\MpayAdminWithdraws.js
const mongoose = require("mongoose");

const mpayAdminWithdrawSchema = new mongoose.Schema({
  type: { type: String, default: "withdraw" },
  amount: { type: Number, required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "MpayStaffsAdmins" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reference: { type: String },
  description: { type: String },
  status: { type: String, default: "completed" }
}, { timestamps: true });

module.exports =
  mongoose.models.MpayAdminWithdraws ||
  mongoose.model("MpayAdminWithdraws", mpayAdminWithdrawSchema);