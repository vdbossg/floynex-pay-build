const AdminNotification = require("../models/modelsAdminNotifications");

const {
  createNotification
} = require("../services/servicesAdminNotifications");


// ================= POST =================
exports.sendNotification = async (req, res) => {

  try {

    const notification = await createNotification(req.body);

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

};


// ================= GET ALL =================
exports.getNotifications = async (req, res) => {

  try {

    const notifications = await AdminNotification
      .find()
      .sort({ createdAt: -1 });

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