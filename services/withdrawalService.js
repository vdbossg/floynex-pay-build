//M-Safe\backend\services\withdrawalService.js
const mongoose = require("mongoose");
const MSafeWallet = require("../models/modelsMSafewallet");
const WithdrawUSDT = require("../models/modelWithdrawUSDT");
const { sendUSDT } = require("./tronTreasuryWallet");
const gatewayService = require("./gatewayService");
const TreasuryWallet = require("../models/TreasuryWallet");

async function withdrawUSDT({ userId, amountKES, tronAddress }) {
  if (!amountKES || amountKES <= 0) {
    throw new Error("Invalid amount");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Convert KES → USDT
    const amountUSDT = await gatewayService.convertKEStoUSDT({
      amountKES,
      reference: userId
    });

    if (!amountUSDT || isNaN(amountUSDT)) {
      throw new Error("Invalid conversion rate");
    }

    // 2. Debit user wallet
    const wallet = await MSafeWallet.findOneAndUpdate(
      {
        user: userId,
        status: { $ne: "frozen" },
        balance: { $gte: amountKES }
      },
      {
        $inc: { balance: -amountKES }
      },
      { returnDocument: "after", session }
    );

    if (!wallet) {
      throw new Error("Insufficient balance or wallet frozen");
    }

    // 3. Reserve treasury funds (IMPORTANT FIX)
    const treasury = await TreasuryWallet.findOneAndUpdate(
  {
    usdtBalance: { $gte: amountUSDT }
  },
  {
    $inc: { usdtBalance: -amountUSDT }
  },
  {
  returnDocument: "after",
  session
}
);

    if (!treasury) {
      throw new Error("Insufficient USDT liquidity in treasury");
    }

    // 4. Create withdrawal record
    const [record] = await WithdrawUSDT.create(
      [
        {
          user: userId,
          amountKES,
          amountUSDT,
          tronAddress,
          status: "processing"
        }
      ],
      { session }
    );

    // 5. Commit transaction BEFORE blockchain call
    await session.commitTransaction();
    session.endSession();

    // 6. Blockchain transfer (OUTSIDE transaction)
    let result;
    try {
      result = await sendUSDT(tronAddress, amountUSDT);
    } catch (chainErr) {
      // rollback logic (manual compensation)
      await WithdrawUSDT.updateOne(
        { _id: record._id },
        { status: "failed", error: chainErr.message }
      );

      // refund treasury + wallet
      await TreasuryWallet.findOneAndUpdate(
  { _id: treasury._id },
  { $inc: { usdtBalance: amountUSDT } }
);

      await MSafeWallet.updateOne(
        { user: userId },
        { $inc: { balance: amountKES } }
      );

      throw new Error("Blockchain transfer failed: " + chainErr.message);
    }

    // 7. Handle blockchain result properly

// ✅ SUCCESS
if (result.status === "success" || result.status === "confirmed") {
  await WithdrawUSDT.updateOne(
    { _id: record._id },
    {
      status: "success",
      txHash: result.txHash
    }
  );

  return {
    status: "success",
    txHash: result.txHash,
    amountUSDT
  };
}

// ⏳ PENDING (LOW TRX)
if (result.status === "pending") {
  await WithdrawUSDT.updateOne(
    { _id: record._id },
    {
      status: "pending",
      note: "Awaiting TRX for gas"
    }
  );

  return {
    status: "pending",
    amountUSDT
  };
}

// ❌ FAILED → rollback (refund)
await WithdrawUSDT.updateOne(
  { _id: record._id },
  {
    status: "failed",
    error: result.error
  }
);

// refund treasury
await TreasuryWallet.findOneAndUpdate(
  { _id: treasury._id },
  { $inc: { usdtBalance: amountUSDT } }
);

// refund user
await MSafeWallet.updateOne(
  { user: userId },
  { $inc: { balance: amountKES } }
);

return {
  status: "failed",
  error: result.error
};

  } catch (err) {
    // IMPORTANT: avoid double abort crash
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (_) {}

    session.endSession();

    throw new Error("Transfer failed: " + err.message);
  }
}

module.exports = { withdrawUSDT };