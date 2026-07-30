const service = require("../services/servicesKycAdmin");
const {
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendWalletFrozenEmail,
  sendWalletActivatedEmail
} = require("../serviceEmail");

// 📥 GET ALL
const getAllKyc = async (req, res) => {
  try {
    const data = await service.getAllKyc();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ VERIFY
const verifyKyc = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await service.verifyKyc(id);

    if (!updated) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // ✅ SEND EMAIL
    await sendKycApprovedEmail(updated.email, updated.firstName);

    res.json({ success: true, message: "KYC verified", data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ❌ REJECT
const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // ✅ NEW

    const updated = await service.rejectKyc(id);

    if (!updated) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // ✅ SEND EMAIL WITH REASON
    await sendKycRejectedEmail(
      updated.email,
      updated.firstName,
      reason || "No reason provided"
    );

    res.json({ success: true, message: "KYC rejected", data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🧊 FREEZE
const freezeWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // ✅ NEW

    const updated = await service.freezeWallet(id);

    if (!updated) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // ✅ SEND EMAIL WITH REASON
    await sendWalletFrozenEmail(
      updated.email,
      updated.firstName,
      reason || "Security reasons"
    );

    res.json({ success: true, message: "Wallet frozen", data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 ACTIVATE (UNFREEZE)
const activateWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await service.activateWallet(id);

    if (!updated) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // ✅ SEND EMAIL
    await sendWalletActivatedEmail(
      updated.email,
      updated.firstName
    );

    res.json({ success: true, message: "Wallet activated", data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  getAllKyc,
  verifyKyc,
  rejectKyc,
  freezeWallet,
  activateWallet // ✅ VERY IMPORTANT
};
