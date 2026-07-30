// M-Safe/backend/services/tronTreasuryWallet.js
const TronWeb = require("tronweb").TronWeb;

const tronWeb = new TronWeb({
  fullHost: process.env.TRON_FULL_NODE || "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "" },
  privateKey: process.env.TRON_PRIVATE_KEY
});

const USDT_CONTRACT = process.env.TRON_USDT_CONTRACT;

// simple retry helper
async function retry(fn, retries = 3, delay = 1000) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

async function sendUSDT(to, amountUSDT) {
  if (!tronWeb.isAddress(to)) {
    throw new Error("Invalid Tron address");
  }

  if (!amountUSDT || amountUSDT <= 0) {
    throw new Error("Invalid amount");
  }

  const senderAddress = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);
  if (to === senderAddress) {
    throw new Error("Cannot send to same address");
  }

  const contract = await tronWeb.contract().at(USDT_CONTRACT);
  const amount = Math.floor(amountUSDT * 1_000_000);

  let txHash;

try {
  txHash = await contract.transfer(to, amount).send({
    feeLimit: 100_000_000
  });

  console.log("TX HASH:", txHash);

} catch (err) {
  console.error("TRON SEND FAILED:", err.message);

  // ✅ HANDLE LOW TRX (THIS IS THE FIX)
  if (err.message.includes("Account resource insufficient")) {
    return {
      status: "pending",
      reason: "INSUFFICIENT_TRX",
      message: "Not enough TRX. Will retry later."
    };
  }

  return {
    status: "failed",
    error: err.message
  };
}

  if (!txHash) {
  return {
    status: "failed",
    error: "Transaction broadcast failed"
  };
}

  // 🔥 Wait and confirm
  let receipt;
  let attempts = 25;

 while (attempts > 0) {
  receipt = await tronWeb.trx.getTransactionInfo(txHash);

  console.log("TX RECEIPT:", JSON.stringify(receipt, null, 2));

  // ⛔ still pending (this is NORMAL on Tron)
  if (!receipt || typeof receipt !== "object" || !receipt.receipt) {
  console.log("Still pending on-chain (not indexed yet)...");
  await new Promise(res => setTimeout(res, 5000));
  attempts--;
  continue;
}

  // ✅ confirmed success
  if (
  receipt.receipt?.result === "SUCCESS" ||
  receipt.ret?.[0]?.contractRet === "SUCCESS"
) {
  break;
}

  // ❌ confirmed failure
  if (receipt.receipt && receipt.receipt.result === "FAILED") {
    return {
  status: "failed",
  error: "On-chain failed: " + JSON.stringify(receipt.receipt)
};
  }

  await new Promise(res => setTimeout(res, 3000));
  attempts--;
}

  if (
  !receipt ||
  (receipt.receipt?.result !== "SUCCESS" &&
   receipt.ret?.[0]?.contractRet !== "SUCCESS")
) {
    throw new Error(
      "Transaction failed on-chain: " +
      JSON.stringify(receipt?.receipt || receipt)
    );
  }

  return {
    txHash,
    status: "confirmed"
  };
}

module.exports = { sendUSDT };
