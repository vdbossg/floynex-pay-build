// backend/routes/profileUser.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const path = require("path");
// GET logged-in user's profile
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -__v -paymentType -payline"
    ); // exclude sensitive info
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// =======================
// GET PROFILE PHOTO
// =======================
router.get("/photo/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads/profile", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).json({ error: "File not found" });
    }
  });
});
module.exports = router;
