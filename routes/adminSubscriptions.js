const express = require("express");
const router = express.Router();

const {
  getAllSubscriptions,
  getSubscriptionsByStatus
} = require("../controllers/adminSubscriptionController");

// 🔹 All subscriptions
router.get("/allSubscription", getAllSubscriptions);

// 🔹 Specific status routes
router.get("/pendingSubscription", (req, res) => {
  req.params.status = "pending";
  getSubscriptionsByStatus(req, res);
});

router.get("/activeSubscription", (req, res) => {
  req.params.status = "active";
  getSubscriptionsByStatus(req, res);
});

router.get("/inactiveSubscription", (req, res) => {
  req.params.status = "inactive";
  getSubscriptionsByStatus(req, res);
});

router.get("/failedSubscription", (req, res) => {
  req.params.status = "failed";
  getSubscriptionsByStatus(req, res);
});

module.exports = router;
