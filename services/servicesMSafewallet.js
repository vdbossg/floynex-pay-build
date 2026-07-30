//FLOYNEX PAY\backend\services\servicesMSafewallet.js
const MSafeWallet = require("../models/modelsMSafewallet");

// Generate account number
const generateAccountNumber = async () => {
  let exists = true;
  let accountNumber;

  while (exists) {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    accountNumber = "MSF" + random;

    const wallet = await MSafeWallet.findOne({ accountNumber });
    if (!wallet) exists = false;
  }

  return accountNumber;
};
// CREDIT WALLET
// CREDIT WALLET
const creditUserWallet = async (userId, amount, session = null) => {
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await MSafeWallet.findOneAndUpdate(
    { user: userId, status: { $ne: "frozen" } },
    { $inc: { balance: amount } },
    { new: true, session }
  );

  if (!wallet) throw new Error("Transaction rejected: Wallet not found or is frozen");
  return wallet;
};
// DEBIT WALLET
// DEBIT WALLET
const debitUserWallet = async (userId, amount, session = null) => {
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await MSafeWallet.findOneAndUpdate(
    { 
      user: userId, 
      status: { $ne: "frozen" },
      balance: { $gte: amount }
    },
    { $inc: { balance: -amount } },
    { new: true, session }
  );

  if (!wallet) throw new Error("Transaction rejected: Insufficient balance or account restricted");
  return wallet;
};
// GET WALLET
const getUserWallet = async (userId) => {
  const wallet = await MSafeWallet.findOne({ user: userId });

  if (!wallet) throw new Error("Wallet not found");

  return wallet;
};
// DEBIT USER WALLET FOR WITHDRAWAL
const debitUserWalletForWithdrawal = async ({ userId, amount, session }) => {

  if (!amount || amount <= 0) throw new Error("Invalid amount");

  // 🌟 FIX: Use findOneAndUpdate with an atomic $inc operator and attach the transaction session
  const wallet = await MSafeWallet.findOneAndUpdate(

    {
      user: userId,
      status: { $ne: "frozen" }, // Ensures the wallet is not frozen directly at DB level
      balance: { $gte: amount }  // 🌟 CRITICAL: Database-level balance check prevents negative race conditions
    },
    {
      $inc: { balance: -amount } // 🌟 CRITICAL: Natively deducts without reading into JS memory first
    },
    {
      new: true, // Returns the updated document with the new balance
      session    // Ties this operation to the global controller transaction
    }
  );
  if (!wallet) {
    // If the query fails, it means either the wallet doesn't exist, is frozen, or has insufficient funds
    throw new Error("Transaction rejected: Insufficient funds or account status restricted");
  }
  return wallet;
};
module.exports = {
  generateAccountNumber,
  creditUserWallet,
  debitUserWallet,
  getUserWallet,
  debitUserWalletForWithdrawal
}; 

