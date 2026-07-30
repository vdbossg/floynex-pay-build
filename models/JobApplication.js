//models\JobApplication.js
const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    ticket_id: { type: String, required: true, unique: true }, // e.g., TKT-JOB-2026-0089
    internal_reference_number: { type: String, required: true, unique: true }, // e.g., FDT-HR-APP-2026-0089
    job_id: { type: String, required: true },
    job_title: { type: String, required: true },
    category: { type: String },
    location: { type: String },
    employment_type: { type: String },
    
    // Candidate Basics
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    surname: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    // Document Attachments
    attachments: {
      filled_application_form_pdf: { type: String, required: true },
      cv_resume: { type: String, required: true },
      other_documents: [{ type: String }],
      national_id_copy: { type: String },
      academic_certificates: { type: String },
      kra_pin: { type: String }
    },

    // HR Pipeline Management
    status: {
      type: String,
      enum: ["Received / Under HR Review", "Shortlisted", "Interview Scheduled", "On Hold", "Rejected", "Hired"],
      default: "Received / Under HR Review"
    },
    hr_notes: { type: String, default: "" },
    assigned_hr: { type: String, default: "Unassigned" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);