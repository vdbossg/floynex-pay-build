//FLOYNEX PAY\backend\routes\auth.js
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordWithToken,
  logout,
  initiateAccountDeletion, 
  verifyDeletionCode,      
  executeFinalDeletion     
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware"); // import your middleware

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password-email", resetPasswordWithToken);
// RESET PASSWORD (add middleware!)
router.post("/reset-password", authMiddleware, resetPassword);
router.post("/logout", authMiddleware, logout);

// Account Deletion Pipeline (Protected)
// Account Deletion Pipeline (Protected)
router.post("/delete-initiate", authMiddleware, initiateAccountDeletion || ((req, res) => res.status(500).json({error: "initiateAccountDeletion handler missing"})));
router.post("/delete-verify-code", authMiddleware, verifyDeletionCode || ((req, res) => res.status(500).json({error: "verifyDeletionCode handler missing"})));
router.post("/delete-execute", authMiddleware, executeFinalDeletion || ((req, res) => res.status(500).json({error: "executeFinalDeletion handler missing"})));

module.exports = router;