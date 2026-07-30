// backend/controllers/callCenterAgentController.js
const CallCenterAgent = require("../models/callCenterAgentModel");

// Helper to ensure skills is always a valid array matching the enum values
const normalizeSkills = (skills) => {
  if (!skills) return ["general"];
  const array = Array.isArray(skills) ? skills : [skills];
  const validSkills = ["wallet", "payments", "security", "fraud", "general"];
  const filtered = array.filter(skill => validSkills.includes(skill));
  return filtered.length > 0 ? filtered : ["general"];
};

// 1. Add / Save an Agent to the Roster
exports.addAgentToRoster = async (req, res, next) => {
  try {
    const { userId, role, email, name, phoneNumber, skills } = req.body;

    // Check if they are already added
    const existing = await CallCenterAgent.findOne({ userId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Staff member is already registered as an agent." });
    }

    const newAgent = new CallCenterAgent({
      userId,
      role,
      email,
      name,
      phoneNumber,
      skills: normalizeSkills(skills) // Normalized array
    });

    await newAgent.save();
    return res.status(201).json({ success: true, message: "Staff successfully added to call center roster.", agent: newAgent });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Call Center Roster Agents (Combined with Dynamic Presence Status)
exports.getRosterAgents = async (req, res, next) => {
  try {
    // 1. Fetch static roster configurations
    const agents = await CallCenterAgent.find({}).lean();
    
    // 2. Safely import and pull all live running presence sessions
    const { AgentSession } = require("../models/callCenterModel");
    const liveSessions = await AgentSession.find({}).lean();

    // 3. Perform an object map merge to stitch the real-time truth together
    const mergedAgents = agents.map(agent => {
      const currentActiveSession = liveSessions.find(
        session => session.staffId && String(session.staffId) === String(agent.userId)
      );

      return {
        ...agent,
        // If an active session exists, forward its real runtime status ('available', 'busy', 'offline')
        // If no session exists in the DB, it means they are completely logged out/offline
        status: currentActiveSession ? currentActiveSession.status : 'offline'
      };
    });

    return res.status(200).json({ 
      success: true, 
      agents: mergedAgents 
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Agent Target Parameters (e.g. dynamic phone update)
exports.updateRosterAgent = async (req, res, next) => {
  try {
    const { userId, phoneNumber, isCallCenterActive, skills, role, email, name } = req.body;
    const cleanSkills = normalizeSkills(skills);

    const updatedAgent = await CallCenterAgent.findOneAndUpdate(
      { userId },
      { 
        phoneNumber, 
        isCallCenterActive,
        skills: cleanSkills,
        role,
        email,
        name
      },
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ success: false, message: "Agent record not found." });
    }

    // 🔄 CRITICAL SYNC: Update their active session cache instantly if online
    const { AgentSession } = require("../models/callCenterModel");
    
    // Build update dynamic payload
    const sessionUpdate = {
      agentPhone: phoneNumber, 
      skills: cleanSkills
    };

    // If deactivated from roster, flag their session offline so they drop out of queue distribution
    if (isCallCenterActive === false) {
      sessionUpdate.status = "offline";
      sessionUpdate.currentCallSessionId = null;
    }

    await AgentSession.findOneAndUpdate(
      { staffId: userId },
      sessionUpdate
    );

    return res.status(200).json({ success: true, message: "Agent updated successfully and session synchronized.", agent: updatedAgent });
  } catch (error) {
    next(error);
  }
};

// 4. Remove / Delete an Agent from the Roster
exports.removeAgentFromRoster = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const deleted = await CallCenterAgent.findOneAndDelete({ userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Agent record not found." });
    }

    // 🔄 CRITICAL CLEANUP: Vaporize their active session so no calls route to them
    const { AgentSession } = require("../models/callCenterModel");
    await AgentSession.findOneAndDelete({ staffId: userId });

    return res.status(200).json({ success: true, message: "Staff removed from call center roster configuration and active session cleared." });
  } catch (error) {
    next(error);
  }
};
// ==========================================
// ADD THIS AT THE BOTTOM OF THE FILE
// ==========================================

// Get Dashboard Details for the Logged-In Agent
exports.getAgentDashboardData = async (req, res, next) => {
  try {
    const { userId } = req.params; 

    // 1. Fetch Agent Profile Roster configuration
    const agentProfile = await CallCenterAgent.findOne({ userId }).lean();
    if (!agentProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Agent profile not found in roster." 
      });
    }

    // 2. Fetch Active Session Presence
    const { AgentSession, CallSession } = require("../models/callCenterModel");
    const session = await AgentSession.findOne({ staffId: userId }).lean();
    const presenceStatus = session ? session.status : "offline";

    // 3. Get Call Stats specific to this agent
    const completedCallsCount = await CallSession.countDocuments({ 
      assignedAgentId: session ? session._id : null, 
      callStatus: "completed" 
    });

    // 4. Get general Queue / Telemetry stats
    const queuedCallsCount = await CallSession.countDocuments({ callStatus: "queued" });
    const missedCallsCount = await CallSession.countDocuments({ callStatus: "missed" });

    // 5. Get the agent's current connected call (if any)
let activeCallMetadata = null;

if (session?.currentCallSessionId) {
  const activeCall = await CallSession.findOne({
    sessionId: session.currentCallSessionId
  }).lean();

  if (activeCall) {
    activeCallMetadata = {
      sessionId: activeCall.sessionId,
      clientPhoneNumber: activeCall.clientPhoneNumber,
      language: activeCall.language,
      service: activeCall.selectedService,
      callStatus: activeCall.callStatus,
      joinedQueueAt: activeCall.joinedQueueAt,
      createdAt: activeCall.createdAt,
      completedAt: activeCall.completedAt
    };
  }
}

    return res.status(200).json({
      success: true,
      profile: {
        ...agentProfile,
        presenceStatus
      },
      stats: {
        pendingQueue: queuedCallsCount,
        missed: missedCallsCount,
        completed: completedCallsCount
      },
      activeCall: activeCallMetadata
    });
  } catch (error) {
    next(error);
  }
};
