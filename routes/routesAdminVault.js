// routes/routesAdminVault.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { viewVaultWithdrawals } = require("../controllers/controllersAdminVault");

// Only authenticated admins can view withdrawals ,GET /api/admin/vaultwithdraw \
router.get("/vaultwithdraw", auth, viewVaultWithdrawals);

module.exports = router;