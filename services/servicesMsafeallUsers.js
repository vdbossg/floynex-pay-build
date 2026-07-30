//M-Safe\backend\services\servicesMsafeallUsers.js
const User = require("../models/modelsMsafeallUsers");

const getAllUsers = async () => {
  try {
    const users = await User.find()
      .select("-password -__v") // ❌ remove sensitive fields
      .sort({ createdAt: -1 }); // newest first

    return users;

  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  getAllUsers
};
