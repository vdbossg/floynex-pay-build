const Subscription = require("../models/Subscription");

// Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error("Error fetching all subscriptions:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get subscriptions by status
const getSubscriptionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatuses = ["pending", "active", "inactive", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const subs = await Subscription.find({ status }).sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error(`Error fetching ${req.params.status} subscriptions:`, err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionsByStatus
};
