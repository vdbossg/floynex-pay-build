//models\CommissionSettings.js
const mongoose = require("mongoose");

const CommissionSettingsSchema = new mongoose.Schema(
{
    commissionRate: {
        type: Number,
        required: true,
        min: 0
    },

    subscriptionFee: {
        type: Number,
        required: true,
        min: 0
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MpayStaffsAdmins",
        default: null
    }
},
{
    timestamps: true
});

module.exports = mongoose.model(
    "CommissionSettings",
    CommissionSettingsSchema
);
