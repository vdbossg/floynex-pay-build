// FLOYNEX PAY\backend\services\servicesBankVault.js
const MSafeVault = require("../models/MSafeVault");  // <- use your original vault model
const MSafeLedger = require("../models/MSafeLedger");
const MpayStaff = require("../models/MpayStaffsAdmins");
const MSafeWallet = require("../models/modelsMSafewallet");
const bcrypt = require("bcryptjs");
const MpayAdminWithdraws = require("../models/MpayAdminWithdraws");
// ✅ Get the single vault document
async function getVault() {
  let vault = await MSafeVault.findOne(); // no create, just get the existing one
  if (!vault) throw new Error("Vault not found! Check the database for the original document.");
  return vault;
}

// ✅ Get full vault data
exports.getVaultData = async () => {
  return await getVault();
};

// ✅ Withdraw to wallet
exports.withdrawToWallet = async ({ staffId, staffPassword, walletAccountNumber, amount }) => {
  if (!amount || amount <= 0) throw new Error("Invalid withdrawal amount");

  // Verify staff
  const staff = await MpayStaff.findById(staffId);
  if (!staff) throw new Error("Staff not found");
  if (staff.status !== "active") throw new Error("Staff inactive");
  if (!["Owner", "CEO", "Dev", "vdbossg2511"].some(r => staff.role.includes(r))) {
    throw new Error("Unauthorized staff role");
  }

  const passwordMatch = await bcrypt.compare(staffPassword, staff.password);
  if (!passwordMatch) throw new Error("Incorrect staff password");

  // ✅ Use the single vault
  const vault = await getVault();
  if (vault.balance < amount) throw new Error("Insufficient vault funds");

  // Get wallet
  const wallet = await MSafeWallet.findOne({ accountNumber: walletAccountNumber });
  if (!wallet) throw new Error("Wallet not found");
  if (wallet.status !== "active") throw new Error("Wallet inactive/frozen");

  // Update balances
  vault.balance -= amount;
  vault.totalWithdrawals += amount;
  wallet.balance += amount;

  await vault.save();
  await wallet.save();

  // Record ledger
  // 🔹 prepare once
const transactionData = {
  type: "withdraw",
  amount,
  fromUser: staff._id,
  toUser: wallet.user,
  reference: `Vault -> Wallet: ${wallet.accountNumber}`,
  description: `Withdrawal by ${staff.first_name} ${staff.last_name}`,
  status: "completed"
};

// ✅ original (unchanged behavior)
await MSafeLedger.create(transactionData);

// 🔥 NEW: also save separately
await MpayAdminWithdraws.create(transactionData);

  return { vault, wallet };
};
