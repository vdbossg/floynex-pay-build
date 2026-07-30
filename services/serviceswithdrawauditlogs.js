// backend/services/serviceswithdrawauditlogs.js

const Withdrawal = require("../models/modelswithdrawauditlogs");

const getAllWithdrawals = async () => {
  return await Withdrawal.find({})
    .sort({ date: -1 })
    .lean();
};

const getWithdrawalByPhone = async (phone) => {
  return await Withdrawal.find({
    phone: { $regex: phone, $options: "i" }
  })
    .sort({ date: -1 })
    .lean();
};

const getWithdrawalByUserId = async (userId) => {
  return await Withdrawal.find({
    user: userId
  })
    .sort({ date: -1 })
    .lean();
};

const getWithdrawalByWalletAccount = async (walletAccountNumber) => {
  return await Withdrawal.find({
    walletAccountNumber: {
      $regex: walletAccountNumber,
      $options: "i"
    }
  })
    .sort({ date: -1 })
    .lean();
};

const getWithdrawalByMpesaTransactionId = async (
  mpesaTransactionId
) => {
  return await Withdrawal.find({
    mpesaTransactionId: {
      $regex: mpesaTransactionId,
      $options: "i"
    }
  })
    .sort({ date: -1 })
    .lean();
};

const getWithdrawalByDateRange = async (
  startDate,
  endDate
) => {
  return await Withdrawal.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .sort({ date: -1 })
    .lean();
};

module.exports = {
  getAllWithdrawals,
  getWithdrawalByPhone,
  getWithdrawalByUserId,
  getWithdrawalByWalletAccount,
  getWithdrawalByMpesaTransactionId,
  getWithdrawalByDateRange
};