//M-Safe\backend\models\modelsMSafeVault.js
const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema({
  totalBalance: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("MSafeVault", vaultSchema);
