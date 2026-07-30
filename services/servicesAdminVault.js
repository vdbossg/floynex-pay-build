const MpayAdminWithdraws = require("../models/MpayAdminWithdraws");

// Get all vault withdrawals (raw data, no population)
exports.getVaultWithdrawals = async () => {
  return await MpayAdminWithdraws.find() // <-- just fetch the documents
    .sort({ createdAt: -1 });            // keep the sort if needed
};