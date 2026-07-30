// backend/controllers/settingsController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// GET USER PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PROFILE INFO
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Check if email is taken by another user
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user.id)
      return res.status(400).json({ error: "Email already in use" });

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email, phone },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE BUSINESS INFO
const updateBusiness = async (req, res) => {
  try {
    const { businessName, country, county, town, area, paymentType, payline } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { businessName, country, county, town, area, paymentType, payline },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Business info updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile, updateBusiness, changePassword };