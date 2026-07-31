//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\controllers\agentAccController.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AgentAccount = require("../models/AgentAccount");
const { generateAgentIdentifiers } = require("../services/agentGeneratorService");

// ✅ Import from dedicated AgentserviceEmail.js
const {
  sendAgentActivationEmail,
  sendAgentWelcomeCredentialsEmail
} = require("../AgentserviceEmail");

// 1. CREATE HYBRID AGENT ACCOUNT (Admin / System Trigger)
exports.createAgentAccount = async (req, res) => {
  try {
    const {
      applicationNumber,
      firstName,
      lastName,
      surname,
      idType,
      idNumber,
      email,
      phone,
      status
    } = req.body;

    if (!applicationNumber || !firstName || !lastName || !idNumber || !email || !phone) {
      return res.status(400).json({ error: "Missing required agent details" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();
    const cleanIdNumber = idNumber.trim();

    // Check existing
    const existing = await AgentAccount.findOne({
      $or: [
        { applicationNumber },
        { idNumber: cleanIdNumber },
        { email: cleanEmail },
        { phone: cleanPhone }
      ]
    });

    if (existing) {
      return res.status(400).json({
        error: "An Agent account with this email, phone, national ID, or application number already exists."
      });
    }

    // Generate Identifiers
    const { agentAccountNumber, agentCode, agentShopNumber } = await generateAgentIdentifiers();

    // Generate One-Time Activation Token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    const agent = await AgentAccount.create({
      applicationNumber,
      firstName,
      lastName,
      surname: surname || "",
      idType: idType || "NATIONAL_ID",
      idNumber: cleanIdNumber,
      email: cleanEmail,
      phone: cleanPhone,
      status: status || "APPROVED",
      agentAccountNumber,
      agentCode,
      agentShopNumber,
      balance: 0.0,
      floatBalance: 0.0,
      commissionBalance: 0.0,
      activationToken,
      activationTokenExpires,
      accountStatus: "PENDING_SET_CREDENTIALS"
    });

    // Send Activation Email via Agent SMTP
    try {
      await sendAgentActivationEmail({
        email: agent.email,
        firstName: agent.firstName,
        agentCode: agent.agentCode,
        agentShopNumber: agent.agentShopNumber,
        token: activationToken
      });
    } catch (emailErr) {
      console.error("Agent Activation Email Failed:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Agent account created successfully. Activation email sent.",
      data: {
        user_id: agent._id,
        applicationNumber: agent.applicationNumber,
        firstName: agent.firstName,
        lastName: agent.lastName,
        surname: agent.surname,
        idType: agent.idType,
        idNumber: agent.idNumber,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
        agentAccountNumber: agent.agentAccountNumber,
        agentCode: agent.agentCode,
        agentShopNumber: agent.agentShopNumber,
        balance: agent.balance,
        floatBalance: agent.floatBalance,
        commissionBalance: agent.commissionBalance,
        currency: agent.currency,
        accountStatus: agent.accountStatus,
        isPinSet: agent.isPinSet,
        isPasswordSet: agent.isPasswordSet,
        createdAt: agent.createdAt
      }
    });
  } catch (err) {
    console.error("Create Agent Acc Error:", err);
    res.status(500).json({ error: "Failed to create agent account" });
  }
};

// 2. SETUP AGENT CREDENTIALS (PIN + Password via Link)
exports.setupAgentCredentials = async (req, res) => {
  try {
    const { token, pin, confirmPin, password, confirmPassword } = req.body;

    if (!token || !pin || !password) {
      return res.status(400).json({ error: "Token, PIN, and password are required" });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({ error: "4-digit PINs do not match" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Validate 4-digit PIN
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 numeric digits" });
    }

    // Validate complex password (8-12 chars, upper, lower, digit, special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_])[A-Za-z\d@$!%*?&#_]{8,12}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8-12 characters and include uppercase, lowercase, number, and special character."
      });
    }

    const agent = await AgentAccount.findOne({
      activationToken: token,
      activationTokenExpires: { $gt: Date.now() }
    });

    if (!agent) {
      return res.status(400).json({ error: "Invalid or expired activation token" });
    }

    // Hash credentials
    agent.pin = await bcrypt.hash(pin, 10);
    agent.password = await bcrypt.hash(password, 10);
    agent.isPinSet = true;
    agent.isPasswordSet = true;
    agent.accountStatus = "ACTIVE";
    agent.activationToken = null;
    agent.activationTokenExpires = null;

    await agent.save();

    // ✅ Send Agent Credentials & PDF Summary Email
    try {
      await sendAgentWelcomeCredentialsEmail(agent);
    } catch (emailErr) {
      console.error("Welcome Credentials Email Error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Credentials configured successfully. You can now log into your Agent portal.",
      data: {
        user_id: agent._id,
        agentCode: agent.agentCode,
        agentShopNumber: agent.agentShopNumber,
        agentAccountNumber: agent.agentAccountNumber,
        email: agent.email,
        phone: agent.phone,
        accountStatus: agent.accountStatus,
        isPinSet: true,
        isPasswordSet: true
      }
    });
  } catch (err) {
    console.error("Setup Credentials Error:", err);
    res.status(500).json({ error: "Failed to setup agent credentials" });
  }
};

// 3. AGENT LOGIN (Generates Agent-Specific JWT Token)
exports.agentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const agent = await AgentAccount.findOne({ email: email.toLowerCase().trim() });

    if (!agent || !agent.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (agent.accountStatus !== "ACTIVE") {
      return res.status(403).json({ error: "Agent account is not active. Please complete setup or contact support." });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Issue Agent Token
    const token = jwt.sign(
      {
        id: agent._id,
        role: "agent",
        agentCode: agent.agentCode,
        agentShopNumber: agent.agentShopNumber,
        agentAccountNumber: agent.agentAccountNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Agent login successful",
      token,
      agent: {
        user_id: agent._id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        agentCode: agent.agentCode,
        agentShopNumber: agent.agentShopNumber,
        agentAccountNumber: agent.agentAccountNumber,
        balance: agent.balance,
        floatBalance: agent.floatBalance,
        commissionBalance: agent.commissionBalance,
        currency: agent.currency
      }
    });
  } catch (err) {
    console.error("Agent Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// 4. GET MY AGENT PROFILE (Authenticated Agent)
exports.getMyAgentProfile = async (req, res) => {
  try {
    const agent = await AgentAccount.findById(req.user.id).select("-password -pin -activationToken");

    if (!agent) {
      return res.status(404).json({ error: "Agent account not found" });
    }

    res.json({
      success: true,
      agent
    });
  } catch (err) {
    console.error("Get Agent Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch agent profile" });
  }
};