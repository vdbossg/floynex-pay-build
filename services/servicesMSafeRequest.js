//backend\services\servicesMSafeRequest.js
const bcrypt = require("bcryptjs");
const Wallet = require("../models/modelsMSafewallet");
const Request = require("../models/modelsMSafeRequest");
const Ledger = require("../models/modelsMSafeLedger");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const TransactionStatement = require("../models/modelstransactionStatment");

// ✅ CREATE REQUEST (B → A)
exports.createRequest = async (
  requesterId,
  targetAccount,
  amount,
  identityType = "personal"
) => {
  if (amount <= 0) throw new Error("Invalid amount");

const requesterWallet = await Wallet.findOne({ user: requesterId });
const targetWallet = await Wallet.findOne({ accountNumber: targetAccount });
const requesterUser = await User.findById(requesterWallet.user);

const requesterDisplayName =
  requesterWallet.paymentIdentity === "business" &&
  requesterUser.businessName &&
  requesterUser.businessName.trim()
    ? requesterUser.businessName
    : `${requesterUser.firstName} ${requesterUser.lastName}`;

if (!requesterWallet) throw new Error("Your wallet not found");
if (!targetWallet) throw new Error("Target user not found");


const newRequest = await Request.create({
  fromUser: requesterWallet.user,
  toUser: targetWallet.user,
  fromAccount: requesterWallet.accountNumber,
  toAccount: targetWallet.accountNumber,

  requesterDisplayName,

  amount,
  status: "pending"
});

return newRequest;


};


// ✅ GET PENDING REQUESTS (for A popup)
exports.getPendingRequests = async (userId) => {
  return await Request.find({
    toUser: userId,
    status: "pending"
  }).sort({ createdAt: -1 });
};


// ✅ APPROVE REQUEST (A enters PIN)
exports.approveRequest = async (userId, requestId, pin) => {

  const request = await Request.findById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Already handled");

  const senderWallet = await Wallet.findOne({ user: userId });
  if (!senderWallet) throw new Error("Wallet not found");
// 🔒 SECURITY CHECKS (PAYER)
if (senderWallet.status === "frozen") {
  throw new Error("Your wallet is frozen");
}

if (!senderWallet.isVerified) {
  throw new Error("Account not verified");
}

if (senderWallet.kycStatus !== "verified") {
  throw new Error("KYC verification required");
}
  // 🔐 PIN check
  const isMatch = await bcrypt.compare(pin, senderWallet.pin);
  if (!isMatch) {
    // --- ADD THESE 2 LINES ---
    request.status = "rejected";
    await request.save();
    // -------------------------

    await Transaction.create({
      user: request.toUser,
      accountNumber: request.fromAccount,
      counterpartyName: "Request Failed",
      amount: request.amount,
      direction: "out",
      status: "failed",
      resultCode: 1,
      checkoutRequestID: "manual_fail_" + Date.now(),
      merchantRequestID: "manual_fail_" + Date.now()
    });

    throw new Error("Invalid PIN");
  }

  if (senderWallet.balance < request.amount) {
    // --- ADD THESE 2 LINES ---
    request.status = "rejected";
    await request.save();
    // -------------------------

    await Transaction.create({
      user: request.toUser,
      accountNumber: request.fromAccount,
      counterpartyName: "Request Failed",
      amount: request.amount,
      direction: "out",
      status: "failed",
      resultCode: 1,
      checkoutRequestID: "manual_fail_" + Date.now(),
      merchantRequestID: "manual_fail_" + Date.now()
    });

    throw new Error("Insufficient balance");
  }

  const receiverWallet = await Wallet.findOne({
    accountNumber: request.fromAccount
  });

  if (!receiverWallet) {
  throw new Error("Receiver wallet not found");
}

//if (receiverWallet.status === "frozen") {
  //throw new Error("Receiver wallet is frozen");
//}

//if (!receiverWallet.isVerified) {
 // throw new Error("Receiver account not verified");
//}

//if (receiverWallet.kycStatus !== "verified") {
  //throw new Error("Receiver KYC verification required");
//}
const senderUser = await User.findById(senderWallet.user);
const receiverUser = await User.findById(receiverWallet.user);

  // 💸 Transfer
  senderWallet.balance -= request.amount;
  receiverWallet.balance += request.amount;

  await senderWallet.save();
  await receiverWallet.save();
// Resolve display names dynamically based on each wallet's identity settings
const senderDisplayName =
  senderWallet.paymentIdentity === "business" && senderUser.businessName && senderUser.businessName.trim()
    ? senderUser.businessName
    : `${senderUser.firstName} ${senderUser.lastName}`;

const receiverDisplayName =
  receiverWallet.paymentIdentity === "business" && receiverUser.businessName && receiverUser.businessName.trim()
    ? receiverUser.businessName
    : `${receiverUser.firstName} ${receiverUser.lastName}`;

// ✅ PAYER (OUT -)
await TransactionStatement.create({
  user: senderWallet.user,
  type: "send",
  direction: "out",
  amount: request.amount,
  accountNumber: receiverWallet.accountNumber,
  fullName: `${senderUser.firstName} ${senderUser.lastName}`,
  counterpartyName: receiverDisplayName,
  status: "success"
});

// ✅ REQUESTER (IN +)
await TransactionStatement.create({
  user: receiverWallet.user,
  type: "receive",
  direction: "in",
  amount: request.amount,
  accountNumber: senderWallet.accountNumber,
  fullName: `${receiverUser.firstName} ${receiverUser.lastName}`,
  counterpartyName: senderDisplayName,
  status: "success"
});

  // update request
  request.status = "approved";
  await request.save();

  // ledger
  await Ledger.create({
    type: "transfer",
    fromUser: senderWallet.user,
    toUser: receiverWallet.user,
    amount: request.amount,
    description: "Request payment"
  });


await Transaction.create({
  user: senderWallet.user,
  accountNumber: receiverWallet.accountNumber,
  counterpartyName: receiverDisplayName,

  amount: request.amount,
  direction: "out",
  status: "success",

  resultCode: 0,
  checkoutRequestID: "manual_" + Date.now(),
  merchantRequestID: "manual_" + Date.now()
});
await Transaction.create({
  user: receiverWallet.user,
  accountNumber: senderWallet.accountNumber,
  counterpartyName: senderDisplayName,

  amount: request.amount,
  direction: "in",
  status: "success",

  resultCode: 0,
  checkoutRequestID: "manual_" + Date.now(),
  merchantRequestID: "manual_" + Date.now()
});


  return request;
};


// ❌ REJECT REQUEST
exports.rejectRequest = async (userId, requestId) => {
 const request = await Request.findById(requestId);
if (!request) throw new Error("Request not found");

request.status = "rejected";
await request.save();




  // ❌ SAVE TRANSACTION
  await Transaction.create({
  user: request.toUser,
  accountNumber: request.fromAccount,
  counterpartyName: "Request Rejected",

  amount: request.amount,
  direction: "out",
  status: "failed",

  resultCode: 1,
  checkoutRequestID: "manual_reject_" + Date.now(),
  merchantRequestID: "manual_reject_" + Date.now()
});


  return request;
};

