const AffiliateMonthlySummary = require("../models/AffiliateMonthlySummary");

/*
GET /api/affiliate-monthly-summary/all
*/
exports.getAllSummaries = async (req, res) => {
  try {
    const summaries = await AffiliateMonthlySummary.find()
      .sort({
        year: -1,
        month: -1,
        affiliateName: 1
      });

    res.json(summaries);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

/*
GET /api/affiliate-monthly-summary/affiliate/:affiliateId
*/
exports.getAffiliateSummaries = async (req, res) => {
  try {

    const summaries = await AffiliateMonthlySummary.find({
      affiliateId: req.params.affiliateId
    }).sort({
      year: -1,
      month: -1
    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};

/*
GET /api/affiliate-monthly-summary/status/open
*/
exports.getOpenSummaries = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({
      status: "open"
    }).sort({
      year: -1,
      month: -1
    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

/*
GET /api/affiliate-monthly-summary/status/closed
*/
exports.getClosedSummaries = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({
      status: "closed"
    }).sort({
      year: -1,
      month: -1
    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

/*
GET /api/affiliate-monthly-summary/payment/pending
*/
exports.getPendingPayments = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({
      paymentStatus: "pending"
    }).sort({
      year: -1,
      month: -1
    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

/*
GET /api/affiliate-monthly-summary/payment/paid
*/
exports.getPaidPayments = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({
      paymentStatus: "paid"
    }).sort({
      year: -1,
      month: -1
    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

/*
GET /api/affiliate-monthly-summary/month/:month/:year
*/
exports.getMonthSummaries = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({

      month: Number(req.params.month),

      year: Number(req.params.year)

    }).sort({

      affiliateName: 1

    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

/*
GET /api/affiliate-monthly-summary/promo/:promoCode
*/
exports.getPromoSummaries = async (req, res) => {

  try {

    const summaries = await AffiliateMonthlySummary.find({

      promoCode: req.params.promoCode.toUpperCase()

    }).sort({

      year: -1,

      month: -1

    });

    res.json(summaries);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};