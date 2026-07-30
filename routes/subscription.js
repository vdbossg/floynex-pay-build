// C:\Users\LENOVO\Desktop\FLOYNEX PAY\backend\routes\subscription.js
const express = require("express");
const router = express.Router();
const { watchman, subscribe, checkActive } = require("../controllers/subscriptionController");
const auth = require("../middleware/auth");
const Subscription = require("../models/Subscription");
const AffiliateReferral = require("../models/AffiliateReferral");
const { creditVault } = require("../services/servicesMSafeVault");
const {
    createIncome
} = require(
    "../services/subledgerService");
// GET logged-in user info
router.get("/watchman", auth, watchman);

// POST subscribe
router.post("/:userId", auth, subscribe);

// GET active status
router.get("/active/:userId", auth, checkActive);


// MPESA STK Callback
// MPESA STK Callback
router.post("/payment/callback", async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;
    if (!callback) return res.status(400).json({ error: "Invalid callback format" });

    const checkoutId = callback.CheckoutRequestID?.trim();
    if (!checkoutId) return res.status(400).json({ error: "Missing CheckoutRequestID" });

    const items = callback.CallbackMetadata?.Item || [];
    const getValue = (name) => items.find(i => i.Name === name)?.Value || null;

    const mpesaReceipt = getValue("MpesaReceiptNumber");
    const amount = getValue("Amount");
    const subscriberPhone = getValue("PhoneNumber"); // subscriber's phone

    // Update subscription
    let updatedSub = await Subscription.findOneAndUpdate(
  { mpesaTxId: checkoutId },
  {
    status: callback.ResultCode === 0 ? "active" : "failed",
    mpesaReceipt,
    amount,
    subscriberPhone, // store subscriber phone separately
    startDate: callback.ResultCode === 0 ? new Date() : undefined,
    endDate: callback.ResultCode === 0 ? new Date(Date.now() + 30*24*60*60*1000) : undefined
  },
  { returnDocument: "after" }
);

// ⚡ Step 2b: credit vault if payment successful
if (callback.ResultCode === 0 && updatedSub) {

  try {

    console.log("🔵 BEFORE createIncome");

    const ledger = await createIncome({
      amount,
      source: "subscription",
      reference: mpesaReceipt,
      subscriptionId: updatedSub._id
    });

    console.log("🟢 Ledger created:", ledger);

  } catch (ledgerErr) {

    console.error("🔴 createIncome FAILED:", ledgerErr);

  }

  try {
    await creditVault({
      amount,
      userId: updatedSub.userId,
      reference: mpesaReceipt
    });
    console.log(`💰 Vault credited: ${amount} KES for subscription of user ${updatedSub.userId}`);
  } catch (vaultErr) {
    console.error("❌ Failed to credit vault:", vaultErr);
  }
}
// Update referral after first successful subscription
if (callback.ResultCode === 0 && updatedSub) {

  const referral = await AffiliateReferral.findOne({
    userId: updatedSub.userId
  });

  if (
    referral &&
    referral.firstTimeSubscriptionStatus === "pending"
  ) {

    referral.firstTimeSubscriptionStatus = "subscribed";
    referral.firstSubscriptionDate = new Date();
    referral.subscriptionId = updatedSub._id;
    referral.mpesaReceipt = mpesaReceipt;

    await referral.save();

    console.log("✅ Affiliate referral updated.");
  }
}

    if (!updatedSub) {
      console.warn("❌ No subscription found for CheckoutRequestID:", checkoutId);
      return res.status(404).json({ message: "No subscription found for this transaction" });
    }

    console.log("✅ Subscription updated successfully:", {
      checkoutId,
      mpesaReceipt,
      amount,
      subscriberPhone,
      status: updatedSub.status
    });

    res.json({ message: "Callback processed successfully" });

  } catch (err) {
    console.error("Callback processing error:", err);
    res.status(500).json({ error: "Callback error" });
  }
});
module.exports = router;
