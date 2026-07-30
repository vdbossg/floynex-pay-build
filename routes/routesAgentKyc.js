const express=require("express");

const router=
express.Router();


const controller=
require("../controllers/ControllerAgentKyc");


const staffAuth=
require("../middleware/staffAuth");



// GET KYC

router.get(
"/",
staffAuth,
controller.getAllAgentKyc
);



// VERIFY / REJECT

router.post(
"/update",
staffAuth,
controller.updateAgentKycStatus
);



module.exports=router;