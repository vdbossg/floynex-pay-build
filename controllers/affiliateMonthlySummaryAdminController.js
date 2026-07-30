//backend\controllers\affiliateMonthlySummaryAdminController.js
const AffiliateMonthlySummary = require("../models/AffiliateMonthlySummary"); 
const AffiliateMonthlyPaymentLog = require("../models/AffiliateMonthlyPaymentLog"); // Import the log model

/**
 * MARK MONTHLY SUMMARY AS PAID
 */
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await AffiliateMonthlySummary.findById(id);

    if (!summary) {
      return res.status(404).json({
        error: "Monthly summary not found"
      });
    }

    // CRITICAL FIX: Block payments on periods that are still open
    if (summary.status !== "closed") {
      return res.status(400).json({
        error: "Cannot pay an open summary. The monthly period must be closed first."
      });
    }

    // Prevent double payment
    if (summary.paymentStatus === "paid") {
      return res.status(400).json({
        error: "Already marked as paid"
      });
    }

    // Keep track of the original status for logging
    const statusBefore = summary.paymentStatus;

    // Mutate and update summary document fields
    summary.paymentStatus = "paid";
    summary.paidAt = new Date();
    summary.paidBy = {
      adminId: req.staff._id,
      fullName: req.staff.fullName,
      email: req.staff.email,
      role: req.staff.role
    };

    await summary.save();

    // CRITICAL FIX: Commit record directly to your Payment Logs collection
    await AffiliateMonthlyPaymentLog.create({
      affiliateMonthlySummaryId: summary._id,
      affiliateId: summary.affiliateId,
      promoCode: summary.promoCode,
      month: summary.month,
      year: summary.year,
      amountPaid: summary.commissionEarned,
      paymentStatusBefore: statusBefore,
      paymentStatusAfter: "paid",
      paidBy: {
        adminId: req.staff._id,
        name: req.staff.fullName,
        email: req.staff.email,
        role: req.staff.role
      },
      paidAt: summary.paidAt
    });

    return res.json({
      message: "Affiliate marked as paid successfully and ledger log committed.",
      summary
    });

  } catch (err) {
    console.error("Mark paid error:", err);
    return res.status(500).json({
      error: "Server error"
    });
  }
};

module.exports = {
  markAsPaid
};