//FLOYNEX PAY\backend\services\servicesMpesaB2C.js
const axios = require("axios");

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_B2C_SHORTCODE,
  MPESA_B2C_INITIATOR_NAME,
  MPESA_B2C_SECURITY_CREDENTIAL,
  MPESA_B2C_RESULT_URL,
  MPESA_B2C_TIMEOUT_URL,
} = process.env;

// ✅ Use v3 endpoint for sandbox
const MPESA_BASE_URL =
  "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";

// 🔑 Get Access Token
async function getAccessToken() {
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(
  "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  {
    headers: { Authorization: `Basic ${auth}` },
  }
);

  return res.data.access_token;
}

// 💸 Send B2C Payment
// 💸 Send B2C Payment
async function sendToMpesa({ phone, amount, userId, conversationId }) {
  try {
    // Validate phone
    if (!/^254\d{9}$/.test(phone)) {
      return { success: false, message: "Invalid phone number format" };
    }

    if (amount <= 0) {
      return { success: false, message: "Invalid amount" };
    }

    const token = await getAccessToken();
    console.log("B2C TOKEN EXISTS:", !!token);
    console.log("B2C TOKEN LENGTH:", token?.length);

    const payload = {
      OriginatorConversationID: conversationId,
      InitiatorName: MPESA_B2C_INITIATOR_NAME, 
      SecurityCredential: MPESA_B2C_SECURITY_CREDENTIAL, 
      CommandID: "PromotionPayment", // 🌟 Left exactly as is since it works for your shortcode configuration!
      Amount: amount,
      PartyA: MPESA_B2C_SHORTCODE, 
      PartyB: phone, 
      Remarks: "FLOYNEX Withdrawal",
      QueueTimeOutURL: MPESA_B2C_TIMEOUT_URL,
      ResultURL: MPESA_B2C_RESULT_URL,
      Occasion: "Withdraw", 
    };

    // 🌟 Network isolation protection: prevents an external lag spike from freezing your DB
    const response = await axios.post(MPESA_BASE_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000 // 15 seconds network fail-safe
    });

    if (response.data.ResponseCode !== "0") {
      return {
        success: false,
        message: response.data.ResponseDescription || "M-Pesa request failed",
        data: response.data,
      };
    }

    console.log("✅ B2C SENT:", response.data);

    return {
      success: true,
      ConversationID: response.data.ConversationID || conversationId,
      OriginatorConversationID: response.data.OriginatorConversationID,
      data: response.data,
    };
  } catch (err) {
    console.error("❌ B2C STATUS:", err.response?.status);
    console.error("❌ B2C DATA:", JSON.stringify(err.response?.data, null, 2));
    console.error("❌ B2C MESSAGE:", err.message);

    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      return {
        success: false,
        message: "Safaricom gateway connection timeout. Please check back shortly.",
      };
    }

    return {
      success: false,
      message: err.response?.data?.ErrorMessage || "Mpesa request failed",
    };
  }
}

module.exports = { sendToMpesa };
