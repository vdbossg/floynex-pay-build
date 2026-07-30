const AgentKyc =
require("../models/modelsAgentKyc");



// GET ALL KYC

exports.getAllAgentKyc =
async(req,res)=>{

try{


const applications =
await AgentKyc.find()
.sort({
createdAt:-1
});


res.json({

success:true,

count:
applications.length,

applications

});


}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

};





// UPDATE STATUS

exports.updateAgentKycStatus =
async(req,res)=>{

try{


const {
id,
status,
rejectionReason,
reviewerNote
}=req.body;



const updated =
await AgentKyc.findByIdAndUpdate(

id,

{

status,

rejectionReason,

reviewerNote,

reviewedAt:new Date(),

reviewedBy:{

adminId:req.staff._id,

adminName:
req.staff.first_name+" "+req.staff.last_name

}

},

{
new:true
}

);



res.json({

success:true,

application:updated

});


}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}


};