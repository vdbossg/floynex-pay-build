// FLOYNEX PAY\backend\controllers\controllersWithdraw.js
const MSafeWallet = require("../models/modelsMSafewallet");
const User = require("../models/User");
const { debitUserWalletForWithdrawal } = require("../services/servicesMSafewallet");
const { debitVault } = require("../services/servicesMSafeVault");
const { sendToMpesa } = require("../services/servicesMpesaB2C");
const bcrypt = require("bcryptjs");
const Ledger = require("../models/MSafeLedger");
const Withdrawal = require("../models/Withdrawal"); // New collection for withdrawals
const mongoose = require("mongoose");


    exports.withdrawToMpesa = async (req, res) => {
  // 🌟 STEP 1: Start a highly-scalable ACID Database Transaction Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { accountNumber, amount, pin, phone } = req.body;
    const MIN_WITHDRAWAL = 10;

    if (!accountNumber || !amount || !pin || !phone) {
      return res.status(400).json({
        success: false,
        message: "accountNumber, amount, pin and phone are required",
      });
    }

    const numericAmount = Number(amount);

    if (!numericAmount || isNaN(numericAmount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (numericAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}`,
      });
    }

    // --- Find Wallet ---
    // Attach the session to lock this document read step
    const wallet = await MSafeWallet.findOne({
      user: req.user.id,
      accountNumber,
    }).session(session);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }
// 🔒 SECURITY CHECKS
if (wallet.status === "frozen") {
  return res.status(403).json({
    success: false,
    message: "Your wallet is frozen",
  });
}

if (!wallet.isVerified) {
  return res.status(403).json({
    success: false,
    message: "Account not verified",
  });
}

if (wallet.kycStatus !== "verified") {
  return res.status(403).json({
    success: false,
    message: "KYC verification required",
  });
}
    // --- Check PIN ---
    const isPinValid = await bcrypt.compare(pin, wallet.pin);
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect PIN",
      });
    }

    // --- Get User Name ---
    const user = await User.findById(req.user.id).session(session);
    const fullName = user
      ? `${user.firstName} ${user.lastName}`
      : "Unknown User";

    // 🌟 STEP 2: Pre-calculate Tariff based on amount before hitting M-Pesa
    let tariff = 0;
    if (numericAmount <= 100) tariff = 0;
    else if (numericAmount <= 1500) tariff = 5;
    else if (numericAmount <= 5000) tariff = 9;
    else if (numericAmount <= 20000) tariff = 11;
    else if (numericAmount <= 250000) tariff = 13;
    else {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds maximum M-Pesa B2C single transfer limit of KSh 250,000",
      });
    }

    const totalRequired = numericAmount + tariff;

    // 🌟 STEP 3: Atomic Lock and Debit of Wallet with Session
    // This executes your updated scalable findOneAndUpdate service rule seamlessly
    const walletAfterDebit = await debitUserWalletForWithdrawal({
      userId: req.user.id,
      amount: totalRequired,
      session // Pass transaction down to service
    });

    // --- CREATE CONVERSATION ID ---
    const conversationId = `AG_${Date.now()}_${req.user.id}`;

    // --- SEND M-PESA ONLY ---
    const mpesaResult = await sendToMpesa({
      phone,
      amount: numericAmount,
      userId: req.user.id,
      conversationId,
    });

    if (!mpesaResult.success) {
      // 🌟 Throwing an error here auto-cancels the transaction and restores the user's funds!
      throw new Error(mpesaResult.message || "M-Pesa request failed");
    }

    // Capture the real Safaricom Conversation ID
    const finalConversationId = mpesaResult.ConversationID || mpesaResult.conversationId || conversationId;

    // ✅ DEBIT FLOYNEX VAULT POOL
    const vaultResult = await debitVault({
      amount: numericAmount,
      userId: req.user.id,
      reference: `Withdrawal:${wallet.accountNumber}`,
      session // 🌟 FIXED: Links the vault debit to the ACID transaction session
    });
    // ✅ CREATE TRACKING LOG WITHIN TRANSACTION BLOCK
    // Note: Mongoose requires document creation arrays when passing options with a session
   const withdrawalDocs = await Withdrawal.create(
      [
        {
          user: req.user.id,
          walletAccountNumber: wallet.accountNumber,
          fullName,
          receiverName: req.body.receiverName || "M-Pesa Recipient", // 🔥 Saves the target receiver name
          amountWithdrawn: numericAmount,
          tariff: tariff,
          totalDeducted: totalRequired,
          remainingWalletBalance: walletAfterDebit.balance,
          remainingVaultBalance: vaultResult.remainingVaultBalance || 0,
          conversationId: finalConversationId,
          mpesaTransactionId: "PENDING",
          phone,
          status: "pending",
          date: new Date(),
        }
      ],
      { session }
    );

    const withdrawalRecord = withdrawalDocs[0];

    // 🌟 STEP 4: Everything processed perfectly! Commit changes to MongoDB permanently
    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Withdrawal initiated. Waiting for M-Pesa confirmation",
      data: {
        WalletAccNo: wallet.accountNumber,
        FullName: fullName,
        amountWithdrawn: numericAmount,
        phone,
        mpesaTransactionId: finalConversationId,
        status: "pending",
        date: withdrawalRecord.date,
      },
    });

  } catch (err) {
    // 🌟 STEP 5: Clean Rollback point. Cancel all execution changes on any error
    await session.abortTransaction();
    session.endSession();

    console.error("❌ High-Scale Withdrawal Error:", err.message || err);
    return res.status(400).json({
      success: false,
      message: err.message || "Withdrawal failed",
    });
  }
};
