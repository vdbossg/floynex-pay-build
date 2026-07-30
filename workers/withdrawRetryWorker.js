//M-Safe\backend\workers\withdrawRetryWorker.js
const WithdrawUSDT = require("../models/modelWithdrawUSDT");
const { sendUSDT } = require("../services/tronTreasuryWallet");
const TreasuryWallet = require("../models/TreasuryWallet");
const MSafeWallet = require("../models/modelsMSafewallet");
const MAX_PER_RUN = 1;
let lastTronCall = 0;
// 🔒 prevents duplicate workers running at same time
let isProcessing = false;

async function processPendingWithdrawals() {
  if (isProcessing) {
    console.log("Worker already running...");
    return;
  }

  isProcessing = true;

  try {
    const pending = await WithdrawUSDT.find({
  status: "pending",
  createdAt: { $lt: new Date(Date.now() - 60 * 1000) }
}).limit(MAX_PER_RUN);

    if (!pending.length) {
  console.log("No pending withdrawals");
  return;
}

    console.log(`Processing ${pending.length} pending withdrawals...`);

    for (let w of pending) {
      try {
        console.log(`Retrying withdrawal ${w._id}`);
        const now = Date.now();
const diff = now - lastTronCall;

if (diff < 5000) {
  await new Promise(res => setTimeout(res, 5000 - diff));
}

lastTronCall = Date.now();
        const result = await sendUSDT(w.tronAddress, w.amountUSDT);

        // 🚨 STOP retrying dead transactions
if (result.error && result.error.includes("OUT_OF_ENERGY")) {

  await WithdrawUSDT.updateOne(
    { _id: w._id },
    {
      status: "failed",
      error: result.error
    }
  );

  // 💰 REFUND USER
  await TreasuryWallet.updateOne(
    { _id: w.treasuryId },
    { $inc: { usdtBalance: w.amountUSDT } }
  );

  await MSafeWallet.updateOne(
    { user: w.user },
    { $inc: { balance: w.amountKES } }
  );

  console.log(`❌ FAILED (no energy) & REFUNDED: ${w._id}`);
  continue;
}

        // ✅ SUCCESS
        if (result.status === "success" || result.status === "confirmed") {
          await WithdrawUSDT.updateOne(
            { _id: w._id },
            {
              status: "success",
              txHash: result.txHash
            }
          );

          console.log(`SUCCESS: ${w._id}`);
          continue;
        }

        // ⏳ STILL PENDING (NO TRX)
        if (result.status === "pending") {
          console.log(`STILL PENDING: ${w._id}`);
          continue;
        }

        // ❌ FAILED → rollback everything
        await WithdrawUSDT.updateOne(
          { _id: w._id },
          {
            status: "failed",
            error: result.error
          }
        );

        await TreasuryWallet.updateOne(
          { _id: w.treasuryId },
          { $inc: { usdtBalance: w.amountUSDT } }
        );

        await MSafeWallet.updateOne(
          { user: w.user },
          { $inc: { balance: w.amountKES } }
        );

        console.log(`FAILED & REFUNDED: ${w._id}`);

      } catch (err) {
        console.log(`Error retrying ${w._id}:`, err.message);
      }

      // 🛑 IMPORTANT: prevents TRON API 429 rate limit
      await new Promise(res => setTimeout(res, 2500));
    }

  } catch (err) {
    console.log("Retry worker error:", err.message);

  } finally {
    isProcessing = false;
  }
}

module.exports = { processPendingWithdrawals };