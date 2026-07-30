//M-Safe\backend\controllers\controllersMsafeallUsers.js
const { getAllUsers } = require("../services/servicesMsafeallUsers");

const fetchAllUsers = async (req, res) => {
  try {

    const users = await getAllUsers();

    res.json({
      success: true,
      total: users.length,
      data: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  fetchAllUsers
};
