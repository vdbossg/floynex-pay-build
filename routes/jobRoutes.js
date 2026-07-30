//backend\routes\jobRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitJobApplication,
  getOpenJobs,
  getHRApplications,
  updateApplicationStatus,
  createJobVacancy
} = require("../controllers/jobController");

// Payload parser for Base64 PDF attachments
const largeJsonParser = express.json({ limit: "15mb" });

// Candidate Endpoints
router.post("/new", largeJsonParser, submitJobApplication);
router.get("/open", getOpenJobs);

// HR / Admin Panel Endpoints
router.get("/applications", getHRApplications);
router.patch("/applications/:id/status", updateApplicationStatus);
router.post("/create-vacancy", createJobVacancy);

module.exports = router;