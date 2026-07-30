// backend/controllers/callCenterController.js
const { CallSession } = require("../models/callCenterModel");
const callCenterService = require("../services/callCenterService");

// Helper function to format phone numbers with '+' for Africa's Talking
const formatPhone = (phone) => {
  if (!phone) return "";
  return phone.toString().startsWith("+") ? phone : `+${phone}`;
};

exports.handleIncomingCall = async (req, res, next) => {
  try {
    // Added "isActive" to extraction
    const { sessionId, callerNumber, isActive } = req.body;
    const attempt = parseInt(req.query.attempt) || 1;

    // Added safety check: If call is terminated, exit immediately
    if (isActive === "0") {
      res.set("Content-Type", "text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
    }

    if (attempt === 1) {
      await callCenterService.initializeCall(sessionId, callerNumber);
    }

    res.set("Content-Type", "text/xml");
    
    if (attempt > 3) {
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>We did not receive any input after multiple attempts. Goodbye.</Say>
    <Reject/>
</Response>`);
    }

    let dynamicGreeting = "Welcome to Floynex Customer Care. For English, press 1. For Kiswahili, press 2.";
    if (attempt > 1) {
      dynamicGreeting = "Dear Floynex Customer, you didn't select any menu. Kindly, for English, press 1. For Kiswahili, press 2.";
    }

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits timeout="6" numDigits="1" callbackUrl="${req.protocol}://${req.get('host')}/api/callcenter/ivr-lang?attempt=${attempt}">
        <Say>${dynamicGreeting}</Say>
    </GetDigits>
    <Redirect>${req.protocol}://${req.get('host')}/api/callcenter/incoming?attempt=${attempt + 1}</Redirect>
</Response>`;
    
    return res.send(xmlResponse);
  } catch (error) {
    next(error);
  }
};

exports.handleLanguageSelection = async (req, res, next) => {
  try {
    // Added "isActive" to extraction
    const { sessionId, dtmfDigits, isActive } = req.body;
    const attempt = parseInt(req.query.attempt) || 1;

    // Added safety check: If call is terminated, exit immediately
    if (isActive === "0") {
      res.set("Content-Type", "text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
    }

    if (!dtmfDigits) {
      return res.redirect(`${req.protocol}://${req.get('host')}/api/callcenter/incoming?attempt=${attempt + 1}`);
    }

    let language = "english";
    let menuPrompt = "Press 1 for Wallet services. Press 2 for Deposits and Payments. Press 3 for Account Security. Press 4 to report Fraud or Scams. Press 5 for General support.";

    if (dtmfDigits === "2") {
      language = "kiswahili";
      menuPrompt = "Bonyeza moja kwa huduma za Wallet. Bonyeza mbili kwa Malipo. Bonyeza tatu kwa Usalama wa akaunti. Bonyeza nne kuripoti Utapeli. Bonyeza tano kwa msaada Mkuu.";
    }

    await CallSession.findOneAndUpdate({ sessionId }, { language }, { returnDocument: 'after' });

    res.set("Content-Type", "text/xml");
    
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits timeout="6" numDigits="1" callbackUrl="${req.protocol}://${req.get('host')}/api/callcenter/ivr-services?serviceAttempt=1">
        <Say>${menuPrompt}</Say>
    </GetDigits>
    <Redirect>${req.protocol}://${req.get('host')}/api/callcenter/ivr-services?serviceAttempt=2</Redirect>
</Response>`;
    return res.send(xmlResponse);
  } catch (error) {
    next(error);
  }
};

exports.handleServiceSelection = async (req, res, next) => {
  try {
    // Added "isActive" to extraction
    const { sessionId, dtmfDigits, isActive } = req.body;
    const serviceAttempt = parseInt(req.query.serviceAttempt) || 1;
    
    // Added safety check: If call is terminated, exit immediately
    if (isActive === "0") {
      res.set("Content-Type", "text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
    }

    const session = await CallSession.findOne({ sessionId });
    const isSwahili = session && session.language === "kiswahili";

    if (!dtmfDigits) {
      res.set("Content-Type", "text/xml");
      if (serviceAttempt > 3) {
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${isSwahili ? "Hatujapokea chaguo lako. Kwa heri." : "We did not receive your selection. Goodbye."}</Say>
    <Reject/>
</Response>`);
      }

      let retryPrefix = "";
      if (serviceAttempt > 1) {
        retryPrefix = isSwahili 
          ? "Mteja mpendwa wa Floynex, haujachagua huduma yoyote. Tafadhali tufuatilie. "
          : "Dear Floynex Customer, you did not make any choice. Kindly listen closely. ";
      }

      let menuPrompt = isSwahili 
        ? `${retryPrefix}Bonyeza moja kwa huduma za Wallet. Bonyeza mbili kwa Malipo. Bonyeza tatu kwa Usalama wa akaunti. Bonyeza nne kuripoti Utapeli. Bonyeza tano kwa msaada Mkuu.`
        : `${retryPrefix}Press 1 for Wallet services. Press 2 for Deposits and Payments. Press 3 for Account Security. Press 4 to report Fraud or Scams. Press 5 for General support.`;

      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetDigits timeout="6" numDigits="1" callbackUrl="${req.protocol}://${req.get('host')}/api/callcenter/ivr-services?serviceAttempt=${serviceAttempt}">
        <Say>${menuPrompt}</Say>
    </GetDigits>
    <Redirect>${req.protocol}://${req.get('host')}/api/callcenter/ivr-services?serviceAttempt=${serviceAttempt + 1}</Redirect>
</Response>`);
    }

    let requiredSkill = "general";
    let serviceName = "General Support";
    let serviceNameSwahili = "Msaada Mkuu";

    if (dtmfDigits === "1") {
      requiredSkill = "wallet";
      serviceName = "Wallet Services";
      serviceNameSwahili = "Huduma za Wallet";
    } else if (dtmfDigits === "2") {
      requiredSkill = "payments";
      serviceName = "Payments and Deposits";
      serviceNameSwahili = "Malipo";
    } else if (dtmfDigits === "3") {
      requiredSkill = "security";
      serviceName = "Account Security";
      serviceNameSwahili = "Usalama wa akaunti";
    } else if (dtmfDigits === "4") {
      requiredSkill = "fraud";
      serviceName = "Fraud and Scam Reporting";
      serviceNameSwahili = "Kuripoti Utapeli";
    } else if (dtmfDigits === "5") {
      requiredSkill = "general";
      serviceName = "General Support";
      serviceNameSwahili = "Msaada Mkuu";
    }

    await CallSession.findOneAndUpdate(
      { sessionId }, 
      { callStatus: "queued", joinedQueueAt: new Date(), selectedService: serviceName },
      { returnDocument: 'after' }
    );

    const availableAgent = await callCenterService.claimAvailableAgent(requiredSkill, sessionId);

    res.set("Content-Type", "text/xml");
    if (availableAgent) {
      const targetPhone = formatPhone(availableAgent.agentPhone);
      console.log(`[IVR] Bridging customer to agent at ${targetPhone}`);
      
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${isSwahili ? "Tafadhali subiri tukiunganisha simu yako kwa mhudumu." : "Please hold while we connect your call to a specialist."}</Say>
    <Dial phoneNumbers="${targetPhone}" maxDuration="7200" record="true" recordingUrlCallback="${req.protocol}://${req.get('host')}/api/callcenter/recording-callback" />
</Response>`);
    } else {
      const position = await callCenterService.getQueuePosition(sessionId);
      
      const queuePrompt = isSwahili 
        ? `Wanaoshughulikiwa sasa hivi ni wengi. Uko nambari ya ${position} kwenye foleni yetu ya ${serviceNameSwahili}. Asante kwa subira yako.`
        : `All agents are currently busy. You are next, number ${position}. Thank you for your patience.`;

      // Optimized: Plays music and redirects to queue-check automatically without expecting GetDigits feedback
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${queuePrompt}</Say>
    <Play url="https://api.msafeapp.com/assets/audio/hold_music.mp3"/>
    <Redirect>${req.protocol}://${req.get('host')}/api/callcenter/queue-check</Redirect>
</Response>`);
    }
  } catch (error) {
    next(error);
  }
};

exports.handleQueueCheck = async (req, res, next) => {
  try {
    // Added "isActive" to extraction
    const { sessionId, isActive } = req.body;

    // Added safety check: If call is terminated, exit immediately
    if (isActive === "0") {
      res.set("Content-Type", "text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response/>`);
    }

    const session = await CallSession.findOne({ sessionId });
    
    // Safety check: Cleanly hang up if call status changes to inactive
    if (!session || session.callStatus === "completed" || session.callStatus === "missed") {
      res.set("Content-Type", "text/xml");
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
    }

    const isSwahili = session.language === "kiswahili";
    
    let requiredSkill = "general";
    if (session.selectedService === "Wallet Services") requiredSkill = "wallet";
    else if (session.selectedService === "Payments and Deposits") requiredSkill = "payments";
    else if (session.selectedService === "Account Security") requiredSkill = "security";
    else if (session.selectedService === "Fraud and Scam Reporting") requiredSkill = "fraud";

    const availableAgent = await callCenterService.claimAvailableAgent(requiredSkill, sessionId);
    res.set("Content-Type", "text/xml");

    if (availableAgent) {
      const targetPhone = formatPhone(availableAgent.agentPhone);
      console.log(`[IVR Queue Check] Bridging customer to agent at ${targetPhone}`);

      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${isSwahili ? "Mhudumu amepatikana. Tafadhali subiri tukiunganisha." : "An agent is now available. Connecting your call."}</Say>
    <Dial phoneNumbers="${targetPhone}" record="true" recordingUrlCallback="${req.protocol}://${req.get('host')}/api/callcenter/recording-callback" />
</Response>`);
    }

    const position = await callCenterService.getQueuePosition(sessionId);
    let queuePrompt = "";

    if (position === 1) {
      queuePrompt = isSwahili
        ? "Tunathamini subira yako. Uko nambari inayofuata kwenye laini."
        : "We appreciate your patience. You are next on line.";
    } else {
      queuePrompt = isSwahili
        ? `Tunathamini subira yako. Uko nambari ya ${position}.`
        : `We appreciate your patience. You are next, number ${position}.`;
    }

    // Loops smoothly with background music and redirects automatically to try again
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${queuePrompt}</Say>
    <Play url="https://api.msafeapp.com/assets/audio/hold_music.mp3"/>
    <Redirect>${req.protocol}://${req.get('host')}/api/callcenter/queue-check</Redirect>
</Response>`);
  } catch (error) {
    next(error);
  }
};

