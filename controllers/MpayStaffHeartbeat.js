const heartbeatService = require("../services/MpayStaffHeartbeat");
const MpayStaff = require("../models/MpayStaffsAdmins");

const pulse = async (req, res) => {
  try {
    const { isWorking } = req.body;
    await heartbeatService.recordHeartbeat(req.staff._id, isWorking);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyPerformance = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const data = await heartbeatService.getMonthToDateSummary(req.staff._id, year, month);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllStaffPerformance = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const allStaff = await MpayStaff.find({}, { password: 0, __v: 0 });
    const detailedReport = [];

    for (const staff of allStaff) {
      const perfData = await heartbeatService.getMonthToDateSummary(staff._id, year, month);
      
      detailedReport.push({
        staffInfo: {
          id: staff._id,
          name: `${staff.first_name} ${staff.last_name}`,
          email: staff.email,
          role: staff.role,
          unique_code: staff.unique_code
        },
        summary: perfData.summary,
        graphData: perfData.graphData
      });
    }

    res.json({
      success: true,
      count: detailedReport.length,
      period: `${year}-${String(month).padStart(2, "0")}`,
      report: detailedReport
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  pulse, 
  getMyPerformance, 
  getAllStaffPerformance 
};