//backend\routes\routesMSafewallet.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // 🆕 ADD THIS

const {
  createWallet,
  getMyWallet,
  changePin,
  requestPinChangeOtp,
  confirmPinChange,
  updatePaymentIdentity
} = require("../controllers/controllersMSafewallet");

router.post("/change-pin", auth, changePin);
// CREATE WALLET (NOW SUPPORTS FILES BUT DOESN’T REQUIRE THEM YET)
router.post(
  "/create",
  auth,
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 }
  ]),
  createWallet
);
router.post("/request-pin-otp", auth, requestPinChangeOtp);
router.post("/confirm-pin-change", auth, confirmPinChange);

// UPDATE ACCOUNT TYPE
router.put("/payment-identity", auth, updatePaymentIdentity);

// GET MY WALLET
router.get("/me", auth, getMyWallet);

module.exports = router;
