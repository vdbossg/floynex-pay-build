//backend\models\Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    job_id: { type: String, required: true, unique: true }, // e.g., JOB-2026-001
    title: { type: String, required: true },
    category: { type: String, required: true }, // e.g., Engineering & Technology
    location: { type: String, required: true, default: "Thika, Kenya" },
    employment_type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time"
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    description: { type: String },
    requirements: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);