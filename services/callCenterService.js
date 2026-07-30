// backend/services/callCenterService.js
const { AgentSession, CallSession } = require("../models/callCenterModel");
const CallCenterAgent = require("../models/callCenterAgentModel");

class CallCenterService {
  // Registers or updates an active support session for an internal agent
  async updateAgentStatus(staffId, agentName, agentPhone, status) {
    // Normalize status inputs to lowercase to avoid case-sensitivity issues
    let normalizedStatus = String(status).toLowerCase();
    let sessionResetFields = {};

    if (normalizedStatus.includes("available") || normalizedStatus.includes("online")) {
      normalizedStatus = "available";
      // Forcefully clear dead session locks when turning back online from the UI dashboard
      sessionResetFields = { currentCallSessionId: null };
    } else if (normalizedStatus.includes("offline")) {
      normalizedStatus = "offline";
      sessionResetFields = { currentCallSessionId: null };
    }

    // Fetch agent's skill rules from roster configuration to sync session cache
    const agentProfile = await CallCenterAgent.findOne({ userId: staffId });
    const skills = agentProfile ? agentProfile.skills : ["general"];

    // Automatically make sure the agent is marked active in roster configuration
    if (agentProfile && !agentProfile.isCallCenterActive) {
      await CallCenterAgent.updateOne({ userId: staffId }, { isCallCenterActive: true });
    }

    return await AgentSession.findOneAndUpdate(
      { staffId },
      { 
        agentName, 
        agentPhone, 
        status: normalizedStatus, 
        skills, 
        lastHeartbeat: new Date(),
        ...sessionResetFields 
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Gets count of online agents (status is available or busy)
  async getOnlineAgentsCount() {
    const heartbeatCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour backup buffer
    return await AgentSession.countDocuments({
      status: { $in: ["available", "busy"] },
      lastHeartbeat: { $gte: heartbeatCutoff }
    });
  }

  // Gets the list of active agents for the roster dashboard
  async getAgentRosterList() {
    const activeCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour backup buffer
    return await AgentSession.find({
      lastHeartbeat: { $gte: activeCutoff }
    }).sort({ agentName: 1 });
  }

  // Initializes a customer tracking session on incoming hook
  async initializeCall(sessionId, clientPhoneNumber) {
    let session = await CallSession.findOne({ sessionId });
    if (!session) {
      session = new CallSession({ sessionId, clientPhoneNumber });
      await session.save();
    }
    return session;
  }

  // Calculates how many callers are ahead of the current session
  async getQueuePosition(sessionId) {
    const currentCall = await CallSession.findOne({ sessionId });
    if (!currentCall || !currentCall.joinedQueueAt) return 1;

    const countBefore = await CallSession.countDocuments({
      callStatus: "queued",
      joinedQueueAt: { $lt: currentCall.joinedQueueAt }
    });

    return countBefore + 1;
  }

  // Atomically finds and locks the oldest available agent to distribute workload safely
  async claimAvailableAgent(requiredSkill = "general", sessionId) {
    const heartbeatCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour backup buffer

    // 1. Get all rostered staff userIds who match the requested skill
    const activeRoster = await CallCenterAgent.find({ 
      skills: requiredSkill 
    }).select("userId");
    
    // Map explicitly to MongoDB ObjectIds to prevent matching string vs ObjectId issues
    const allowedStaffIds = activeRoster.map(agent => agent.userId);

    console.log(`[IVR Dispatch] Searching for agents with skill: "${requiredSkill}". Found roster IDs:`, allowedStaffIds);

    // 2. Look for an online agent from that pool. Only check for normalized "available" status.
    let agent = await AgentSession.findOneAndUpdate(
      { 
        status: "available", 
        staffId: { $in: allowedStaffIds },
        lastHeartbeat: { $gte: heartbeatCutoff }
      },
      { status: "busy", currentCallSessionId: sessionId },
      { returnDocument: 'after' }
    ).sort({ updatedAt: 1 });

    // Fallback: If specialist is busy/offline, check for general support staff
    if (!agent && requiredSkill !== "general") {
      console.log(`[IVR Dispatch] No specialist found for "${requiredSkill}". Falling back to general support...`);
      const generalRoster = await CallCenterAgent.find({ 
        skills: "general" 
      }).select("userId");
      const generalStaffIds = generalRoster.map(a => a.userId);

      agent = await AgentSession.findOneAndUpdate(
        {
          status: "available",
          staffId: { $in: generalStaffIds },
          lastHeartbeat: { $gte: heartbeatCutoff }
        },
        { status: "busy", currentCallSessionId: sessionId },
        { returnDocument: 'after' }
      ).sort({ updatedAt: 1 });
    }

    // 3. If an agent was successfully claimed, update the customer's call session status
    if (agent) {
      console.log(`[IVR Dispatch] Agent SUCCESSFULLY CLAIMED: ${agent.agentName} (${agent.agentPhone})`);
      await CallSession.findOneAndUpdate(
        { sessionId }, 
        { callStatus: "connected", assignedAgentId: agent._id },
        { returnDocument: 'after' }
      );
    } else {
      console.log(`[IVR Dispatch] FAILED to claim agent. Queueing caller.`);
    }

    return agent;
  }

  // Releases an agent and sets call record to complete upon hanging up
  async terminateCall(sessionId) {
    // 1. Set the call session to completed
    const call = await CallSession.findOneAndUpdate(
      { sessionId },
      { callStatus: "completed", completedAt: new Date() },
      { returnDocument: 'after' }
    );

    // 2. Free up the agent. We match on currentCallSessionId to bypass ID mismatch issues completely!
    const freedAgent = await AgentSession.findOneAndUpdate(
      { currentCallSessionId: sessionId },
      {
        status: "available",
        currentCallSessionId: null
      },
      { returnDocument: 'after' }
    );

    if (freedAgent) {
      console.log(`[IVR Dispatch] Call ended for session ${sessionId}. Freed agent: ${freedAgent.agentName}`);
    } else {
      console.log(`[IVR Dispatch] Call ended for session ${sessionId}, but no locked agent session was found to free.`);
    }

    return call;
  }
}

module.exports = new CallCenterService();
