//backend\models\MpayStaffActivityLogs.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({

    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MpayStaff",
        required: true
    },

    action: {
        type: String,
        required: true
    },

    page: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },

    targetId: {
        type: String,
        default: ""
    },

    ip: {
        type: String,
        default: ""
    },

    device: {
        type: String,
        default: ""
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    "MpayStaffActivityLog",
    activityLogSchema
);