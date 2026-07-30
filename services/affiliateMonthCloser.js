//backend\services\affiliateMonthCloser.js
const AffiliateMonthlySummary = require("../models/AffiliateMonthlySummary");

const closePreviousMonths = async () => {
  try {

    const now = new Date();

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const result = await AffiliateMonthlySummary.updateMany(

      {
        status: "open",

        $or: [

          {
            year: {
              $lt: currentYear
            }
          },

          {
            year: currentYear,

            month: {
              $lt: currentMonth
            }
          }

        ]

      },

      {
        $set: {
          status: "closed",
          closedAt: new Date()
        }
      }

    );

    console.log(
      `${result.modifiedCount} monthly summaries closed.`
    );

  } catch (err) {

    console.log(
      "Month closer error:",
      err.message
    );

  }
};

module.exports = {
  closePreviousMonths
};