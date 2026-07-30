// C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\services\servicesApproveAgentKycs.js
const AgentKyc = require("../models/modelsApproveAgentKycs");

class ApproveAgentKycsService {
  /**
   * Fetch all agent KYC applications with optional status filtering.
   */
  async getAllApplications(filter = {}) {
    return await AgentKyc.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Fetch a single application by ID
   */
  async getApplicationById(id) {
    return await AgentKyc.findById(id);
  }

  /**
   * Review and update an Agent KYC application status (APPROVE, REJECT, etc.)
   */
  async reviewApplication({ id, status, rejectionReason, reviewerNote, staff }) {
    const validStatuses = [
      "PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "NEEDS_CORRECTION"
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status standard: ${status}`);
    }

    const updatePayload = {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
      reviewerNote: reviewerNote || null,
      reviewedAt: new Date(),
      reviewedBy: {
        adminId: staff._id ? staff._id.toString() : null,
        adminCode: staff.unique_code || staff.adminCode || null,
        adminName: `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || staff.email
      },
      updatedAt: new Date()
    };

    const updatedDoc = await AgentKyc.findByIdAndUpdate(id, updatePayload, { new: true });
    
    if (!updatedDoc) {
      throw new Error("Agent KYC application not found");
    }

    return updatedDoc;
  }
}

module.exports = new ApproveAgentKycsService();