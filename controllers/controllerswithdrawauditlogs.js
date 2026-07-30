// backend/controllers/controllerswithdrawauditlogs.js

const auditService = require(
  "../services/serviceswithdrawauditlogs"
);

exports.getAllWithdrawals = async (req, res) => {
  try {
    const data =
      await auditService.getAllWithdrawals();

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.searchByPhone = async (req, res) => {
  try {
    const data =
      await auditService.getWithdrawalByPhone(
        req.params.phone
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.searchByUserId = async (req, res) => {
  try {
    const data =
      await auditService.getWithdrawalByUserId(
        req.params.userId
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.searchByWalletAccount = async (
  req,
  res
) => {
  try {
    const data =
      await auditService.getWithdrawalByWalletAccount(
        req.params.walletAccountNumber
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.searchByMpesaTransaction = async (
  req,
  res
) => {
  try {
    const data =
      await auditService.getWithdrawalByMpesaTransactionId(
        req.params.mpesaTransactionId
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.searchByDateRange = async (
  req,
  res
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "startDate and endDate are required"
      });
    }

    const data =
      await auditService.getWithdrawalByDateRange(
        startDate,
        endDate
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};