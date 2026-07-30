//FLOYNEX PAY\backend\services\servicesMSafeVault.js
const Vault = require("../models/MSafeVault");
const Ledger = require("../models/MSafeLedger");

async function getVault(session = null) {
  let vault = await Vault.findOne().session(session);

  if (!vault) {
    const created = await Vault.create([{}], { session });
    return created[0];
  }

  return vault;
}

// ✅ CREDIT VAULT
// ✅ CREDIT VAULT
exports.creditVault = async (data, session = null) => {
  const amount = typeof data === "number" ? data : data.amount;
  const userId = typeof data === "object" ? data.userId : null;
  const reference = typeof data === "object" ? data.reference : null;

  if (!amount || amount <= 0) {
    throw new Error("Invalid vault credit amount");
  }

  await getVault(session);

  const vault = await Vault.findOneAndUpdate(
    {},
    { 
      $inc: { 
        balance: amount,
        totalDeposits: amount 
      } 
    },
    { new: true, session }
  );

  if (!vault) {
    throw new Error("Failed to credit System Vault due to database error.");
  }

  await Ledger.create(
    [
      {
        type: "deposit",
        amount,
        toUser: userId || null,
        reference: reference || "MPESA",
        description: "Deposit from M-Pesa to Vault"
      }
    ],
    { session }
  );

  return vault;
};

// ✅ DEBIT VAULT
// ✅ DEBIT VAULT (Updated for High-Scale Concurrency)
exports.debitVault = async ({ amount, userId, reference, session }) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid vault debit amount");
  }

  // 1️⃣ Calculate Tariff based on amount
  let tariff = 0;
  if (amount <= 100) tariff = 0;
  else if (amount <= 1500) tariff = 5;
  else if (amount <= 5000) tariff = 9;
  else if (amount <= 20000) tariff = 11;
  else if (amount <= 250000) tariff = 13;
  else throw new Error("Amount exceeds maximum M-Pesa B2C single transfer limit of KSh 250,000");

  const totalDeducted = amount + tariff;

  // 2️⃣ 🌟 ATOMIC DEDUCTION WITH LOCK
  // This updates the global pool directly in MongoDB using $inc and tracks it inside the user's active session.
  const vault = await Vault.findOneAndUpdate(
    { balance: { $gte: totalDeducted } }, // Protection rule: Ensure the global float can cover this payout
    { 
      $inc: { 
        balance: -totalDeducted,
        totalWithdrawals: amount 
      } 
    },
    { new: true, session } // 🌟 CRITICAL: Tied to the controller transaction block
  );

  if (!vault) {
    throw new Error("System Vault has insufficient funds to clear this transfer float.");
  }

  // 3️⃣ Create Ledger entry tied to the active database transaction session
  await Ledger.create(
    [
      {
        type: "withdraw",
        amount,
        fromUser: userId || null,
        reference: reference || "MPESA",
        description: `Withdraw from Vault to Mpesa (tariff: ${tariff})`
      }
    ],
    { session }
  );

  return {
    success: true,
    withdrawnAmount: amount,
    tariff,
    totalDeducted,
    remainingVaultBalance: vault.balance
  };
};

// ✅ GET VAULT
exports.getVaultData = async () => {
  return await getVault();
};
