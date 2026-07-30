//backend\controllers\controllerCommissionSettings.js
const CommissionSettings = require("../models/CommissionSettings");
const Affiliate = require("../models/Affiliate");

// =====================
// CREATE SETTINGS
// POST /api/commission-settings
// =====================
const createCommissionSettings = async (req, res) => {
  try {
    const { commissionRate, subscriptionFee } = req.body;

    if (
      commissionRate === undefined ||
      subscriptionFee === undefined
    ) {
      return res.status(400).json({
        error: "commissionRate and subscriptionFee are required."
      });
    }

    const exists = await CommissionSettings.findOne();

    if (exists) {
      return res.status(400).json({
        error:
          "Commission settings already exist. Use PUT to update."
      });
    }

   const settings = await CommissionSettings.create({
  commissionRate,
  subscriptionFee,
  lastUpdated: new Date(),
  updatedBy: req.staff._id
});

    res.status(201).json({
      message: "Commission settings created successfully.",
      settings
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// =====================
// GET SETTINGS
// GET /api/commission-settings
// =====================
const getCommissionSettings = async (req, res) => {
  try {
    const settings = await CommissionSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        error: "Commission settings not found."
      });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// =====================
// UPDATE SETTINGS
// PUT /api/commission-settings
// =====================
const updateCommissionSettings = async (req, res) => {
  try {
    const { commissionRate, subscriptionFee } = req.body;

    if (
      commissionRate === undefined ||
      subscriptionFee === undefined
    ) {
      return res.status(400).json({
        error: "commissionRate and subscriptionFee are required."
      });
    }

    const settings = await CommissionSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        error:
          "Commission settings do not exist. Create them first."
      });
    }

    settings.commissionRate = commissionRate;
    settings.subscriptionFee = subscriptionFee;
    settings.lastUpdated = new Date();
settings.updatedBy = req.staff._id;

    await settings.save();

    // Update commission rate for all affiliates
const affiliateUpdate = await Affiliate.updateMany(
  {},
  {
    $set: {
      commissionRate: commissionRate
    }
  }
);
    res.json({
  message: "Commission settings updated successfully.",
  settings,
  affiliatesUpdated: affiliateUpdate.modifiedCount
});
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

module.exports = {
  createCommissionSettings,
  getCommissionSettings,
  updateCommissionSettings
};
