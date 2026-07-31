//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\middleware\authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MpayStaff = require("../models/MpayStaffsAdmins");
const AgentAccount = require("../models/AgentAccount");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Check Standard User
    const userProfile = await User.findById(decoded.id).select("firstName lastName businessName");

    if (userProfile) {
      const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
      req.user = {
        ...decoded,
        fullName: fullName,
        businessName: userProfile.businessName,
        accountType: "user"
      };
      return next();
    }

    // 2. Check Staff / Admin
    const staffProfile = await MpayStaff.findById(decoded.id);
    if (staffProfile) {
      const staffName = `${staffProfile.first_name || ""} ${staffProfile.last_name || ""} ${staffProfile.sir_name || ""}`.trim();
      req.user = {
        ...decoded,
        fullName: staffName,
        businessName: `M-Pay Admin (${staffProfile.role || "Staff"})`,
        accountType: "staff"
      };
      return next();
    }

    // 3. Check Agent Account
    const agentProfile = await AgentAccount.findById(decoded.id);
    if (agentProfile) {
      const agentName = `${agentProfile.firstName} ${agentProfile.lastName}`.trim();
      req.user = {
        ...decoded,
        fullName: agentName,
        agentCode: agentProfile.agentCode,
        agentShopNumber: agentProfile.agentShopNumber,
        agentAccountNumber: agentProfile.agentAccountNumber,
        accountType: "agent"
      };
      return next();
    }

    return res.status(401).json({ error: "User or Agent profile not found" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};