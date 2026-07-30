//backend\controllers\controllersAffiliates.js
const Affiliate = require("../models/Affiliate");
const { generateAffiliateCode } = require("../services/servicesAffiliates");

const {
  sendAffiliateRegistrationEmail,
  sendAffiliateApprovedEmail
} = require("../serviceEmail");
// ================= REGISTER AFFILIATE =================
const registerAffiliate = async (req, res) => {
  try {

    const {
      fullName,
      email,
      phone,
      idType,
      idNumber
    } = req.body;

    if (!fullName || !email || !phone || !idType || !idNumber) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // Email already exists?
    const existingEmail = await Affiliate.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        error: "Affiliate email already exists"
      });
    }

    // National ID already exists?
    const existingNational = await Affiliate.findOne({
      "national.number": idNumber
    });

    if (existingNational) {
      return res.status(400).json({
        error: "National document already exists"
      });
    }

    // Generate unique promo code
    const promoCode = await generateAffiliateCode();

    // Files (temporary local upload)
    // Files (Cloudinary storage web paths)
    const front = req.files?.front?.[0]?.path || null;
    const back = req.files?.back?.[0]?.path || null;

    const affiliate = await Affiliate.create({

      fullName,

      email,

      phone,

      promoCode,

      national: {
        type: idType,
        number: idNumber
      },

      documents: {
        front,
        back,
        agreements: []
      }

    });
try {

  console.log("📧 Sending affiliate registration email...");

  await sendAffiliateRegistrationEmail(
    affiliate.email,
    affiliate.fullName,
    affiliate.promoCode
  );

  console.log("✅ Affiliate registration email sent.");

} catch (emailErr) {

  console.log("❌ EMAIL ERROR START");
  console.log(emailErr);
  console.log(emailErr.message);
  console.log(emailErr.stack);
  console.log("❌ EMAIL ERROR END");

}
    return res.status(201).json({

      message: "Affiliate registered successfully",

      affiliate

    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }
};

// ================= GET ALL =================

const getAllAffiliates = async (req, res) => {

  try {

    const affiliates = await Affiliate
      .find()
      .sort({ createdAt: -1 });

    res.json(affiliates);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};
// ================= GET LOGGED IN AFFILIATE =================

const getMyAffiliate = async (req, res) => {

  try {

    const affiliate = await Affiliate.findOne({
  userId: req.user.id
});

    if (!affiliate) {
      return res.status(404).json({
        error: "Affiliate not found"
      });
    }

    res.json(affiliate);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};
// ================= ADMIN GET AFFILIATES (UPDATED) =================
const adminGetAffiliates = async (req, res) => {
  try {
    const { status, active, search } = req.query;
    let query = {};

    // Filter by approvalStatus: pending / approved / declined / freezed
    if (status) {
      query.approvalStatus = status;
    }

    // Filter by active state: true / false
    if (active !== undefined) {
      query.active = active === "true";
    }

    // Search by promo code, email, phone, full name, or userId
    if (search) {
      query.$or = [
        { promoCode: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } }
      ];

      // If search string looks like a valid MongoDB ObjectId, check userId
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ userId: search });
      }
    }

    // --- AUTOMATIC INACTIVITY LOGIC ---
    // If an affiliate hasn't had a new subscriber in 30 days, we mark them inactive.
    // If they have had recent activity, they stay active.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const affiliates = await Affiliate.find(query).sort({ createdAt: -1 });


    // Dynamically update status profiles based on subscription rules
    const updatedAffiliates = await Promise.all(
      affiliates.map(async (aff) => {
        // Only run auto-check if they are already approved and not manually frozen
        if (aff.approvalStatus === "approved") {
          // Calculate if the affiliate was approved within the last 30 days (Grace Period)
          const approvalDate = aff.approvedAt || aff.createdAt;
          const isWithinGracePeriod = approvalDate >= thirtyDaysAgo;

          // Look up their referrals in AffiliateReferral collection
          const AffiliateReferral = require("../models/AffiliateReferral");
          const recentSub = await AffiliateReferral.findOne({
            promoCode: aff.promoCode,
            firstTimeSubscriptionStatus: "subscribed",
            firstSubscriptionDate: { $gte: thirtyDaysAgo }
          });

          // Active if they have a recent subscriber OR are still within their 30-day grace period
          const shouldBeActive = !!recentSub || isWithinGracePeriod;

          // Only trigger a database save if the state actually changes
          if (aff.active !== shouldBeActive) {
            aff.active = shouldBeActive;
            await aff.save();
          }
        }
        return aff;
      })
    );

    res.json(updatedAffiliates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= ADMIN UPDATE AFFILIATE STATUS (FIXED CRASH) =================
const adminUpdateAffiliateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // action types: "approve", "decline", "freeze", "activate"
    const { action, declinedReason } = req.body; 

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    if (action === "approve") {
      affiliate.approvalStatus = "approved";
      affiliate.active = true;
      // Safely check if a staff user or client user object exists, otherwise record as System Admin
      affiliate.approvedBy = req.staff?.id || req.user?.id || null;
      affiliate.approvedAt = new Date();
      affiliate.declinedReason = null;
    } else if (action === "decline") {
      affiliate.approvalStatus = "declined";
      affiliate.active = false;
      affiliate.declinedReason = declinedReason || "No reason provided";
    } else if (action === "freeze") {
      affiliate.approvalStatus = "freezed";
      affiliate.active = false;
    } else if (action === "activate") {
      affiliate.approvalStatus = "approved";
      affiliate.active = true;
    } else {
      return res.status(400).json({ error: "Invalid action type" });
    }

    await affiliate.save();

// Send approval email only when approved
if (action === "approve") {
  try {
    await sendAffiliateApprovedEmail(
      affiliate.email,
      affiliate.fullName,
      affiliate.promoCode
    );
  } catch (emailErr) {
    console.error("Affiliate approval email failed:", emailErr);
  }
}

res.json({
  message: `Affiliate successfully updated to ${affiliate.approvalStatus}`,
  affiliate
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ================= PUBLIC MARKETER VERIFICATION (QR SCAN) =================
const verifyMarketer = async (req, res) => {
  try {
    const { promoCode } = req.params;

    const marketer = await Affiliate.findOne({
      promoCode: promoCode.toUpperCase()
    }).select("fullName promoCode approvalStatus email active -_id");

    if (!marketer) {
      return res.status(404).json({
        exists: false,
        error: "Marketer profile not found"
      });
    }

    return res.json({
      exists: true,
      fullName: marketer.fullName,
      promoCode: marketer.promoCode,
      status: marketer.approvalStatus,
      active: marketer.active,
      email: marketer.email
    });

  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      error: "Internal server verification error"
    });
  }
};
module.exports = {
  registerAffiliate,
  getAllAffiliates,
  getMyAffiliate,
  adminGetAffiliates,
  adminUpdateAffiliateStatus,
  verifyMarketer // <-- Add this exact line here!
};
