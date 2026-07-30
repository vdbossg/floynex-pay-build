//FLOYNEX PAY\backend\controllers\controllersMSafewallet.js
const bcrypt = require("bcryptjs");
const MSafeWallet = require("../models/modelsMSafewallet");
const { generateAccountNumber } = require("../services/servicesMSafewallet");
const { sendOtpEmail } = require("../serviceEmail");
const { sendPinChangedEmail } = require("../serviceEmail");
// CREATE WALLET
// CREATE WALLET
exports.createWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      firstName,
      middleName,
      lastName,
      idNumber,
      phone,
      email,
      pin,
      confirmPin,
      documentType
    } = req.body;

    // 🔴 Validate basic fields
    if (!firstName || !lastName || !idNumber || !phone || !pin) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔐 Confirm PIN (only if provided)
    if (confirmPin && pin !== confirmPin) {
      return res.status(400).json({ error: "PINs do not match" });
    }

    // 📂 Handle uploaded files (optional for now)
    const documentFront = req.files?.documentFront
  ? `/assets/KYC/${req.files.documentFront[0].filename}`
  : null;

const documentBack = req.files?.documentBack
  ? `/assets/KYC/${req.files.documentBack[0].filename}`
  : null;


    // 🔴 Check if user already owns a wallet or if the credentials are already in use
    const existing = await MSafeWallet.findOne({
      $or: [
        { user: userId },
        { idNumber: idNumber.trim() },
        { phone: phone.trim() },
        ...(email ? [{ email: email.toLowerCase().trim() }] : [])
      ]
    });

    if (existing) {
      if (existing.user.toString() === userId.toString()) {
        return res.status(400).json({ error: "Wallet already exists for this account." });
      }
      return res.status(400).json({ 
        error: "Email, phone number or national document already used, contact customer care" 
      });
    }

    // 🔐 Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // 🔢 Generate account number
    const accountNumber = await generateAccountNumber();

    // 💾 Create wallet
    const wallet = await MSafeWallet.create({
      user: userId,
      accountNumber,
      firstName,
      middleName,
      lastName,
      idNumber,
      phone,
      email,
      pin: hashedPin,

      // 🆕 New fields (optional for now)
      documentType: documentType || "id",
      documentFront,
      documentBack
    });

    res.json({
      message: "Wallet created successfully",
      wallet: {
        accountNumber: wallet.accountNumber,
        balance: wallet.balance,
        kycStatus: wallet.kycStatus
      }
    });

  } catch (err) {
    console.log("Wallet Error:", err);
    res.status(500).json({ error: "Failed to create wallet" });
  }
};


// GET MY WALLET
exports.getMyWallet = async (req, res) => {
  try {
    const wallet = await MSafeWallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({
  accountNumber: wallet.accountNumber,
  balance: wallet.balance,
  currency: wallet.currency,
paymentIdentity: wallet.paymentIdentity,
  firstName: wallet.firstName,
  middleName: wallet.middleName,
  lastName: wallet.lastName,
  phone: wallet.phone,
  email: wallet.email,

  kycStatus: wallet.kycStatus,
  isVerified: wallet.isVerified,
  documentType: wallet.documentType,

  status: wallet.status,
  createdAt: wallet.createdAt
});


  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
};
exports.changePin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPin, newPin, confirmPin } = req.body;

    if (!oldPin || !newPin || !confirmPin) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({ error: "New PINs do not match" });
    }

    const wallet = await MSafeWallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.status === "frozen") {
      return res.status(403).json({ error: "Account is frozen" });
    }

    const isMatch = await bcrypt.compare(oldPin, wallet.pin);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect old PIN" });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    wallet.pin = hashedPin;
    await wallet.save();

    res.json({ message: "PIN changed successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to change PIN" });
  }
};


exports.requestPinChangeOtp = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;

    const wallet = await MSafeWallet.findOne({ user: req.user.id });

    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    // verify old pin
    const isMatch = await bcrypt.compare(oldPin, wallet.pin);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid PIN" });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    wallet.otp = await bcrypt.hash(otp, 10);
    wallet.otpExpires = Date.now() + 5 * 60 * 1000;

    // ✅ STORE NEW PIN TEMPORARILY
    wallet.pendingPin = await bcrypt.hash(newPin, 10);

    await wallet.save();

    await sendOtpEmail(wallet.email, wallet.firstName, otp);

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};



exports.confirmPinChange = async (req, res) => {
  try {
    const { otp } = req.body;

    const wallet = await MSafeWallet.findOne({ user: req.user.id });

    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    if (!wallet.otp || wallet.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const validOtp = await bcrypt.compare(otp, wallet.otp);
    if (!validOtp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // ✅ use stored pin
    wallet.pin = wallet.pendingPin;

    wallet.otp = null;
    wallet.otpExpires = null;
    wallet.pendingPin = null;

    await wallet.save();

    await sendPinChangedEmail(wallet.email, wallet.firstName);

    res.json({ message: "PIN changed successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to change PIN" });
  }
};
exports.updatePaymentIdentity = async (req, res) => {
  try {
    const { paymentIdentity } = req.body;

    if (!["personal", "business"].includes(paymentIdentity)) {
      return res.status(400).json({
        error: "Invalid account type"
      });
    }

    const wallet = await MSafeWallet.findOne({
      user: req.user.id
    });

    if (!wallet) {
      return res.status(404).json({
        error: "Wallet not found"
      });
    }

    wallet.paymentIdentity = paymentIdentity;

    await wallet.save();

    res.json({
      message: "Account type updated successfully",
      paymentIdentity: wallet.paymentIdentity
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to update account type"
    });
  }
};
