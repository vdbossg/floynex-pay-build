// FLOYNEX PAY/backend/controllers/paymentController.js

const axios = require("axios");
const moment = require("moment");
const Transaction = require("../models/Transaction");
const { creditVault } = require("../services/servicesMSafeVault");
const { creditUserWallet } = require("../services/servicesMSafewallet");
// Add this at the top of your file
const MSafeWallet = require("../models/modelsMSafewallet");


// =========================
// GET ACCESS TOKEN
// =========================
exports.getToken = async (req, res) => {
  try {
    const url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    //const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const auth = Buffer.from(
      process.env.MPESA_CONSUMER_KEY + ":" + process.env.MPESA_CONSUMER_SECRET
    ).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error("❌ Token Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
};

// =========================
// STK PUSH
// =========================
exports.stkPush = async (req, res) => {
  try {
    // 🔥 ADD THIS GUARD
    const senderWallet = await MSafeWallet.findOne({ user: req.user.id });
    if (!senderWallet) {
      return res.status(403).json({ 
        status: "error", 
        message: "Wallet not found. Please create a wallet first." 
      });
    }
    // ✅ Extract paymentIdentity from frontend body data payload
    const { phone, amount, paymentIdentity } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: "Phone and amount are required" });
    }

   // ✅ Switch AccountReference dynamically (Allowing Spaces)
    let accountRef = "FLOYNEX";
    if (paymentIdentity === "personal") {
      // Allows letters, numbers, and spaces (\s), then trims extra space and limits to 12 chars
      accountRef = (req.user.fullName || "Personal").replace(/[^a-zA-Z0-9\s]/g, "").trim().substring(0, 22);
    } else {
      // Allows letters, numbers, and spaces (\s) for business names too
      accountRef = (req.user.businessName || "FLOYNEX").replace(/[^a-zA-Z0-9\s]/g, "").trim().substring(0, 22);
    }

    // 1. Get access token
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const auth = Buffer.from(
      process.env.MPESA_CONSUMER_KEY + ":" + process.env.MPESA_CONSUMER_SECRET
    ).toString("base64");

    const tokenResponse = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const token = tokenResponse.data.access_token;

    // 2. Timestamp
    const timestamp = moment().format("YYYYMMDDHHmmss");

    // 3. Password
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE +
      process.env.MPESA_PASSKEY +
      timestamp
    ).toString("base64");

    // 4. STK Request
    const response = await axios.post(
      //"https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: accountRef, // ✅ Dynamically evaluated reference applied here
        TransactionDesc: "Payment"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // ✅ SAVE AS PENDING
    await Transaction.create({
      user: req.user.id,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      resultCode: 1, // pending
      resultDesc: "Pending",
      amount,
      phoneNumber: phone
    });

    // ✅ CLEAN RESPONSE FOR SELLER
    res.json({
      status: "success",
      message: "STK push sent. Waiting for customer PIN...",
      checkoutRequestID: response.data.CheckoutRequestID,
      phone,
      amount
    });

  } catch (error) {
    console.error("❌ STK Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
};

// =========================
// CALLBACK HANDLER (UPDATE)
// =========================
exports.callback = async (req, res) => {
  try {
    console.log("📥 MPESA CALLBACK:", JSON.stringify(req.body, null, 2));

    const data = req.body.Body.stkCallback;
    const items = data.CallbackMetadata?.Item || [];

    const getValue = (name) => {
      const item = items.find(i => i.Name === name);
      return item ? item.Value : null;
    };

    const rawDate = getValue("TransactionDate");

    let formattedDate = "";
    let formattedTime = "";

    if (rawDate) {
      const dateStr = rawDate.toString();

      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(8, 10);
      const minute = dateStr.substring(10, 12);
      const second = dateStr.substring(12, 14);

      formattedDate = `${day}/${month}/${year}`;
      formattedTime = `${hour}:${minute}:${second}`;
    }

    // ✅ UPDATE EXISTING TRANSACTION
    // 1. FIND EXISTING TRANSACTION (BEFORE UPDATE)
    const existingTx = await Transaction.findOne({
      checkoutRequestID: data.CheckoutRequestID
    });

    // 2. UPDATE TRANSACTION
    const transaction = await Transaction.findOneAndUpdate(
      { checkoutRequestID: data.CheckoutRequestID },
      {
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc,
        amount: getValue("Amount"),
        mpesaReceiptNumber: getValue("MpesaReceiptNumber"),
        phoneNumber: getValue("PhoneNumber"),
        transactionDate: rawDate,
        date: formattedDate,
        time: formattedTime,
        name: "Customer"
      },
      { returnDocument: "after" }
    );

    // 3. CREDIT VAULT ONLY IF:
    // - It was NOT success before
    // - It is NOW success
    if (existingTx && existingTx.resultCode !== 0 && data.ResultCode === 0) {
      const amount = Number(getValue("Amount") || 0);

      if (amount > 0) {
        // ✅ 1. CREDIT VAULT (REAL MONEY)
        await creditVault({
          amount,
          userId: transaction.user,
          reference: getValue("MpesaReceiptNumber")
        });

        // ✅ 2. CREDIT USER WALLET (REFLECTION)
        await creditUserWallet(transaction.user, amount);

        console.log("💰 Vault + Wallet credited:", amount);
      }
    }

    console.log("✅ Transaction updated:", transaction);
    res.json({ message: "Callback processed successfully" });

  } catch (error) {
    console.error("❌ Callback Error:", error);
    res.status(500).json({ error: "Callback processing failed" });
  }
};

// =========================
// GET TRANSACTIONS (CLEAN VIEW)
// =========================
exports.getTransactions = async (req, res) => {
  try {
   const transactions = await Transaction.find({
  user: req.user.id,
  resultCode: 0,
  time: { $ne: null }
})
.sort({ createdAt: -1 }); // newest first

    res.json({
      status: "success",
      data: transactions.map(t => ({
        checkoutRequestID: t.checkoutRequestID,
        resultCode: t.resultCode,

        status:
          t.resultCode === 0
            ? "success"
            : t.resultCode === 1
            ? "pending"
            : "failed",

        message: t.resultDesc,
        amount: t.amount,
        phone: t.phoneNumber,
        receipt: t.mpesaReceiptNumber,
        name: t.name,
        time: t.time,
        date: t.date
      }))
    });

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
// =========================
// ADMIN: TRANSACTION AUDIT LOGS
// =========================
exports.getTransactionAuditLogs = async (req, res) => {
  try {
    const {
      mpesaReceiptNumber,
      phoneNumber,
      userId,
      checkoutRequestID,
      startDate,
      endDate
    } = req.query;

    // Base filter (NO restrictions → admin sees everything)
    let filter = {};

    // Dynamic search filters
    if (mpesaReceiptNumber) {
      filter.mpesaReceiptNumber = mpesaReceiptNumber;
    }

    if (phoneNumber) {
      filter.phoneNumber = phoneNumber;
    }

    if (userId) {
      filter.user = userId;
    }

    if (checkoutRequestID) {
      filter.checkoutRequestID = checkoutRequestID;
    }

    // Optional date range filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await require("../models/Transaction")
      .find(filter)
      .populate("user", "fullName email phone businessName") // enrich user info
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      count: transactions.length,
      data: transactions
    });

  } catch (error) {
    console.error("❌ Audit Logs Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch transaction audit logs"
    });
  }
};
