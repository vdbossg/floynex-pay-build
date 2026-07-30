// FLOYNEX PAY/backend/middleware/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Imported the User Model

module.exports = async function (req, res, next) { // ✅ Added async here
  const token = req.header("Authorization")?.replace("Bearer ", "") || req.header("Authorization");

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   // ✅ Fetch profile configuration settings out of the DB layer (including lastName)
    const userProfile = await User.findById(decoded.id).select("firstName lastName businessName");
    
    if (!userProfile) {
      return res.status(401).json({ error: "User profile not found." });
    }

    // Combine both names into a single clean string
    const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();

    req.user = {
      ...decoded,
      fullName: fullName,
      businessName: userProfile.businessName
    };

    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};
