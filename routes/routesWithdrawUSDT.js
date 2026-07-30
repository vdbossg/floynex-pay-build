//M-Safe\backend\routes\routesWithdrawUSDT.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  withdrawUSDT
} = require("../controllers/controllerWithdrawUSDT");

router.post("/withdraw", auth, withdrawUSDT);

module.exports = router;