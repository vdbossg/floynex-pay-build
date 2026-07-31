//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\routes\agentAccRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createAgentAccount,
  setupAgentCredentials,
  agentLogin,
  getMyAgentProfile
} = require("../controllers/agentAccController");

// Admin creates Agent Account
router.post("/create/new", auth, createAgentAccount);

// Agent activates account via token link
router.post("/setup-credentials", setupAgentCredentials);

// Agent Login
router.post("/login", agentLogin);

// Get My Agent Profile
router.get("/me", auth, getMyAgentProfile);

module.exports = router;