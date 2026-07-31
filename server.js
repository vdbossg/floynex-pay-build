//FLOYNEX PAY\backend\server.js
const express = require("express");
const cors = require("cors");
//require("dotenv").config();
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const path = require("path");

const connectDB = require("./config/db");
const myRecordsRoutes = require("./routes/myrecords");
const settingsRoutes = require("./routes/settingsUser");
// server.js
const profileRoutes = require("./routes/profileUser");
const subscriptionRoutes = require("./routes/subscription");
//const paymentCallbackRoutes = require("./routes/paymentCallback");
const affiliatesRoutes = require("./routes/routesAffiliates");
const walletRoutes = require("./routes/routesMSafewallet");
const transactionRoutes = require("./routes/transactionRoutes");
const withdrawRoutes = require("./routes/routesWithdraw"); // add this at the top with other requires
const mpayStaffsRoutes = require("./routes/MpayStaffsAdmins");
// Bank Vault routes
const bankVaultRoutes = require("./routes/routesBankVault");
const adminVaultRoutes = require("./routes/routesAdminVault");
// At the top with other requires
const auditLogRoutes = require("./routes/auditLogRoutes");
const withdrawUSDT = require("./routes/routesWithdrawUSDT");
const { processPendingWithdrawals } = require("./workers/withdrawRetryWorker");
const ledgerAuditLogsRoutes = require("./routes/routesledgerAuditLogs");
const commissionSettingsRoutes = require("./routes/routesCommissionSettings");
const mpayStaffActivityLogsRoutes = require("./routes/MpayStaffActivityLogs");
const staffHeartbeatRoutes = require("./routes/MpayStaffHeartbeat");
const {
  runAffiliateCommissionEngine
} = require("./services/affiliateCommissionEngine");
const affiliateMonthlySummaryRoutes =
require("./routes/routesAffiliateMonthlySummary");
const {
  closePreviousMonths
} = require("./services/affiliateMonthCloser");
const subLedgerRoutes =
require("./routes/subledger");
const withdrawAuditLogsRoutes = require(
  "./routes/routeswithdrawauditlogs"
);
const jobRoutes = require("./routes/jobRoutes");
const agentKycRoutes =
require("./routes/routesAgentKyc");
const approveAgentKycRoutes = require("./routes/routesApproveAgentKycs");
const agentAccRoutes = require("./routes/agentAccRoutes");


// 1️⃣ Initialize express app FIRST
const app = express();
app.set("trust proxy", true);
console.log("ENV CHECK:", {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? "YES" : "NO"
});
process.on("uncaughtException", (err) => {
  console.log("🔥 CRASH:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 PROMISE ERROR:", err);
});


// 3️⃣ Middleware
app.use(cors({
  origin: [
    "https://shopagent.floynexapp.com",
    "https://floynexapp.com",
    "https://api.msafeapp.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
// Serve static HTML, CSS, JS files from a 'public' folder

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use("/api/transactions", require("./routes/routesTransactionStatement"));

// 4️⃣ Serve profile photos
app.use("/uploads/profile", express.static(path.join(__dirname, "uploads/profile")));
app.use("/uploads/affiliates", express.static(path.join(__dirname, "uploads/affiliates")));
// Serve saved PDF job uploads statically
app.use("/assets/jobUploads", express.static(path.join(__dirname, "uploads/jobUploads")));
app.use("/assets/KYC/adminkyc", express.static(path.join(__dirname, "../assets/KYC/adminkyc")));
app.use("/api/MSafevault", require("./routes/routesMSafeVault"));
app.use("/api/transfer", require("./routes/routesMSafeTransfer"));
app.use("/api/admin", require("./routes/routesKycAdmin"));
app.use("/api/request", require("./routes/routesMSafeRequest"));
app.use("/api/mpaystaffs", mpayStaffsRoutes);
app.use("/api/inbox", require("./routes/routesInboxnoti"));
// 5️⃣ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/myrecords", myRecordsRoutes);
app.use("/api/user", settingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/support", require("./routes/routesMsafeSupport"));
app.use("/api/admin", require("./routes/routesMsafeallUsers"));
app.use("/api/admin", require("./routes/adminSubscriptions"));
app.use("/api/affiliates", affiliatesRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/mpesa", withdrawRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/vault", bankVaultRoutes);
app.use("/api/admin", adminVaultRoutes);
app.use("/api/auditlogs", auditLogRoutes);
app.use("/api/mpaystaff-activity", mpayStaffActivityLogsRoutes);
app.use("/api/mpaystaff-heartbeat", staffHeartbeatRoutes);
app.use(
  "/api/affiliate-monthly-summary",
  affiliateMonthlySummaryRoutes
);
app.use(
  "/api/commission-settings",
  commissionSettingsRoutes
);
app.use(
    "/api/subledger",
    subLedgerRoutes
);
app.use(
  "/api/withdrawauditlogs",
  withdrawAuditLogsRoutes
);
app.use(
  "/api/msafe/ledgerAuditLogs",
  ledgerAuditLogsRoutes
);
// 📞 MOUNT FLOYNEX IVR CALL CENTER ROUTE HERE:
app.use("/api/callcenter", require("./routes/callCenterRoutes"));

app.use("/api/jobs", jobRoutes); // ◄ MOUNT JOB ROUTES HERE
// After all other routes
app.use(
  "/api/admin-notifications",
  require("./routes/routesAdminNotifications")
);
app.use(
"/api/agent-kyc",
agentKycRoutes
);
app.use("/api/withdraw-usdt", withdrawUSDT);

app.use("/api/agentacc", agentAccRoutes);
app.use("/api/marketer", affiliatesRoutes);
app.use("/api/approve-agent-kyc", approveAgentKycRoutes);
//app.use("/api", paymentCallbackRoutes);
// ✅ Mount profile photo routes
app.use("/api/user", require("./routes/photoUser"));
app.use((err, req, res, next) => {
  console.log("🔥 ERROR:", err);

  res.status(500).json({
    error: err.message
  });
});
// Test route
app.get("/", (req, res) => {
  res.send("FLOYNEX PAY API running...");
});

// Timeout URL
app.post("/api/mpesa/timeout", (req, res) => {
  console.log("⏰ B2C TIMEOUT:", req.body);
  res.sendStatus(200);
});
// Start server
const startServer = async () => {
  console.log("🔥 SERVER STARTING...");

 connectDB()
  .then(async () => {

    console.log("✅ DB Connected");

    // Run once immediately after the database is connected
    await runAffiliateCommissionEngine();
    await closePreviousMonths();

  })
  .catch(err =>
    console.log("❌ DB Error:", err.message)
  );

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // SAFE WORKER (won’t crash server)
  setInterval(async () => {
    try {
      await processPendingWithdrawals();
    } catch (err) {
      console.log("Retry worker error:", err.message);
    }
  }, 2 * 60 * 1000);

// Affiliate Commission Engine
setInterval(async () => {

  try {

    await runAffiliateCommissionEngine();

  } catch (err) {

    console.log(
      "Affiliate engine error:",
      err.message
    );

  }

}, 60 * 1000);
// Close previous month's summaries once every day
setInterval(async () => {

  try {

    await closePreviousMonths();

  } catch (err) {

    console.log(
      "Month closer error:",
      err.message
    );

  }

}, 24 * 60 * 60 * 1000);
};
startServer();