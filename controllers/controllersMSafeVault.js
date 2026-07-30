//M-Safe\backend\controllers\controllersMSafeVault.js
const { getVaultData } = require("../services/servicesMSafeVault");

// ✅ ADMIN: VIEW VAULT BALANCE
exports.getVault = async (req, res) => {
  try {
    const vault = await getVaultData();

    res.json({
      status: "success",
      vault: {
        balance: vault.balance,
        totalDeposits: vault.totalDeposits,
        totalWithdrawals: vault.totalWithdrawals,
        currency: vault.currency
      }
    });

  } catch (error) {
    console.error("❌ Vault Error:", error);
    res.status(500).json({ error: "Failed to fetch vault" });
  }
};
