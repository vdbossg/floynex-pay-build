//C:\Users\LENOVO\Desktop\FLOYNEXBUILD\backend\services\agentGeneratorService.js
const AgentAccount = require("../models/AgentAccount");

/**
 * Generates unique MSF account number, Agent Code (AGT-XXXXXX), and Shop Number (ASNXXXXXXX)
 */
exports.generateAgentIdentifiers = async () => {
  let isUnique = false;
  let agentAccountNumber = "";
  let agentCode = "";
  let agentShopNumber = "";

  while (!isUnique) {
    // 1. MSF Account Number: MSF + 8 random digits
    const msfDigits = Math.floor(10000000 + Math.random() * 90000000);
    agentAccountNumber = `MSF${msfDigits}`;

    // 2. Agent Code: AGT- + 6 random digits
    const agtDigits = Math.floor(100000 + Math.random() * 900000);
    agentCode = `AGT-${agtDigits}`;

    // 3. Agent Shop Number: Sequential ASN counter
    const count = await AgentAccount.countDocuments();
    const nextSeq = (count + 1).toString().padStart(7, "0");
    agentShopNumber = `ASN${nextSeq}`;

    // Check collisions
    const existing = await AgentAccount.findOne({
      $or: [{ agentAccountNumber }, { agentCode }, { agentShopNumber }]
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return { agentAccountNumber, agentCode, agentShopNumber };
};