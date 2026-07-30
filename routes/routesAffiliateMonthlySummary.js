const express = require("express");

const router = express.Router();

const {

  getAllSummaries,

  getAffiliateSummaries,

  getOpenSummaries,

  getClosedSummaries,

  getPendingPayments,

  getPaidPayments,

  getMonthSummaries,

  getPromoSummaries

} = require("../controllers/affiliateMonthlySummaryController");


router.get("/all", getAllSummaries);

router.get(
  "/affiliate/:affiliateId",
  getAffiliateSummaries
);

router.get(
  "/status/open",
  getOpenSummaries
);

router.get(
  "/status/closed",
  getClosedSummaries
);

router.get(
  "/payment/pending",
  getPendingPayments
);

router.get(
  "/payment/paid",
  getPaidPayments
);

router.get(
  "/month/:month/:year",
  getMonthSummaries
);

router.get(
  "/promo/:promoCode",
  getPromoSummaries
);

module.exports = router;