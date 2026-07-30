///controllers/jobController.js
const fs = require("fs");
const path = require("path");
const JobApplication = require("../models/JobApplication");
const Job = require("../models/Job");

// Safe import for email service to prevent crash if file naming differs across environments
let sendJobApplicationConfirmationEmail;
try {
  const emailService = require("../serviceEmail");
  sendJobApplicationConfirmationEmail = emailService.sendJobApplicationConfirmationEmail;
} catch (err) {
  console.log("⚠️ Email Service Module Load Warning:", err.message);
  sendJobApplicationConfirmationEmail = async () => {}; // Fallback no-op function
}

// Helper to generate padded sequential references
const generateRefNumbers = async () => {
  const count = await JobApplication.countDocuments();
  const sequence = String(count + 1).padStart(4, "0");
  const ticket_id = `TKT-JOB-2026-${sequence}`;
  const internal_reference_number = `FDT-HR-APP-2026-${sequence}`;
  return { ticket_id, internal_reference_number };
};

// Helper: Converts Base64 to physical file on host disk preserving exact file extension
const saveBase64File = (base64String, subFolder, filePrefix) => {
  if (!base64String || typeof base64String !== "string") return null;

  // Extract MIME type and Base64 raw string
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : "";
  const base64Data = matches ? matches[2] : base64String;

  // Determine exact extension based on uploaded document MIME type
  let ext = "pdf"; // Default fallback
  if (mimeType.includes("png")) ext = "png";
  else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
  else if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) ext = "docx";
  else if (mimeType.includes("msword") || mimeType.includes("doc")) ext = "doc";

  // Target directory: FLOYNEX PAY/backend/uploads/jobUploads/<subFolder>
  const targetDir = path.join(__dirname, "../uploads/jobUploads", subFolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // File saved with unique filename + real extension
  const filename = `${filePrefix}_${Date.now()}.${ext}`;
  const filePath = path.join(targetDir, filename);

  // Write binary data to disk
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

  // Return full static public URL path saved to database
  return `/assets/jobUploads/${subFolder}/${filename}`;
};

// 1️⃣ PUBLIC POST: Candidate Submits Application (POST /api/jobs/new)
exports.submitJobApplication = async (req, res) => {
  try {
    const {
      job_id,
      job_title,
      category,
      location,
      employment_type,
      first_name,
      last_name,
      surname,
      phone,
      email,
      attachments
    } = req.body;

    // Validation
    if (!job_id || !first_name || !last_name || !surname || !phone || !email) {
      return res.status(400).json({ status: "error", message: "Missing required candidate details." });
    }

    if (!attachments || (!attachments.filled_application_form_pdf && !attachments.cv_resume)) {
      return res.status(400).json({ status: "error", message: "Filled PDF application form and CV are required." });
    }

    const { ticket_id, internal_reference_number } = await generateRefNumbers();

    // Process & write base64 strings into physical PDF files on disk
    const processedAttachments = {};

    if (attachments.filled_application_form_pdf) {
      processedAttachments.filled_application_form_pdf = saveBase64File(
        attachments.filled_application_form_pdf,
        "jobapplicationpdf",
        `${ticket_id}_app`
      );
    }

    if (attachments.cv_resume) {
      processedAttachments.cv_resume = saveBase64File(
        attachments.cv_resume,
        "jobcvpdf",
        `${ticket_id}_cv`
      );
    }

   // Additional Documents Array (from multiple file picker)
    if (attachments.other_documents) {
      const docsArray = Array.isArray(attachments.other_documents)
        ? attachments.other_documents
        : [attachments.other_documents];

      processedAttachments.other_documents = docsArray
        .map((docBase64, idx) =>
          saveBase64File(
            docBase64,
            "jobotherpdf",
            `${ticket_id}_other_${idx + 1}`
          )
        )
        .filter(Boolean);
    }

    // Specific Individual Document Attachments (if provided)
    if (attachments.national_id_copy) {
      processedAttachments.national_id_copy = saveBase64File(
        attachments.national_id_copy,
        "jobotherpdf",
        `${ticket_id}_id`
      );
    }

    if (attachments.academic_certificates) {
      processedAttachments.academic_certificates = saveBase64File(
        attachments.academic_certificates,
        "jobotherpdf",
        `${ticket_id}_certs`
      );
    }

    if (attachments.kra_pin) {
      processedAttachments.kra_pin = saveBase64File(
        attachments.kra_pin,
        "jobotherpdf",
        `${ticket_id}_kra`
      );
    }

    const application = new JobApplication({
      ticket_id,
      internal_reference_number,
      job_id,
      job_title,
      category,
      location,
      employment_type,
      first_name,
      last_name,
      surname,
      phone,
      email,
      attachments: processedAttachments
    });

    await application.save();

    // Send instant confirmation email to candidate
    try {
      if (typeof sendJobApplicationConfirmationEmail === "function") {
        const fullName = `${first_name} ${surname} ${last_name}`;
        await sendJobApplicationConfirmationEmail(
          email,
          fullName,
          ticket_id,
          job_title,
          internal_reference_number
        );
      }
    } catch (emailErr) {
      console.log("⚠️ Confirmation Email Error:", emailErr.message);
    }

    return res.status(201).json({
      status: "success",
      code: 201,
      message: "Application submitted successfully.",
      data: {
        ticket_id,
        internal_reference_number,
        candidate_name: `${first_name} ${surname} ${last_name}`,
        job_id,
        job_title,
        status: application.status,
        submitted_at: application.createdAt
      }
    });
  } catch (error) {
    console.error("🔥 Error submitting job application:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 2️⃣ PUBLIC GET: List Open Vacancies for job.html (GET /api/jobs/open)
exports.getOpenJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });
    return res.status(200).json({ status: "success", count: jobs.length, data: jobs });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 3️⃣ ADMIN/HR GET: View Applications in HR Panel (GET /api/jobs/applications)
exports.getHRApplications = async (req, res) => {
  try {
    const { status, category, search, job_id } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (job_id) filter.job_id = job_id;
    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { ticket_id: { $regex: search, $options: "i" } },
        { internal_reference_number: { $regex: search, $options: "i" } }
      ];
    }

    const applications = await JobApplication.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      status: "success",
      count: applications.length,
      data: applications
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 4️⃣ ADMIN/HR PATCH: Update Candidate HR Status (PATCH /api/jobs/applications/:id/status)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hr_notes, assigned_hr } = req.body;

    const allowedStatuses = [
      "Received / Under HR Review",
      "Shortlisted",
      "Interview Scheduled",
      "On Hold",
      "Rejected",
      "Hired"
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status option. Allowed: ${allowedStatuses.join(", ")}`
      });
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ status: "error", message: "Application not found" });
    }

    if (status) application.status = status;
    if (hr_notes !== undefined) application.hr_notes = hr_notes;
    if (assigned_hr !== undefined) application.assigned_hr = assigned_hr;

    await application.save();

    return res.status(200).json({
      status: "success",
      message: "Candidate status updated successfully.",
      data: application
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 5️⃣ ADMIN/HR POST: HR Creates New Job Vacancy (POST /api/jobs/create-vacancy)
exports.createJobVacancy = async (req, res) => {
  try {
    const { job_id, title, category, location, employment_type, description, requirements } = req.body;
    
    const existing = await Job.findOne({ job_id });
    if (existing) {
      return res.status(400).json({ status: "error", message: "Job ID already exists." });
    }

    const job = new Job({ job_id, title, category, location, employment_type, description, requirements });
    await job.save();

    return res.status(201).json({ status: "success", message: "Job vacancy published.", data: job });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};