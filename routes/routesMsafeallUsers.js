const express = require("express");
const router = express.Router();

const {
  fetchAllUsers
} = require("../controllers/controllersMsafeallUsers");

// GET → all users
router.get("/users", fetchAllUsers);

module.exports = router;
