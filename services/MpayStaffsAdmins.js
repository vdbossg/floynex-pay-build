//FLOYNEX PAY\backend\services\MpayStaffsAdmins.js
const MpayStaff = require("../models/MpayStaffsAdmins");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { logActivity } = require("./MpayStaffActivityLogs");

// Generate unique staff code
const generateUniqueCode = () => {
  return "UCX" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

// Create staff
const createStaff = async (staffData) => {

  // ✅ Generate unique code
  staffData.unique_code = generateUniqueCode();

  // 🔥 FIX: Convert JSON strings to arrays
  try {
    if (typeof staffData.id_documents === "string") {
      staffData.id_documents = JSON.parse(staffData.id_documents);
    }

    if (typeof staffData.other_documents === "string") {
      staffData.other_documents = JSON.parse(staffData.other_documents);
    }
  } catch (err) {
    throw new Error("Invalid document format");
  }

  // ✅ Remove empty documents
  staffData.other_documents = (staffData.other_documents || []).filter(
    doc => doc.url && doc.url !== "/assets/KYC/adminkyc/"
  );

  // ✅ Validate ID docs
  if (!Array.isArray(staffData.id_documents) || staffData.id_documents.length < 2) {
    throw new Error("ID front and back required");
  }

  // 🔐 Hash password
const salt = await bcrypt.genSalt(10);
staffData.password = await bcrypt.hash(staffData.password, salt);

// ✅ Default page access
staffData.pages_access = [];

// ✅ Save to DB
const staff = new MpayStaff(staffData);
return await staff.save();
};

// Get all staff
const getAllStaff = async () => {
  return await MpayStaff.find().sort({ created_at: -1 });
};
// Get all staff (Protected)
const getAllStaffSecure = async () => {

  return await MpayStaff.find(
    {},
    {
      password: 0,
      __v: 0
    }
  ).sort({ created_at: -1 });

};
// Update staff status (approve/reject/freeze/activate)
const updateStaffStatus = async (staffId, status, adminCorrection) => {
  const staff = await MpayStaff.findById(staffId);
  if (!staff) throw new Error("Staff not found");

  staff.status = status;
  if (adminCorrection) {
    staff.activity_logs.push({ action: `Status updated to ${status}`, admin_correction: adminCorrection });
  } else {
    staff.activity_logs.push({ action: `Status updated to ${status}` });
  }
  staff.last_updated = Date.now();
  return await staff.save();
};
// ================= LOGIN STAFF =================
const loginStaff = async (email, password) => {

  const staff = await MpayStaff.findOne({ email });

  if (!staff) return null;

  // Compare hashed password
  const validPassword = await bcrypt.compare(password, staff.password);

  if (!validPassword) return null;

  // Log successful login
  await logActivity({

    staffId: staff._id,

    action: "LOGIN",

    description: "Staff logged into the system."

  });

  return staff;

};
const jwt = require("jsonwebtoken");

const generateToken = (staff) => {
  return jwt.sign({ id: staff._id, email: staff.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
// Update role and pages access
const updateStaffAccess = async (staffId, role, pages_access) => {

  const staff = await MpayStaff.findById(staffId);

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (role) {
    staff.role = role;
  }

  if (Array.isArray(pages_access)) {
    staff.pages_access = pages_access;
  }

  staff.last_updated = Date.now();

  staff.activity_logs.push({
    action: "Updated role and page access"
  });

  return await staff.save();

};
// Get current logged in staff
const getCurrentStaff = async (staffId) => {

  const staff = await MpayStaff.findById(
    staffId,
    {
      password: 0,
      __v: 0
    }
  );

  if (!staff) {
    throw new Error("Staff not found");
  }

  return staff;

};
module.exports = {
  createStaff,
  getAllStaff,
  getAllStaffSecure,
  updateStaffStatus,
  updateStaffAccess,
  loginStaff,
  getCurrentStaff,
  generateToken
};
