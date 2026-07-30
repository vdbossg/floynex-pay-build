//M-Safe\backend\services\servicesInboxnoti.js
const AdminNotification = require("../models/modelsAdminNotifications");

const getUserInbox = async (user) => {

  const userId = user.id || user._id;

  return await AdminNotification.find({
    userId: userId
  }).sort({ createdAt: -1 });

};

module.exports = {
  getUserInbox
};
