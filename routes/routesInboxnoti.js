//M-Safe\backend\routes\routesInboxnoti.js
const express = require("express");
const router = express.Router();

const {
  getMyInbox,
  markThreadAsRead,
  getUnreadCount
} = require("../controllers/controllersInboxnoti");

const authMiddleware = require("../middleware/authMiddleware");

// USER INBOX
router.get("/my", authMiddleware, getMyInbox);

// MARK THREAD AS READ
router.put("/read/:sender", authMiddleware, markThreadAsRead);

// UNREAD COUNT
router.get("/inbox/unread-count", authMiddleware, getUnreadCount);

module.exports = router;
