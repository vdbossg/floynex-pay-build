// C:\Users\LENOVO\Desktop\M-Safe\backend\services\mpesa.js
const axios = require("axios");
const moment = require("moment");

// Env variables
const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  CALLBACK_URL
} = process.env;

let tokenCache = { access_token: null, expires_at: null };

// Get access token
async function getAccessToken() {
  const now = new Date();
  if (tokenCache.access_token && tokenCache.expires_at > now) {
    return tokenCache.access_token;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const res = await axios.get(
    //"https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );

  const expires_at = new Date();
  expires_at.setSeconds(expires_at.getSeconds() + Number(res.data.expires_in || 3599));

  tokenCache = { access_token: res.data.access_token, expires_at };
  return res.data.access_token;
}

// STK push – now accepts a callbackUrl parameter
async function stkPush(payerPhone, amount, callbackUrl = CALLBACK_URL, receiverShortcode = MPESA_SHORTCODE) {
  const token = await getAccessToken();

  const timestamp = moment().format("YYYYMMDDHHmmss");
//const password = Buffer.from(receiverShortcode + process.env.MPESA_VAULT_PASSKEY + timestamp).toString("base64");
const password = Buffer.from(
  receiverShortcode + MPESA_PASSKEY + timestamp
).toString("base64");

// ⚡ Format phone to 2547XXXXXXXX
const formattedPhone = payerPhone.startsWith("0")
  ? "254" + payerPhone.slice(1)
  : payerPhone;

const payload = {
  BusinessShortCode: receiverShortcode,
  Password: password,
  Timestamp: timestamp,
  TransactionType: "CustomerPayBillOnline",
  Amount: Number(amount),         // ensure numeric
  PartyA: formattedPhone,         // payer enters PIN
  PartyB: receiverShortcode,      // receiver is Vault
  PhoneNumber: formattedPhone,    // subscriber phone
  CallBackURL: callbackUrl,
  AccountReference: "FLOYNEX Subscription",
  TransactionDesc: "Monthly subscription 10KES"
};

console.log("🔹 STK Payload:", payload); // optional debug

  const res = await axios.post(
    //"https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data; // Contains CheckoutRequestID
}

module.exports = { stkPush };
