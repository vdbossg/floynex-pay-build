//controllers\auditLogController.js
const AuditLog = require("../models/AuditLog");

// GET logs by user
const getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;

    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all logs (admin dashboard)
const getAllAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserAuditLogs,
  getAllAuditLogs
};
