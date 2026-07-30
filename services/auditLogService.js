//backend\services\auditLogService.js
const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId = null,
  ipAddress = null,
  device = null
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      device
    });
  } catch (err) {
    // NEVER crash main flow if audit fails
    console.error("Audit Log Error:", err.message);
  }
};

module.exports = {
  createAuditLog
};
