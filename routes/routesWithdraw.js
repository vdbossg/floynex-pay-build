// FLOYNEX PAY\backend\routes\routesWithdraw.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { sendTestStatementEmail } = require("../serviceEmail"); // step 1 email function
const User = require("../models/User");
const { sendWithdrawalStatementEmail } = require("../serviceEmail"); // updated function
const MSafeWallet = require("../models/modelsMSafewallet"); // wallet model
const auth = require("../middleware/authMiddleware");
const { withdrawToMpesa } = require("../controllers/controllersWithdraw");
const Withdrawal = require("../models/Withdrawal");
const { creditUserWallet } = require("../services/servicesMSafewallet");
const { creditVault } = require("../services/servicesMSafeVault");
// POST /api/withdraw
router.post("/", auth, withdrawToMpesa);

// GET /api/withdraw/my - get all withdrawals for the logged-in user
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.id; // auth middleware should set req.user
    const withdrawals = await Withdrawal.find({ user: userId }).sort({ date: -1 }); // latest first
    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//router.post("/result", async (req, res) => {
  router.post(["/result", "/mpesa/result"], async (req, res) => {

  try {
    console.log("🔥 MPESA B2C CALLBACK HIT");
    console.log("Raw callback body:", JSON.stringify(req.body, null, 2));

    // 1️⃣ Extract data correctly whether Safaricom wraps it in 'Result' or not
    const resultContainer = req.body.Result || req.body;
    if (!resultContainer) {
      console.error("❌ Missing Result object in payload");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Missing Result payload" });
    }

    // 2️⃣ Pull conversation identifiers and status flags
    const rawConversationId = resultContainer.ConversationID;
    const resultCode = resultContainer.ResultCode;
    const resultDesc = resultContainer.ResultDesc;

    if (!rawConversationId) {
      console.error("❌ Missing ConversationID in callback payload");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Missing ConversationID" });
    }

    const conversationId = String(rawConversationId).trim();
    const params = resultContainer.ResultParameters?.ResultParameter || [];

    // 3️⃣ Format fallback data
    const mpesaTransactionId =
      params.find((p) => p.Key === "TransactionReceipt")?.Value ||
      resultContainer.TransactionID ||
      "UNKNOWN_TX";

    const receiverRaw =
  params.find((p) => p.Key === "ReceiverPartyPublicName")?.Value || "";

const receiverName = receiverRaw.includes(" - ")
  ? receiverRaw.split(" - ")[1].trim()
  : receiverRaw;

    console.log(`Processing Callback -> ConvID: ${conversationId} | Code: ${resultCode} | Desc: ${resultDesc}`);

    // 4️⃣ Update your MongoDB ledger tracking collections automatically
   // 4️⃣ Update your MongoDB ledger tracking collections automatically
    if (resultCode === 0) {
      // 🌟 FIX: Use the clean, trimmed 'conversationId' string variable
      const withdrawal = await Withdrawal.findOne({
        conversationId: conversationId
      });

// safety check
if (!withdrawal) {
  
  console.error(`⚠️ No withdrawal found for: ${conversationId}`);
  return res.status(200).json({ ResultCode: 0, ResultDesc: "Ignored" });
}

// prevent double callback issues
if (withdrawal.status === "completed") {
  console.log(`⚠️ Already processed: ${conversationId}`);
  return res.status(200).json({ ResultCode: 0, ResultDesc: "Already processed" });
}

// update safely
withdrawal.mpesaTransactionId = mpesaTransactionId;
withdrawal.receiverName = receiverName;
withdrawal.status = "completed";

await withdrawal.save();

console.log(`✅ Withdrawal completed: ${conversationId}`);
   } else {
      console.error(`❌ M-Pesa payout processing rejected by Safaricom: ${resultDesc} (Code: ${resultCode}). Initiating automated rollback...`);
      
      // Start a session to make sure the refund is atomic
      const rollbackSession = await mongoose.startSession();
      rollbackSession.startTransaction();

      try {
        const withdrawal = await Withdrawal.findOne({ conversationId: conversationId }).session(rollbackSession);

        if (withdrawal && withdrawal.status === "pending") {
          // 1️⃣ Refund the user's wallet with the total deducted amount (amount + tariff)
          await creditUserWallet(withdrawal.user, withdrawal.totalDeducted, rollbackSession);

          // 2️⃣ Refund the global company float vault
          await creditVault({
            amount: withdrawal.amountWithdrawn,
            userId: withdrawal.user,
            reference: `REFUND:${withdrawal.walletAccountNumber}`
          }, rollbackSession);

          // 3️⃣ Mark the status as failed
          withdrawal.status = "failed";
          withdrawal.resultDescription = resultDesc || "Rejected by Safaricom";
          await withdrawal.save({ session: rollbackSession });

          await rollbackSession.commitTransaction();
          console.log(`✅ Automated rollback completed successfully. Funds returned for ConvID: ${conversationId}`);
        } else {
          console.warn(`⚠️ Rollback skipped: Withdrawal record not found or already processed for ConvID: ${conversationId}`);
          await rollbackSession.abortTransaction();
        }
      } catch (rollbackErr) {
        await rollbackSession.abortTransaction();
        console.error(`🚨 CRITICAL: Automated rollback failed for ConvID: ${conversationId}! Manual intervention required. Error:`, rollbackErr);
      } finally {
        rollbackSession.endSession();
      }
    }

    // Safaricom strictly requires a 200 OK text response format to close out tasks
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("❌ CALLBACK INTERCEPT CRASH ERROR:", err);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Processing Error" });
  }
});

// ✅ Step 1: test email route
router.post("/email-statement", auth, async (req, res) => {
  const { startDate, endDate, pin } = req.body; // frontend sends these
  try {
    // 1️⃣ Find the user's wallet
    const wallet = await MSafeWallet.findOne({ user: req.user.id });
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    // 2️⃣ Verify PIN
    const bcrypt = require("bcryptjs");
    const isPinValid = await bcrypt.compare(pin, wallet.pin);
    if (!isPinValid) return res.status(401).json({ success: false, message: "Invalid PIN" });

    // 3️⃣ Fetch withdrawals in date range
    const withdrawals = await Withdrawal.find({
      user: req.user.id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: -1 });

    // 4️⃣ Send PDF email
    await sendWithdrawalStatementEmail(wallet.email || req.user.email, wallet, withdrawals, startDate, endDate);

    res.json({ success: true, message: "Withdrawal statement sent successfully" });
  } catch (err) {
    console.error("❌ Email statement error:", err);
    res.status(500).json({ success: false, message: "Failed to send withdrawal statement" });
  }
});
module.exports = router;
