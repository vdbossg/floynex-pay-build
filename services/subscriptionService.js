//M-Safe\backend\services\subscriptionService.js
const Subscription = require("../models/Subscription");

const getAll = () => {
  return Subscription.find().sort({ createdAt: -1 });
};

const getByStatus = (status) => {
  return Subscription.find({ status }).sort({ createdAt: -1 });
};

module.exports = {
  getAll,
  getByStatus
};
