//backend\middleware\staffAuth.js
const jwt = require("jsonwebtoken");
const MpayStaff = require("../models/MpayStaffsAdmins");

module.exports = async (req, res, next) => {
  try {

    const token =
      req.header("Authorization")
        ?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "No token provided"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const staff = await MpayStaff.findById(decoded.id);

    if (!staff) {
      return res.status(401).json({
        error: "Staff not found"
      });
    }

    req.staff = {
  _id: staff._id,
  first_name: staff.first_name,
  last_name: staff.last_name,
  email: staff.email,
  role: staff.role,
  fullName: `${staff.first_name || ""} ${staff.last_name || ""}`.trim(),
  raw: staff
};

    next();

  } catch (err) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }
};
