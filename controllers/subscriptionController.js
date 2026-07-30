// C:\Users\LENOVO\Desktop\M-Safe\backend\controllers\subscriptionController.js
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { stkPush } = require("../services/mpesa");

// 1️⃣ Watchman endpoint
const watchman = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ userId: user._id, name: user.firstName, email: user.email });
  } catch (err) {
    console.error("Watchman error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// 2️⃣ Subscribe endpoint
const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ⚡ MINIMAL FIX: Read from env instead of hardcoding 10
    const amount = Number(process.env.SUBSCRIPTION_AMOUNT) || 10; 

    // Safely get subscriber phone from request or fallback to user's phone
    const subscriberPhone = (req.body && req.body.phone) ? req.body.phone : user.phone;
    if (!subscriberPhone) return res.status(400).json({ error: "Subscriber phone is required" });

    // Step 1a: receiver is now the Vault shortcode
    const vaultShortcode = process.env.MPESA_VAULT_SHORTCODE;

    // Trigger STK push (payer enters PIN)
    const response = await stkPush(
      subscriberPhone, 
      amount, 
      process.env.SUBSCRIPTION_CALLBACK_URL, 
      vaultShortcode
    );
    
    // ... rest of your code remains completely unchanged

    const checkoutId = response.CheckoutRequestID?.trim();
    if (!checkoutId) return res.status(500).json({ error: "MPESA did not return CheckoutRequestID" });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 30);

    let sub = await Subscription.findOne({ userId });
    if (!sub) {
      sub = new Subscription({
        userId,
        name: user.firstName,
        email: user.email,
        amount,
        startDate: now,
        endDate,
        status: "pending",
        mpesaTxId: checkoutId,
        phone: vaultShortcode,           // ⚡ now points to Vault shortcode
        subscriberPhone: subscriberPhone // payer/subscriber
      });
      await sub.save();
      console.log("📥 New subscription saved with mpesaTxId:", checkoutId);
    } else {
      sub.startDate = now;
      sub.endDate = endDate;
      sub.status = "pending";
      sub.mpesaTxId = checkoutId;
      sub.phone = vaultShortcode;      // ⚡ now points to Vault shortcode
      sub.subscriberPhone = subscriberPhone;
      await sub.save();
      console.log("📌 Existing subscription updated with new mpesaTxId:", checkoutId);
    }

    res.json(sub);

  } catch (err) {
  console.error("Subscribe error:", err.message);

  if (err.response) {
    console.error("MPESA:", err.response.data);
  }

  res.status(500).json({
    error: err.message,
    details: err.response?.data
  });
}
};

// 3️⃣ Check active subscription
// 3️⃣ Check active subscription (with expiration check)
const checkActive = async (req, res) => {
  try {
    const userId = req.user.id;
    const sub = await Subscription.findOne({ userId });

    if (!sub) return res.json({ status: "inactive" });

    // ✅ Check if subscription has expired
    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = "inactive"; // mark expired
      await sub.save();
    }

    res.json(sub);
  } catch (err) {
    console.error("Check active error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { watchman, subscribe, checkActive };
