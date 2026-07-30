//backend\routes\callCenterRoutes.js
const express = require("express");
const router = express.Router();
const callCenterController = require("../controllers/callCenterController");

const callCenterAgentController = require("../controllers/callCenterAgentController");
// Primary entry webhooks for Telecom operators
router.post("/incoming", callCenterController.handleIncomingCall);
router.post("/ivr-lang", callCenterController.handleLanguageSelection);
router.post("/ivr-services", callCenterController.handleServiceSelection);
router.post("/queue-check", callCenterController.handleQueueCheck);
router.post("/status-callback", callCenterController.handleCallStatusCallback);


// Call Center Active Management Roster Endpoints
router.post("/roster/add", callCenterAgentController.addAgentToRoster);
router.get("/roster/list", callCenterAgentController.getRosterAgents);
router.post("/roster/update", callCenterAgentController.updateRosterAgent);
router.post("/roster/remove", callCenterAgentController.removeAgentFromRoster);
router.get("/agent/dashboard/:userId", callCenterAgentController.getAgentDashboardData); // <-- ADD THIS LINE HERE
// Agent Control panel routes
router.post("/agent/presence", callCenterController.setAgentPresenceStatus);
router.get("/calls", callCenterController.getCalls);
router.post('/recording-callback', callCenterController.handleRecordingCallback);
// --- ADD THESE NEW LOGS & TELEMETRY ROUTES FOR THE HTML PAGE ---
router.get("/telemetry/stats", callCenterController.getLiveTelemetryStats);
router.get("/roster", callCenterController.getAgentRoster);
router.get("/logs", callCenterController.getDepartmentLogs);

module.exports = router;
