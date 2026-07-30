const activityService = require("../services/MpayStaffActivityLogs");

const getMyLogs = async (req, res) => {

    try {

        const logs = await activityService.getStaffLogs(
            req.staff._id
        );

        res.json({

            success: true,

            count: logs.length,

            logs

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    getMyLogs

};