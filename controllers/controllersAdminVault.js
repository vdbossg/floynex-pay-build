// controllers/controllersAdminVault.js

const { getVaultWithdrawals } = require("../services/servicesAdminVault");
// ✅ Admin: Get all vault withdrawals
exports.viewVaultWithdrawals = async (req, res) => {
  try {
    const withdrawals = await getVaultWithdrawals();
    res.json({ status: "success", withdrawals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
