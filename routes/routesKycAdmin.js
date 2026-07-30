//M-Safe\backend\routes\routesKycAdmin.js
const express = require("express");
const router = express.Router();

const {
  getAllKyc,
  verifyKyc,
  rejectKyc,
  freezeWallet,
  activateWallet // ✅ ADD THIS
} = require("../controllers/controllersKycAdmin");

// 📥 GET ALL KYC
router.get("/kycverify/all", getAllKyc);

// ✅ VERIFY
router.put("/kycverify/verify/:id", verifyKyc);

// ❌ REJECT
router.put("/kycverify/reject/:id", rejectKyc);

// 🧊 FREEZE
router.put("/kycverify/freeze/:id", freezeWallet);

// 🟢 ACTIVATE (UNFREEZE) ✅ ADD THIS
router.put("/kycverify/activate/:id", activateWallet);

module.exports = router;
