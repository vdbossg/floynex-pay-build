// C:\Users\LENOVO\Desktop\M-Safe\backend\models\Subscription.js
const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  userId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "User", 
  required: true,
  unique: true 
},
  name: String,
  email: String,
  amount: { type: Number, default: 10 },
  startDate: Date,
  endDate: Date,
  status: { 
    type: String, 
    enum: ["pending", "active", "inactive", "failed"], 
    default: "pending" 
  },
  mpesaTxId: String,
  mpesaReceipt: String,
  phone: String, // developer/receiver account (254710516022)
  subscriberPhone: String // NEW: store payer's phone separately
}, { timestamps: true });

module.exports = mongoose.model("Subscription", SubscriptionSchema);