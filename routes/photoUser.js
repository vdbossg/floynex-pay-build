const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "floynex_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req, file) => `user_${req.user.id}` 
  },
});

const upload = multer({ storage: storage });

// UPLOAD / UPDATE PHOTO
router.put("/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Save the Cloudinary URL (req.file.path) to the database
    user.profilePhoto = req.file.path; 
    await user.save();

    res.json({ message: "Profile photo updated successfully", photo: user.profilePhoto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// REMOVE PHOTO
router.delete("/photo", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profilePhoto = "default-avatar.png";
    await user.save();

    res.json({ message: "Profile photo removed", photo: user.profilePhoto });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
