const User = require("../models/User");
const AdminNotification = require("../models/modelsAdminNotifications");

const createNotification = async (data) => {

  try {

    // Find user by email
    const user = await User.findOne({
      email: data.to
    });

    // Save notification
    const notification = await AdminNotification.create({

      title: data.title,

      subject: data.subject,

      message: data.message,

      servedBy: data.servedBy,

      to: data.to,

      userId: user ? user._id : null,

      targetType: data.targetType || "individual",

      type: data.type || "normal",

      sentStatus: "sent",

      receiverStatus: "unread"

    });

    return notification;

  } catch (error) {

    throw error;

  }

};

module.exports = {
  createNotification
};