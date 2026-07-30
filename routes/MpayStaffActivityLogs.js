const express = require("express");

const router = express.Router();

const controller = require("../controllers/MpayStaffActivityLogs");

const staffAuth = require("../middleware/staffAuth");

router.get(

    "/me",

    staffAuth,

    controller.getMyLogs

);

module.exports = router;