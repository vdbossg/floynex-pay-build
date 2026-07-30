//FLOYNEX PAY\backend\servicePDF.js
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs-extra");
let logoBase64 = "";

const axios = require("axios");

async function loadLogo() {
  try {
    const logoUrl = "https://msafeapp.com/logo.png";

    const response = await axios.get(logoUrl, {
      responseType: "arraybuffer"
    });

    logoBase64 = Buffer.from(response.data, "binary").toString("base64");

  } catch (err) {
    console.log("⚠️ Logo not found, continuing without it");
  }
}
// Function to generate Withdrawal Statement PDF
async function generateWithdrawalPDF(wallet, withdrawals, startDate, endDate) {
  await loadLogo();
  // Convert withdrawals dates to readable format
  const formattedWithdrawals = (withdrawals || []).map((w, idx) => {
    const dateObj = w.date ? new Date(w.date) : new Date();
    return {
      no: idx + 1,
      time: dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
      date: dateObj.toLocaleDateString("en-US"),
      accNo: w.walletAccountNumber || wallet.accountNumber || "-",
      senderName: w.fullName || "Sender Account", // 🔥 Name From
      receiverName: w.receiverName || "-",        // 🔥 Name To
      amount: typeof w.amountWithdrawn === "number" ? w.amountWithdrawn.toFixed(2) : parseFloat(w.amountWithdrawn || 0).toFixed(2),
      cost: typeof w.tariff === "number" ? w.tariff.toFixed(2) : parseFloat(w.tariff || 0).toFixed(2),
      mpesaTransactionId: w.mpesaTransactionId && w.mpesaTransactionId !== "PENDING" ? w.mpesaTransactionId : (w.conversationId || "PENDING"),
      phone: w.phone || "-",
    };
  });

  // HTML Template
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<meta charset="UTF-8">
<title>Withdrawal Statement</title>
<style>
  body {
  font-family: 'Roboto', Arial, sans-serif;
  font-size: 12px;
  margin: 40px;
  color: #1b5e20;
}
  h1, h2 { text-align: center; color: #2e7d32; margin: 5px 0; }
  h2 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  table, th, td { border: 1px solid #a5d6a7; }
  th, td { padding: 5px; text-align: left; font-size: 12px; }
  th { background-color: #e8f5e9; color: #1b5e20; }
  .section { margin-top: 15px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #2e7d32; }
  hr { border: 0; border-top: 1px solid #a5d6a7; }
</style>
</head>
<body>
<!-- WATERMARK WITH LOGO AND TEXT -->
<!-- MULTIPLE SUBTLE TEXT WATERMARKS -->
<div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
">
  ${[0,1,2].map(i => `
    <div style="
        position: absolute;
        top: ${20 + i*30}%;
        left: ${15 + i*25}%;
        transform: translate(-50%, -50%) rotate(-30deg);
        text-align: center;
        opacity: 0.2;          /* subtle visibility */
        font-size: 40px;       /* smaller text */
        font-weight: bold;
        color: #1b5e20;
    ">
      <img src="data:image/png;base64,${logoBase64}" 
     style="width: 250px; opacity: 0.5; display: block; margin: 0 auto;" /> <!-- slightly stronger logo -->
      FLOYNEX PAY
    </div>
  `).join('')}
</div>
<div style="display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:5px;">
  
  <!-- LOGO LEFT -->
  <img src="data:image/png;base64,${logoBase64}" 
       style="position:absolute; left:0; width:120px; height:auto;" />

  <!-- CENTER TEXT -->
  <div style="text-align:center;">
    <h1 style="margin:0; font-size:22px; font-weight:bold; color:#2e7d32;">
      FLOYNEX PAY
    </h1>
    <h2 style="margin:0; font-size:14px; color:#2e7d32;">WITHDRAW STATEMENT</h2>
  </div>
</div>
<hr style="border-top:1px solid #a5d6a7;" />
<p style="text-align:center;">WALLET TO MOBILE | PERIOD: ${startDate} TO ${endDate}</p>
<hr>

<div class="section">
  <strong>FROM</strong><br/>
  NAME: ${wallet.firstName} ${wallet.middleName} ${wallet.lastName}<br/>
  EMAIL: ${wallet.email}<br/>
  ACC NO: ${wallet.accountNumber}<br/>
</div>

<div class="section">
  <strong>TO</strong><br/>
  EMAIL: <span>${wallet.email}</span><br/>
</div>

<div class="section">
  <strong>WITHDRAWAL STATEMENT</strong>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Time</th>
        <th>Date</th>
        <th>Acc No</th>
        <th>Sender Name</th>
        <th>Receiver Name</th>
        <th>Amount (KES)</th>
        <th>Cost</th>
        <th>Mpesa ID</th>
        <th>Recipient Phone</th>
      </tr>
    </thead>
    <tbody>
      ${formattedWithdrawals.map(w => `
        <tr>
          <td>${w.no}</td>
          <td>${w.time}</td>
          <td>${w.date}</td>
          <td>${w.accNo}</td>
          <td style="text-transform: uppercase;">${w.senderName}</td>
          <td style="text-transform: uppercase;">${w.receiverName}</td>
          <td>${w.amount}</td>
          <td>${w.cost}</td>
          <td>${w.mpesaTransactionId}</td>
          <td>${w.phone}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>

<div class="section footer">
  Best Regards,<br/>
  FLOYNEX PAY<br/>
  &copy; 2026 FLOYNEX PAY
</div>

</body>
</html>
`;

  // Launch Puppeteer and generate PDF

const tmpDir = path.join(__dirname, "../tmp");
await fs.ensureDir(tmpDir);

// Clean old temp folders
const tempFolders = await fs.readdir(tmpDir);
for (const folder of tempFolders) {
  try { await fs.remove(path.join(tmpDir, folder)); } catch (e) { console.log("Temp cleanup failed:", e.message); }
}


try {
  tempProfileDir = path.join(tmpDir, `puppeteer_${Date.now()}_${Math.floor(Math.random()*1000)}`);

const { getBrowser } = require("./browser");
const browser = await getBrowser();
const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "load" });
await page.evaluateHandle('document.fonts.ready');

  const pdfPath = path.join(__dirname, `statements_${wallet.accountNumber}_${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

  return pdfPath;
} finally {
  
  // Delete temp folder automatically
  if (tempProfileDir) {
  await fs.remove(tempProfileDir).catch(err =>
    console.log("Temp cleanup failed:", err)
  );
}
}
}
// ✅ Function to generate Send/Received Statement PDF
async function generateSendReceivedPDF(wallet, transactions, startDate, endDate) {
  await loadLogo();
  const formattedTx = transactions.map((tx, idx) => {
    const dateObj = new Date(tx.createdAt);
    return {
      no: idx + 1,
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString(),
      name: tx.counterpartyName || "-", // Name of sender/receiver
      accNo: tx.accountNumber,
      type: tx.type || "-", // 'Sent' or 'Received'
      amount: tx.amount.toFixed(2)
    };
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<meta charset="UTF-8">
<title>Send/Received Statement</title>
<style>
  body {
  font-family: 'Roboto', Arial, sans-serif;
  font-size: 12px;
  margin: 40px;
  color: #1b5e20;
}
  h1, h2 { text-align: center; color: #2e7d32; margin: 5px 0; }
  h2 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  table, th, td { border: 1px solid #a5d6a7; }
  th, td { padding: 5px; text-align: left; font-size: 12px; }
  th { background-color: #e8f5e9; color: #1b5e20; }
  .section { margin-top: 15px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #2e7d32; }
  hr { border: 0; border-top: 1px solid #a5d6a7; }
</style>
</head>
<body>
<!-- WATERMARK WITH LOGO AND TEXT -->
<!-- MULTIPLE SUBTLE TEXT WATERMARKS -->
<div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
">
  ${[0,1,2].map(i => `
    <div style="
        position: absolute;
        top: ${20 + i*30}%;
        left: ${15 + i*25}%;
        transform: translate(-50%, -50%) rotate(-30deg);
        text-align: center;
        opacity: 0.2;          /* subtle visibility */
        font-size: 40px;       /* smaller text */
        font-weight: bold;
        color: #1b5e20;
    ">
     <img src="data:image/png;base64,${logoBase64}" 
     style="width: 250px; opacity: 0.5; display: block; margin: 0 auto;" /> <!-- slightly stronger logo -->
      FLOYNEX PAY
    </div>
  `).join('')}
</div>
<div style="display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:5px;">
  
  <!-- LOGO LEFT -->
  <img src="data:image/png;base64,${logoBase64}" 
       style="position:absolute; left:0; width:120px; height:auto;" />

  <!-- CENTER TEXT -->
  <div style="text-align:center;">
    <h1 style="margin:0; font-size:22px; font-weight:bold; color:#2e7d32;">
      FLOYNEX PAY
    </h1>
    <h2 style="margin:0; font-size:14px; color:#2e7d32;">SEND/RECEIVED STATEMENT</h2>
  </div>
</div>
<hr style="border-top:1px solid #a5d6a7;" />
<p style="text-align:center;">
  WALLET TO WALLET | PERIOD: ${startDate} TO ${endDate}
</p>
<hr>

<div class="section">
  <strong>FROM</strong><br/>
  NAME: ${wallet.firstName} ${wallet.middleName} ${wallet.lastName}<br/>
  EMAIL: ${wallet.email}<br/>
  ACC NO: ${wallet.accountNumber}<br/>
</div>

<div class="section">
  <strong>TO</strong><br/>
  EMAIL: ${wallet.email}<br/>
</div>

<div class="section">
  <strong>SEND/RECEIVED STATEMENT</strong>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Time</th>
        <th>Date</th>
        <th>Acc No</th>
        <th>Name</th>
        <th>Type</th>
        <th>Amount (KES)</th>
      </tr>
    </thead>
    <tbody>
      ${formattedTx.map(tx => `
        <tr>
          <td>${tx.no}</td>
          <td>${tx.time}</td>
          <td>${tx.date}</td>
          <td>${tx.accNo}</td>
          <td>${tx.name}</td>
          <td>${tx.type}</td>
          <td>${tx.amount}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>

<div class="section footer">
  Best Regards,<br/>
  FLOYNEX PAY<br/>
  &copy; 2026 FLOYNEX PAY
</div>

</body>
</html>
`;



const tmpDir = path.join(__dirname, "../tmp");
await fs.ensureDir(tmpDir);

// Clean old temp folders
const tempFolders = await fs.readdir(tmpDir);
for (const folder of tempFolders) {
  try { await fs.remove(path.join(tmpDir, folder)); } catch (e) { console.log("Temp cleanup failed:", e.message); }
}


try {
  tempProfileDir = path.join(tmpDir, `puppeteer_${Date.now()}_${Math.floor(Math.random()*1000)}`);

 

const { getBrowser } = require("./browser");
const browser = await getBrowser();
const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "load" });
await page.evaluateHandle('document.fonts.ready');

  const pdfPath = path.join(__dirname, `sr_statement_${wallet.accountNumber}_${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

  return pdfPath;
} finally {
  
  // Delete temp folder automatically
  if (tempProfileDir) {
  await fs.remove(tempProfileDir).catch(err =>
    console.log("Temp cleanup failed:", err)
  );
}
}
}

// ✅ FUNCTION 3: M-Pesa Transaction Table PDF (FIXED + CONSISTENT + SAFE)
async function generateTransactionPDF(wallet, transactions, startDate, endDate) {
  await loadLogo();

 // ✅ Normalize transactions safely
  const formatted = (transactions || []).map((t, idx) => {
    const dateObj = t.createdAt ? new Date(t.createdAt) : null;

    // 🚀 Fallback if phone is missing from callback update
    const safePhone = t.phoneNumber || wallet.phone || wallet.phoneNumber || "Customer";

    // 🚀 Generates a unique secure receipt tracking code if M-Pesa dropped the payload object reference
    let safeReceipt = t.mpesaReceiptNumber || "-";
    if (safeReceipt === "-" && t._id) {
      safeReceipt = `MFS${t._id.toString().substring(18, 24).toUpperCase()}PAY`;
    }

    return {
      no: idx + 1,

      phone: safePhone,
      amount: typeof t.amount === "number" ? t.amount.toFixed(2) : "0.00",
      receipt: safeReceipt,

      // Standardize date and time formatting across locales
      date: t.date || (dateObj ? dateObj.toLocaleDateString("en-GB") : "-"),
      time: t.time || (dateObj ? dateObj.toLocaleTimeString("en-GB", { hour12: false }) : "-"),

      // readable status
      status:
        t.resultCode === 0
          ? "✅ Paid"
          : t.resultCode !== undefined && t.resultCode !== null
          ? "❌ Failed"
          : "⏳ Pending"
    };
  });
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<meta charset="UTF-8">
<title>Transaction Statement</title>
<style>
  body {
  font-family: 'Roboto', Arial, sans-serif;
  font-size: 12px;
  margin: 40px;
  color: #1b5e20;
}
  h1, h2 { text-align: center; color: #2e7d32; margin: 5px 0; }
  h2 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  table, th, td { border: 1px solid #a5d6a7; }
  th, td { padding: 5px; text-align: left; font-size: 12px; }
  th { background-color: #e8f5e9; color: #1b5e20; }
  .section { margin-top: 15px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #2e7d32; }
  hr { border: 0; border-top: 1px solid #a5d6a7; }
</style>
</head>
<body>
<!-- WATERMARK WITH LOGO AND TEXT -->
<!-- MULTIPLE SUBTLE TEXT WATERMARKS -->
<div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
">
  ${[0,1,2].map(i => `
    <div style="
        position: absolute;
        top: ${20 + i*30}%;
        left: ${15 + i*25}%;
        transform: translate(-50%, -50%) rotate(-30deg);
        text-align: center;
        opacity: 0.2;          /* subtle visibility */
        font-size: 40px;       /* smaller text */
        font-weight: bold;
        color: #1b5e20;
    ">
      <img src="data:image/png;base64,${logoBase64}" 
     style="width: 250px; opacity: 0.5; display: block; margin: 0 auto;" /> <!-- slightly stronger logo -->
      FLOYNEX PAY
    </div>
  `).join('')}
</div>
<div style="display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:5px;">
  
  <!-- LOGO LEFT -->
  <img src="data:image/png;base64,${logoBase64}" 
       style="position:absolute; left:0; width:120px; height:auto;" />

  <!-- CENTER TEXT -->
  <div style="text-align:center;">
    <h1 style="margin:0; font-size:22px; font-weight:bold; color:#2e7d32;">
      FLOYNEX PAY
    </h1>
    <h2 style="margin:0; font-size:14px; color:#2e7d32;">TRANSACTIONS STATEMENT</h2>
  </div>
</div>
<hr style="border-top:1px solid #a5d6a7;" />
<p style="text-align:center;">MOBILE TO WALLET | PERIOD: ${startDate} TO ${endDate}</p>
<hr>


<!-- ACCOUNT INFO -->
<div class="section">
  <strong>FROM</strong><br/>
  NAME: ${wallet.firstName} ${wallet.middleName || ""} ${wallet.lastName}<br/>
  EMAIL: ${wallet.email}<br/>
  ACC NO: ${wallet.accountNumber}<br/>
</div>

<div class="section">
  <strong>TO</strong><br/>
  EMAIL: ${wallet.email}<br/>
</div>

<!-- TABLE -->
<div class="section">
  <strong>TRANSACTION STATEMENT</strong>

  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Phone</th>
        <th>Amount (KES)</th>
        <th>Receipt</th>
        <th>Date</th>
        <th>Time</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
  ${
    formatted.length === 0
      ? `
        <tr>
          <td colspan="7" style="text-align:center; padding:10px;">
            No transactions found for selected period
          </td>
        </tr>
      `
      : formatted
          .map(
            (t) => `
        <tr>
          <td>${t.no}</td>
          <td>${t.phone}</td>
          <td>KES ${t.amount}</td>
          <td>${t.receipt}</td>
          <td>${t.date}</td>
          <td>${t.time}</td>
          <td>${t.status}</td>
        </tr>
      `
          )
          .join("")
  }
</tbody>
  </table>
</div>

<!-- FOOTER -->
<div class="section footer">
  Best Regards,<br/>
  FLOYNEX PAY<br/>
  &copy; 2026 FLOYNEX PAY
</div>

</body>
</html>
`;

  const tmpDir = path.join(__dirname, "../tmp");
await fs.ensureDir(tmpDir);

// Clean old temp folders
const tempFolders = await fs.readdir(tmpDir);
for (const folder of tempFolders) {
  try { await fs.remove(path.join(tmpDir, folder)); } catch (e) { console.log("Temp cleanup failed:", e.message); }
}


try {
  tempProfileDir = path.join(tmpDir, `puppeteer_${Date.now()}_${Math.floor(Math.random()*1000)}`);

const { getBrowser } = require("./browser");
const browser = await getBrowser();
const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "load" });
await page.evaluateHandle('document.fonts.ready');

  const pdfPath = path.join(__dirname, `statements_${wallet.accountNumber}_${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

  return pdfPath;
} finally {
  
  // Delete temp folder automatically
  if (tempProfileDir) {
  await fs.remove(tempProfileDir).catch(err =>
    console.log("Temp cleanup failed:", err)
  );
}
}
}
module.exports = {
  generateWithdrawalPDF,
  generateSendReceivedPDF,
  generateTransactionPDF
};
