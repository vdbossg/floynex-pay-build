//FLOYNEX PAY\backend\models\MpayStaffsAdmins.js
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  sir_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phones: [{ type: String, required: true }],
  country: { type: String, required: true },
  county: { type: String, required: true },
  city: { type: String, required: true },
  area: { type: String, required: true },
  role: { type: String, required: true },
  pages_access: {
  type: [String],
  default: []
},
  mpaySafeAcc: { type: String, required: true },
  id_type: { type: String, required: true },
  id_number: { type: String, required: true },
  id_documents: [
    {
      side: { type: String, enum: ["front", "back"], required: true },
      url: { type: String, required: true }
    }
  ],
  other_documents: [
    {
      type: { type: String },
      url: { type: String }
    }
  ],
  password: { type: String, required: true },
  status: { type: String, enum: ["inactive", "active", "frozen", "rejected"], default: "inactive" },
  created_by: { type: String },
  unique_code: { type: String, unique: true },
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  activity_logs: [
    {
      action: String,
      timestamp: { type: Date, default: Date.now },
      admin_correction: String
    }
  ]
});

module.exports = mongoose.model("MpayStaff", staffSchema);
