// C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\controllers\controllersApproveAgentKycs.js
const approveService = require("../services/servicesApproveAgentKycs");

// GET ALL AGENT KYCS FOR REVIEW
exports.getAgentKycs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const applications = await approveService.getAllApplications(filter);
    
    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// APPROVE / REJECT / UPDATE KYC STATUS
exports.processAgentKycApproval = async (req, res) => {
  try {
    const { id, status, rejectionReason, reviewerNote } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'id' and 'status' are required."
      });
    }

    const application = await approveService.reviewApplication({
      id,
      status,
      rejectionReason,
      reviewerNote,
      staff: req.staff // Injected by staffAuth middleware
    });

    return res.status(200).json({
      success: true,
      message: `Agent KYC status updated to ${status} successfully.`,
      application
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};