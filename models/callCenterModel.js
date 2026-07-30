//backend\models\callCenterModel.js
const mongoose = require("mongoose");

// Schema to track agent availability and current active calls
const AgentSessionSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "MpayStaff", required: true, unique: true },
  agentName: { type: String, required: true },
  agentPhone: { type: String, required: true }, // The phone number the agent uses to answer customer calls
  status: { type: String, enum: ["available", "busy", "offline"], default: "offline" },
  // ◄ ADDED: Keeps the running session synchronized with agent skill definitions
  skills: [{ 
    type: String, 
    enum: ["wallet", "payments", "security", "fraud", "general"], 
    default: ["general"] 
  }],
  currentCallSessionId: { type: String, default: null },
  lastHeartbeat: { type: Date, default: Date.now }
}, { timestamps: true });

// Schema to log every inbound customer call and queue position
const CallSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  clientPhoneNumber: { type: String, required: true },
  language: { type: String, enum: ["english", "kiswahili", "undetermined"], default: "undetermined" },
  selectedService: { type: String, default: null },
  callStatus: { type: String, enum: ["menu", "queued", "connected", "completed", "missed"], default: "menu" },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentSession", default: null },
  joinedQueueAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

const AgentSession = mongoose.model("AgentSession", AgentSessionSchema);
const CallSession = mongoose.model("CallSession", CallSessionSchema);

module.exports = { AgentSession, CallSession };
