//backend\services\MpayStaffActivityLogs.js
const MpayStaffActivityLog = require("../models/MpayStaffActivityLogs");

const logActivity = async ({

    staffId,

    action,

    page = "",

    description = "",

    targetId = "",

    ip = "",

    device = "",

    metadata = {}

}) => {

    try {

        await MpayStaffActivityLog.create({

            staffId,

            action,

            page,

            description,

            targetId,

            ip,

            device,

            metadata

        });

    } catch (err) {

        console.error("Activity Log Error:", err.message);

    }

};

const getStaffLogs = async (staffId) => {

    return await MpayStaffActivityLog
        .find({ staffId })
        .sort({ createdAt: -1 });

};

module.exports = {

    logActivity,

    getStaffLogs

};