exports.handleCallStatusCallback = async (req, res, next) => {
  try {
    const { sessionId, status, isActive } = req.body;
    
    if (status === "Failed" || status === "Completed" || isActive === "0" || req.body.direction === "duration-expired") {
      const finalCallRecord = await callCenterService.terminateCall(sessionId);
      
      if (finalCallRecord && !finalCallRecord.assignedAgentId) {
        await CallSession.findOneAndUpdate(
          { sessionId },
          { callStatus: "missed", completedAt: new Date() },
          { returnDocument: 'after' }
        );
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.handleRecordingCallback = async (req, res, next) => {
  try {
    const { sessionId, recordingUrl } = req.body;

    if (recordingUrl && sessionId) {
      await CallSession.findOneAndUpdate(
        { sessionId },
        { $set: { conversationRecordUrl: recordingUrl } }
      );
      console.log(`Saved call recording for session ${sessionId}: ${recordingUrl}`);
    }

    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentLogs = async (req, res, next) => {
  try {
    const { department } = req.query;
    const logs = await CallSession.find({ selectedService: department })
      .sort({ joinedQueueAt: -1 });

    return res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

exports.getLiveTelemetryStats = async (req, res, next) => {
  try {
    const onlineAgentsCount = await callCenterService.getOnlineAgentsCount(); 
    const ongoingCallsCount = await CallSession.countDocuments({ callStatus: "connected" });
    const onHoldCallsCount = await CallSession.countDocuments({ callStatus: "queued" });
    const missedCallsCount = await CallSession.countDocuments({ callStatus: "missed" });

    return res.status(200).json({
      onlineAgents: onlineAgentsCount || 0,
      ongoingCalls: ongoingCallsCount || 0,
      onHoldCalls: onHoldCallsCount || 0,
      missedCalls: missedCallsCount || 0
    });
  } catch (error) {
    next(error);
  }
};

exports.getAgentRoster = async (req, res, next) => {
  try {
    const agents = await callCenterService.getAgentRosterList(); 
    return res.status(200).json(agents);
  } catch (error) {
    next(error);
  }
};

exports.setAgentPresenceStatus = async (req, res, next) => {
  try {
    const { staffId, agentName, agentPhone, status } = req.body;
    const agentSession = await callCenterService.updateAgentStatus(staffId, agentName, agentPhone, status);
    return res.status(200).json({ success: true, agentSession });
  } catch (error) {
    next(error);
  }
};

// Get Calls by Status (queued, completed, missed, connected)
exports.getCalls = async (req, res, next) => {
  try {
    const { status = "queued" } = req.query;

    const calls = await CallSession.find({
      callStatus: status
    })
      .sort({ createdAt: -1 })
      .select(
        "clientPhoneNumber language selectedService callStatus joinedQueueAt completedAt createdAt"
      );

    return res.status(200).json({
      success: true,
      count: calls.length,
      calls
    });
  } catch (error) {
    next(error);
  }
};
