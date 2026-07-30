//FLOYNEX PAY\backend\controllers\MpayStaffsAdmins.js
const staffService = require("../services/MpayStaffsAdmins");

// Create staff
const createStaff = async (req, res) => {
  try {
    const staff = await staffService.createStaff(req.body);
    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all staff
const getAllStaff = async (req, res) => {
  try {
    const staff = await staffService.getAllStaff();
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all staff (Protected)
const getAllStaffSecure = async (req, res) => {
  try {

    const staff = await staffService.getAllStaffSecure();

    res.status(200).json({
      success: true,
      staff
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// Update staff status
const updateStaffStatus = async (req, res) => {
  try {
    const { staffId, status, adminCorrection } = req.body;
    const updatedStaff = await staffService.updateStaffStatus(staffId, status, adminCorrection);
    res.status(200).json({ success: true, updatedStaff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// Login staff
const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Call your service to verify staff credentials
    const staff = await staffService.loginStaff(email, password);

    if (!staff) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

   // If using JWT token
    const token = staffService.generateToken(staff);
    
    res.status(200).json({ success: true, staff, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get current logged in staff
const getCurrentStaff = async (req, res) => {

  try {

    const staff = await staffService.getCurrentStaff(req.staff._id);

    res.status(200).json({
      success: true,
      staff
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};
const updateStaffAccess = async (req, res) => {

  try {

    const {
      staffId,
      role,
      pages_access
    } = req.body;

    const staff = await staffService.updateStaffAccess(
      staffId,
      role,
      pages_access
    );

    res.status(200).json({
      success: true,
      staff
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};
module.exports = {
  createStaff,
  getAllStaff,
  getAllStaffSecure,
  updateStaffStatus,
  updateStaffAccess,
  loginStaff,
  getCurrentStaff
};
