//FLOYNEX PAY\backend\controllers\authController.js
const User = require("../models/User");
const Affiliate = require("../models/Affiliate");
const AffiliateReferral = require("../models/AffiliateReferral");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // add this line below jwt
const { sendAccountDeletionEmail, sendResetEmail, sendWelcomeEmail } = require("../serviceEmail"); // add this line below crypto
const { createAuditLog } = require("../services/auditLogService");

// REGISTER

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      servedBy,
      email,
      phone,
      businessName,
      county,
      town,
      area,
      
      password
    } = req.body;
//paymentType,
      //payline,
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      servedBy,
      email,
      phone,
      businessName,
      county,
      town,
      area,

      password: hashedPassword
    });
      //paymentType,
      //payline,
    await user.save();
if (servedBy && servedBy.trim()) {
  await AffiliateReferral.create({
    userId: user._id,
    promoCode: servedBy.trim(),
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    firstTimeSubscriptionStatus: "pending"
  });

  await Affiliate.findOneAndUpdate(
    { promoCode: servedBy.trim() },
    { userId: user._id }
  );
}

// Send welcome email (don’t break app if it fails)
try {
  await sendWelcomeEmail(user.email, user.firstName);
} catch (e) {
  console.error("Welcome email failed:", e.message);
}

res.json({ message: "Account created successfully" });


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...safeUser } = user._doc;
const sessionId = `session_${Date.now()}`;
// Temporarily save the sessionId to the user so we can retrieve it at logout
user.currentSessionId = sessionId; 
await user.save();

await createAuditLog({
  userId: user._id,
  action: "LOGIN",
  entityType: "auth",
  entityId: sessionId, // Use the shared ID
  ipAddress: req.ip,
  device: req.headers["user-agent"] || "unknown"
});

res.json({
  message: "Login successful",
  token,
  user: safeUser
});


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ===== FORGOT PASSWORD =====
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If the email exists, a reset link was sent." });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    await sendResetEmail(email, token);

    res.json({ message: "If the email exists, a reset link was sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== RESET PASSWORD =====
const resetPassword = async (req, res) => {
  try {
    // req.user is populated by your auth middleware (JWT/session)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
// RESET PASSWORD VIA EMAIL TOKEN
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token?.trim(),
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    const sessionId = user.currentSessionId || `session_${Date.now()}`;

    await createAuditLog({
      userId: req.user?.id,
      action: "LOGOUT",
      entityType: "auth",
      entityId: sessionId, // Use the SAME ID from login
      ipAddress: req.ip,
      device: req.headers["user-agent"] || "unknown"
    });

    // Clear the session ID
    user.currentSessionId = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. PHASE ONE: Verify initial password match and send 6-digit code
const initiateAccountDeletion = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password verification is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password. Verification failed." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.deletionToken = code;
    user.deletionTokenExpiry = Date.now() + 900000; 
    await user.save();

    await sendAccountDeletionEmail(user.email, user.firstName, code);

    res.json({ message: "Verification code has been successfully dispatched to your email address." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. PHASE TWO: Verify 6-digit email code to confirm ownership
const verifyDeletionCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Verification code is required." });
    }

    const user = await User.findOne({
      _id: req.user.id,
      deletionToken: code.trim(),
      deletionTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired security code." });
    }

    res.json({ message: "Identity successfully verified. You may now execute account closure." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. PHASE THREE: Permanent removal execution
const executeFinalDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const finalSessionId = user.currentSessionId || `deletion_${Date.now()}`;

    await createAuditLog({
      userId: user._id,
      action: "ACCOUNT_DELETED",
      entityType: "auth",
      entityId: finalSessionId,
      ipAddress: req.ip,
      device: req.headers["user-agent"] || "unknown"
    });

    await AffiliateReferral.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: "Account records successfully removed from our ecosystem." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordWithToken,
  logout,
  initiateAccountDeletion,
  verifyDeletionCode,
  executeFinalDeletion
};
