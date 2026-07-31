const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

// Transporter using agent-specific credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST_AGENT || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT_AGENT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER_AGENT,
    pass: process.env.EMAIL_PASS_AGENT
  }
});

/**
 * 1. Sends initial setup link for setting 4-digit PIN and Password
 */
async function sendAgentActivationEmail({
  email,
  firstName,
  agentCode,
  agentShopNumber,
  token
}) {
  const baseUrl = process.env.FRONTEND_URL || "https://msafeapp.com";
  const activationLink = `${baseUrl}/agent-setup.html?token=${token}`;

  const mailOptions = {
    from: `"FLOYNEX AGENT SERVICES" <${process.env.EMAIL_USER_AGENT}>`,
    to: email,
    subject: "Action Required: Complete Your FLOYNEX Agent Account Setup 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
          
          <div style="text-align:center;">
            <img src="${baseUrl}/assets/emaillogo.png" 
                 alt="FLOYNEX PAY Logo" 
                 style="width:130px; margin-bottom:15px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center; margin-bottom:20px;">
            Agent Account Approved 🎉
          </h2>

          <p style="font-size:15px; color:#333;">
            Hello <strong>${firstName || "Agent"}</strong>,
          </p>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            Congratulations! Your FLOYNEX Agent KYC application has been approved. Your store identifiers have been provisioned as follows:
          </p>

          <div style="background:#f0fdf4; border-left:4px solid #2e7d32; padding:15px; margin:20px 0; border-radius:4px;">
            <p style="margin:5px 0; font-size:14px;"><strong>Agent Code:</strong> ${agentCode}</p>
            <p style="margin:5px 0; font-size:14px;"><strong>Shop Number (ASN):</strong> ${agentShopNumber}</p>
          </div>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            To start operating your store and accepting customer transactions, click the button below to set up your <strong>4-digit PIN</strong> and secure <strong>password</strong>:
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${activationLink}" 
               style="display:inline-block; padding:14px 28px; background:#2e7d32; color:#ffffff; 
                      text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
              Set PIN & Password
            </a>
          </div>

          <p style="font-size:13px; color:#777; text-align:center;">
            This security activation link expires in 24 hours.
          </p>

          <hr style="margin:25px 0; border:none; border-top:1px solid #e0e0e0;" />

          <p style="font-size:13px; color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX Agent Operations Team</strong><br/>
            <em>Stay safe. Never share your PIN or password with anyone.</em>
          </p>

        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Helper: Generates a PDF buffer containing Agent Account Credentials
 */
function createAgentProfilePDF(agentDetails) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc
        .rect(0, 0, 612, 80)
        .fill("#2e7d32");

      doc
        .fillColor("#FFFFFF")
        .fontSize(20)
        .text("FLOYNEX PAY - AGENT PROFILE SUMMARY", 40, 30, { align: "left" });

      // Body Section
      doc.moveDown(3);
      doc.fillColor("#333333").fontSize(12);

      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor("#2e7d32").text("Personal Information", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor("#333333");
      doc.text(`Full Name: ${agentDetails.firstName} ${agentDetails.lastName} ${agentDetails.surname || ""}`);
      doc.text(`National ID / Passport: ${agentDetails.idNumber}`);
      doc.text(`Email Address: ${agentDetails.email}`);
      doc.text(`Phone Number: ${agentDetails.phone}`);

      doc.moveDown(1);
      doc.fontSize(14).fillColor("#2e7d32").text("Agent Account & Wallet Identifiers", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor("#333333");
      doc.text(`Agent Code: ${agentDetails.agentCode}`);
      doc.text(`Shop Number (ASN): ${agentDetails.agentShopNumber}`);
      doc.text(`Agent Wallet Account Number: ${agentDetails.agentAccountNumber}`);
      doc.text(`Currency: ${agentDetails.currency || "KES"}`);

      doc.moveDown(1);
      doc.fontSize(14).fillColor("#2e7d32").text("Security & Usage Guidelines", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#555555");
      doc.text("1. Always keep your 4-digit PIN confidential during deposits and cash-outs.");
      doc.text("2. Ensure customer withdrawals match both your Agent Code AND Shop Number (ASN).");
      doc.text("3. Login Credentials: Email and Password created during activation.");

      doc.moveDown(2);
      doc.fontSize(9).fillColor("#888888").text("This is an official computer-generated document from FLOYNEX PAY.", {
        align: "center"
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 2. Sends post-activation welcome email with full credentials details & PDF attachment
 */
async function sendAgentWelcomeCredentialsEmail(agentDetails) {
  const baseUrl = process.env.FRONTEND_URL || "https://msafeapp.com";
  const pdfBuffer = await createAgentProfilePDF(agentDetails);

  const mailOptions = {
    from: `"FLOYNEX AGENT SERVICES" <${process.env.EMAIL_USER_AGENT}>`,
    to: agentDetails.email,
    subject: "Welcome to FLOYNEX Agent Network - Account Credentials & PDF Record 📄",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
          
          <div style="text-align:center;">
            <img src="${baseUrl}/assets/emaillogo.png" 
                 alt="FLOYNEX PAY Logo" 
                 style="width:130px; margin-bottom:15px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center; margin-bottom:20px;">
            Your Agent Account is Active! 🟢
          </h2>

          <p style="font-size:15px; color:#333;">
            Hello <strong>${agentDetails.firstName}</strong>,
          </p>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            Your FLOYNEX Agent credentials have been configured successfully. Below are your official account details and store identifiers:
          </p>

          <table style="width:100%; border-collapse:collapse; margin:20px 0; background:#f9f9f9; font-size:14px;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px; font-weight:bold; color:#333;">Agent Code:</td>
              <td style="padding:10px; color:#2e7d32; font-weight:bold;">${agentDetails.agentCode}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px; font-weight:bold; color:#333;">Agent Shop Number (ASN):</td>
              <td style="padding:10px; color:#2e7d32; font-weight:bold;">${agentDetails.agentShopNumber}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px; font-weight:bold; color:#333;">Wallet Account Number:</td>
              <td style="padding:10px; color:#333;">${agentDetails.agentAccountNumber}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px; font-weight:bold; color:#333;">Login Email:</td>
              <td style="padding:10px; color:#333;">${agentDetails.email}</td>
            </tr>
          </table>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            📎 <strong>Attached Document:</strong> We have attached a official PDF summary containing your account details for your store records.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${baseUrl}/agent-login.html" 
               style="display:inline-block; padding:14px 28px; background:#2e7d32; color:#ffffff; 
                      text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
              Login to Agent Portal
            </a>
          </div>

          <hr style="margin:25px 0; border:none; border-top:1px solid #e0e0e0;" />

          <p style="font-size:13px; color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX Agent Operations Team</strong>
          </p>

        </div>
      </div>
    `,
    attachments: [
      {
        filename: `FLOYNEX_Agent_Profile_${agentDetails.agentCode}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendAgentActivationEmail,
  sendAgentWelcomeCredentialsEmail
};