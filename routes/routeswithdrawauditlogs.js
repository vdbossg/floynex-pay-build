// backend/routes/routeswithdrawauditlogs.js

const express = require("express");
const router = express.Router();

const {
  getAllWithdrawals,
  searchByPhone,
  searchByUserId,
  searchByWalletAccount,
  searchByMpesaTransaction,
  searchByDateRange
} = require(
  "../controllers/controllerswithdrawauditlogs"
);

// GET ALL
router.get("/", getAllWithdrawals);

// PHONE
router.get("/phone/:phone", searchByPhone);

// USER ID
router.get("/user/:userId", searchByUserId);

// WALLET ACCOUNT
router.get(
  "/wallet/:walletAccountNumber",
  searchByWalletAccount
);

// MPESA TRANSACTION
router.get(
  "/mpesa/:mpesaTransactionId",
  searchByMpesaTransaction
);

// DATE RANGE
router.get("/date-range", searchByDateRange);

module.exports = router;