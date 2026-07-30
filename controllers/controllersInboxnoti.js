//M-Safe\backend\controllers\controllersInboxnoti.js
const { getUserInbox } = require("../services/servicesInboxnoti");
const AdminNotification = require("../models/modelsAdminNotifications");

exports.getMyInbox = async (req, res) => {
  try {

    const user = req.user; // from auth middleware

    const notifications = await getUserInbox(user);

    res.json({
      success: true,
      total: notifications.length,
      data: notifications
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};


exports.markThreadAsRead = async (req, res) => {

  try {

    const sender = req.params.sender;

    const mongoose = require("mongoose");

const userId = new mongoose.Types.ObjectId(
  req.user.id || req.user._id
);

    await AdminNotification.updateMany(
      {
        userId,
        servedBy: sender,
        receiverStatus: "unread"
      },
      {
        $set: {
          receiverStatus: "read",
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

};
exports.getUnreadCount = async (req, res) => {
  try {
    const AdminNotification = require("../models/modelsAdminNotifications");

    const mongoose = require("mongoose");

    const userId = new mongoose.Types.ObjectId(
      req.user.id || req.user._id
    );

    const unread = await AdminNotification.countDocuments({
      userId,
      receiverStatus: "unread"
    });

    res.json({
      success: true,
      unread
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
