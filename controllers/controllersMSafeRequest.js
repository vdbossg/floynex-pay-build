//controllers\controllersMSafeRequest.js
const {
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require("../services/servicesMSafeRequest");


// CREATE REQUEST
exports.create = async (req, res) => {
  try {
    const {
  accountNumber,
  amount,
  identityType
} = req.body;

    const data = await createRequest(
  req.user.id,
  accountNumber,
  Number(amount),
  identityType
);

    res.json({ status: "success", data });

  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};


// GET PENDING (for popup)
exports.pending = async (req, res) => {
  try {
    const data = await getPendingRequests(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// APPROVE
exports.approve = async (req, res) => {
  try {
    const { requestId, pin } = req.body;

    const data = await approveRequest(
      req.user.id,
      requestId,
      pin
    );

    res.json({ status: "success", data });

  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};


// REJECT
exports.reject = async (req, res) => {
  try {
    const { requestId } = req.body;

    const data = await rejectRequest(req.user.id, requestId);

    res.json({ status: "success", data });

  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};
// GET REQUEST STATUS (for waiting spinner)

exports.status = async (req, res) => {
  try {
    const Request = require("../models/modelsMSafeRequest");

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: "error",
        message: "Request not found"
      });
    }

    res.json({
      status: "success",
      data: request
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
};
