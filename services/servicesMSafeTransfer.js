//FLOYNEX PAY\backend\services\servicesMSafeTransfer.js
const bcrypt = require("bcryptjs");
const Wallet = require("../models/modelsMSafewallet");
const User = require("../models/User");

const Ledger = require("../models/modelsMSafeLedger");
const TransactionStatement = require("../models/modelstransactionStatment");

exports.transferWalletToWallet = async (
  senderId,
  receiverAccount,
  amount,
  pin,
  identityType = "personal"
) => {

  // ❌ Validate inputs
  if (!pin) throw new Error("PIN is required");
  if (!receiverAccount) throw new Error("Receiver account is required");
  if (amount <= 0) throw new Error("Invalid amount");

  // 🔍 Find wallets
const senderWallet = await Wallet.findOne({ user: senderId });
const receiverWallet = await Wallet.findOne({ accountNumber: receiverAccount });

if (!senderWallet) throw new Error("Sender wallet not found");
if (!receiverWallet) throw new Error("Receiver wallet not found");

const senderUser = await User.findById(senderWallet.user);
const receiverUser = await User.findById(receiverWallet.user);
const senderDisplayName =
  senderWallet.paymentIdentity === "business" &&
  senderUser.businessName &&
  senderUser.businessName.trim()
    ? senderUser.businessName
    : `${senderUser.firstName} ${senderUser.lastName}`;

const receiverDisplayName =
  receiverWallet.paymentIdentity === "business" &&
  receiverUser.businessName &&
  receiverUser.businessName.trim()
    ? receiverUser.businessName
    : `${receiverUser.firstName} ${receiverUser.lastName}`;


  // ❌ Prevent self-transfer
  if (senderWallet.accountNumber === receiverWallet.accountNumber) {
    throw new Error("Cannot send to your own account");
  }

  // 🔒 SECURITY CHECKS (SENDER)
  if (senderWallet.status === "frozen") {
    throw new Error("Your wallet is frozen");
  }

  if (!senderWallet.isVerified) {
    throw new Error("Account not verified");
  }

  if (senderWallet.kycStatus !== "verified") {
    throw new Error("KYC verification required");
  }

// 🔒 SECURITY CHECKS (RECEIVER)
//if (receiverWallet.status === "frozen") {
 // throw new Error("Receiver wallet is frozen");
//}

//if (!receiverWallet.isVerified) {
  //throw new Error("Receiver account not verified");
//}

//if (receiverWallet.kycStatus !== "verified") {
 // throw new Error("Receiver KYC verification required");
//}

  // 🔑 PIN CHECK
  const isMatch = await bcrypt.compare(pin, senderWallet.pin);
  if (!isMatch) {
    throw new Error("Incorrect PIN");
  }

  // 💰 Balance check
  if (senderWallet.balance < amount) {
    throw new Error("Insufficient balance");
  }

  // 💸 Transfer
  senderWallet.balance -= amount;
  receiverWallet.balance += amount;

  await senderWallet.save();
  await receiverWallet.save();
// ✅ RECORD SENDER (OUT)
await TransactionStatement.create({
  user: senderWallet.user,
  type: "send",
  direction: "out",
  amount,
  accountNumber: receiverWallet.accountNumber,
  fullName: senderUser.firstName + " " + senderUser.lastName,
counterpartyName: receiverDisplayName,

  status: "success"
});


// ✅ RECORD RECEIVER (IN)
await TransactionStatement.create({
  user: receiverWallet.user,
  type: "receive",
  direction: "in",
  amount,
  accountNumber: senderWallet.accountNumber,
  fullName: receiverUser.firstName + " " + receiverUser.lastName,
counterpartyName: senderDisplayName,

  status: "success"
});


  // 🧾 Generate reference
  const reference = "TXN-" + Date.now();

  // 🧾 Ledger record
  await Ledger.create({
    type: "transfer",
    fromUser: senderWallet.user,
    toUser: receiverWallet.user,
    amount,
    reference,
    description: `Transfer from ${senderWallet.accountNumber} to ${receiverWallet.accountNumber}`
  });

  return {
    reference,
    from: senderWallet.accountNumber,
    to: receiverWallet.accountNumber,
    amount,
    balance: senderWallet.balance
  };
};
