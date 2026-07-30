//C:\Users\LENOVO\Desktop\M-Safe\backend\routes\paymentCallback.js
//const express = require("express");
//const router = express.Router();
//const Subscription = require("../models/Subscription");

// STK Callback
//.post("/payment/callback", async (req, res) => {
  //const body = req.body;

  //try {
    //const resultCode = body.Body.stkCallback.ResultCode;
    //const checkoutId = body.Body.stkCallback.CheckoutRequestID.trim();

    //const metadata = body.Body.stkCallback.CallbackMetadata;
    //let mpesaReceipt = null;

    //if (metadata && metadata.Item) {
      //metadata.Item.forEach(i => {
       // if (i.Name === "MpesaReceiptNumber") mpesaReceipt = i.Value;
      //});
    //}

    // Find subscription using CheckoutRequestID
    //let sub = await Subscription.findOne({ mpesaTxId: checkoutId });

    //if (!sub) {
      //console.log("❌ No subscription found for:", checkoutId);
      //const all = await Subscription.find();
      //console.log("📦 Stored IDs:", all.map(s => s.mpesaTxId));
      //return res.status(404).json({ message: "No subscription found" });
    //}

    // Update status
    //sub.status = resultCode === 0 ? "active" : "failed";

    // Store receipt
    //sub.mpesaReceipt = mpesaReceipt;

    // Update subscription dates
    //sub.startDate = new Date();
    //let end = new Date();
    //end.setDate(end.getDate() + 30);
    //sub.endDate = end;

    //await sub.save();

    //console.log("✅ Transaction updated:", sub);

    //res.json({ message: "Callback received" });
  //} catch (err) {
   // console.error(err);
   // res.status(500).json({ error: "Callback error" });
  //}
//});

//module.exports = router;