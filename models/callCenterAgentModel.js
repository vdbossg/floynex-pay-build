//\models\callCenterAgentModel.js
const mongoose = require("mongoose");

const callCenterAgentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "MpayStaff", required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, required: true },
  // ◄ ADDED: Validated array of custom Floynex skill categories
  skills: [{ 
    type: String, 
    enum: ["wallet", "payments", "security", "fraud", "general"], 
    default: ["general"] 
  }],
  isCallCenterActive: { type: Boolean, default: true },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CallCenterAgent", callCenterAgentSchema);
