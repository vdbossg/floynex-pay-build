const TransactionStatement = require("../models/modelstransactionStatment");

exports.getTransactions = async (req, res) => {
  try {

    const transactions = await TransactionStatement.find({
      user: req.user.id
    })
    .sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: transactions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch transactions"
    });
  }
};
