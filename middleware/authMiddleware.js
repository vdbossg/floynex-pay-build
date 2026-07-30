//FLOYNEX PAY\backend\middleware\authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Imported the User Model
const MpayStaff = require("../models/MpayStaffsAdmins");

module.exports = async (req, res, next) => { // ✅ Added async here
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch full user details from DB (including lastName)
    const userProfile = await User.findById(decoded.id).select("firstName lastName businessName");
    
       // If the user profile isn't in the standard User model, check the staff model before failing
    if (!userProfile) {
      const staffProfile = await MpayStaff.findById(decoded.id);

      if (!staffProfile) {
        return res.status(401).json({ error: "User profile not found" });
      }

      // Format names specifically for staff using staff schema properties
      const staffName = `${staffProfile.first_name || ""} ${staffProfile.last_name || ""} ${staffProfile.sir_name || ""}`.trim();

      req.user = {
        ...decoded,
        fullName: staffName,
        businessName: `M-Pay Admin (${staffProfile.role || "Staff"})`
      };

      return next(); // Exit cleanly out of the middleware for staff
    }


    // Combine both names into a single clean string
    const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();

    req.user = {
      ...decoded,
      fullName: fullName,
      businessName: userProfile.businessName
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
