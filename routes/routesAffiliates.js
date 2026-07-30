const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
// IMPORT YOUR STAFF MIDDLEWARE HERE 
// (Update this path to point to where your staff token verification middleware is located)
const staffAuth = require("../middleware/staffAuth"); 

const {
  registerAffiliate,
  getAllAffiliates,
  getMyAffiliate,
  adminGetAffiliates,
  adminUpdateAffiliateStatus,
  verifyMarketer // <-- Add this exact line here!
} = require("../controllers/controllersAffiliates");

// ================= CLOUDINARY & MULTER CONFIGURATION =================
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "affiliates",
    public_id: (req, file) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
      return `kyc-${unique}`;
    }
  }
});

const upload = multer({ storage });

// ================= ROUTES =================

// POST → Register affiliate (Public Onboarding)
router.post(
  "/register",
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 }
  ]),
  registerAffiliate
);

// GET → Public listing / debugging 
router.get("/all", getAllAffiliates);

// GET → Public verification endpoint via QR Code / Promo Code
router.get("/promo/:promoCode", verifyMarketer);

// GET → Protected Affiliate dashboard profile details (Uses client user auth)
router.get("/me", auth, getMyAffiliate);

// ================= ADMIN MANAGEMENT PORTAL PATHS =================

// GET → Admin management filtering route (Swapped from auth to staffAuth)
router.get("/admin", staffAuth, adminGetAffiliates);

// PATCH → Admin action execution route (Swapped from auth to staffAuth)
router.patch("/admin/status/:id", staffAuth, adminUpdateAffiliateStatus);

module.exports = router;
