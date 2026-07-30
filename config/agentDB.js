//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\config\agentDB.js
const mongoose = require("mongoose");
const agentDB = mongoose.createConnection(
process.env.AGENT_MONGO_URI
);
agentDB.on(
"connected",
()=>{
 console.log(
 "✅ FLOYNEX AGENT DB Connected"
 );
});

agentDB.on(
"error",
(err)=>{
 console.log(
 "❌ Agent DB Error",
 err
 );
});

module.exports=agentDB;