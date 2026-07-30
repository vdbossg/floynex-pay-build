const Wallet = require("../models/modelsMSafewallet");

// 📥 GET ALL KYC REQUESTS
const getAllKyc = async () => {
  return await Wallet.find().sort({ createdAt: -1 });
};

// ✅ VERIFY KYC
const verifyKyc = async (walletId) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    {
      kycStatus: "verified",
      isVerified: true
    },
    { new: true }
  );
};

// ❌ REJECT KYC
const rejectKyc = async (walletId) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    {
      kycStatus: "rejected",
      isVerified: false
    },
    { new: true }
  );
};

// 🧊 FREEZE ACCOUNT
const freezeWallet = async (walletId) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    { status: "frozen" },
    { new: true }
  );
};

// 🟢 ACTIVATE (UNFREEZE ACCOUNT)
const activateWallet = async (walletId) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    { status: "active" },
    { new: true }
  );
};

module.exports = {
  getAllKyc,
  verifyKyc,
  rejectKyc,
  freezeWallet,
  activateWallet // ✅ ADD THIS
};
