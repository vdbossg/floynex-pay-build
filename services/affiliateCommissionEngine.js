//services\affiliateCommissionEngine.js
const Affiliate = require("../models/Affiliate");
const AffiliateReferral = require("../models/AffiliateReferral");
const CommissionSettings = require("../models/CommissionSettings");
const AffiliateMonthlySummary = require("../models/AffiliateMonthlySummary");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const runAffiliateCommissionEngine = async () => {
  try {

    const settings = await CommissionSettings.findOne();

    if (!settings) {
      console.log("Commission settings not found.");
      return;
    }

    const commissionRate = settings.commissionRate;
    const subscriptionFee = settings.subscriptionFee;

    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const monthName = MONTHS[now.getMonth()];

    const monthStart = new Date(year, month - 1, 1);

    const monthEnd = new Date(year, month, 1);

    const affiliates = await Affiliate.find({
      approvalStatus: "approved",
      active: true
    });

    console.log(`Calculating ${affiliates.length} affiliates...`);

    for (const affiliate of affiliates) {

      /*
      TOTAL REFERRALS
      */

     const totalReferredUsers =
  await AffiliateReferral.countDocuments({

    promoCode: affiliate.promoCode,

    createdAt: {
      $gte: monthStart,
      $lt: monthEnd
    }

  });

      /*
      MONTHLY SUBSCRIPTIONS
      */

      const totalSubscribedUsers =
        await AffiliateReferral.countDocuments({

          promoCode: affiliate.promoCode,

          firstTimeSubscriptionStatus: "subscribed",

          firstSubscriptionDate: {
            $gte: monthStart,
            $lt: monthEnd
          }

        });

      /*
      SALES
      */

      const grossSales =
        totalSubscribedUsers *
        subscriptionFee;

      /*
      COMMISSION
      */

      const commissionEarned =
        grossSales *
        (commissionRate / 100);

      /*
      UPDATE LIVE AFFILIATE
      */

      affiliate.commissionRate = commissionRate;

      affiliate.totalReferredUsers =
        totalReferredUsers;

      affiliate.totalSubscribedUsers =
        totalSubscribedUsers;

      affiliate.totalCommissionEarned =
        commissionEarned;

      await affiliate.save();

      /*
      MONTHLY SUMMARY
      */

      await AffiliateMonthlySummary.findOneAndUpdate(

        {
          affiliateId: affiliate._id,
          month,
          year
        },

        
        {

  affiliateId: affiliate._id,

  affiliateName: affiliate.fullName,

  promoCode: affiliate.promoCode,

  monthName,

  commissionRate,

  subscriptionFee,

  totalReferredUsers,

  totalSubscribedUsers,

  grossSales,

  commissionEarned,

  paymentStatus: "pending",

  status: "open",

  lastCalculatedAt: new Date()

},

       {
  upsert: true,
  returnDocument: 'after', // <--- Fixed!
  setDefaultsOnInsert: true
}

      );

      console.log(
        `${affiliate.fullName} updated`
      );

    }

    console.log("Affiliate commission engine completed.");

  } catch (err) {

    console.error(err);

  }
};

module.exports = {
  runAffiliateCommissionEngine
};
