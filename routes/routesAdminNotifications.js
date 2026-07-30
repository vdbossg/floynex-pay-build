const express = require("express");

const router = express.Router();

const {
  sendNotification,
  getNotifications
} = require("../controllers/controllersAdminNotifications");


// POST
router.post(
  "/send",
  sendNotification
);


// GET
router.get(
  "/all",
  getNotifications
);

module.exports = router;
