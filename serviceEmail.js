//FLOYNEX PAY\backend\serviceEmail.js
const nodemailer = require("nodemailer");
const BASE_URL = process.env.BASE_URL;
const {
  generateWithdrawalPDF,
  generateSendReceivedPDF,
  generateTransactionPDF
} = require("./servicePDF");
// Configure your email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendResetEmail(to, token) {
  //const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
  const resetLink = `https://msafeapp.com/reset-password.html?token=${token}`;

  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your FLOYNEX PAY Password",

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; text-align:center;">

          <img src="https://msafeapp.com/logo.png" 
     alt="FLOYNEX PAY Logo" 
     style="margin-bottom:20px; width:120px;" />


         <h2 style="color:#2e7d32;">Hello 👋</h2>


          <p>We received a request to reset your <strong>FLOYNEX PAY</strong> password.</p>

          <a href="${resetLink}" 
   style="display:inline-block; margin:20px 0; padding:12px 25px; 
          background:#2e7d32; color:#fff; 
          text-decoration:none; border-radius:6px; font-weight:bold;">
  Reset My Password
</a>


          <p style="font-size:13px; color:#777;">
            This link expires in 1 hour.
          </p>

          <p style="font-size:13px; color:#777;">
            If you didn’t request this, ignore this email.
          </p>
<hr style="margin:25px 0;" />

        <p style="margin-top:20px; text-align:left; color:#555;">
  Best regards,<br/>
  <strong>FLOYNEX PAY Team</strong><br/><br/>
  Stay safe.
</p>



        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
async function sendWelcomeEmail(to, name) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to FLOYNEX PAY 🎉",

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

          <div style="text-align:center;">
            <img src="https://ffa6-102-213-48-202.ngrok-free.app/assets/emaillogo.png" 
                 alt="FLOYNEX PAY Logo" 
                 style="width:120px; margin-bottom:20px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center;">Welcome to FLOYNEX PAY 🎉</h2>

          <p>Hello <strong>${name || "there"}</strong> 👋</p>


          <p>
            Your account has been successfully created.
          </p>

          <p>
            <strong>FLOYNEX PAY</strong> helps you take full control of your business payments:
          </p>

          <div style="text-align:left; margin:15px 0; color:#333; line-height:1.6;">
  <p>✔ Request payments directly via M-Pesa</p>
  <p>✔ Ensure customers FLOYNEX PAYthe exact amount</p>
  <p>✔ Reduce fraud and payment reversals</p>
  <p>✔ Automatically keep all transaction records</p>
</div>


          <p>
            You are now ready to manage your payments securely and efficiently.
          </p>

          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL}/login.html"
               style="display:inline-block; margin:20px 0; padding:12px 25px; 
                      background:#2e7d32; color:#fff; 
                      text-decoration:none; border-radius:6px;">
              Login Now
            </a>
          </div>

          <hr style="margin:25px 0;" />

          <p style="margin-top:20px; text-align:left; color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX PAY Team</strong><br/><br/>
            Stay safe.
          </p>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
function formatText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

async function sendSupportReplyEmail(to, name, ticketId, userMessage, reply) {
  const mailOptions = {
    from: `"FLOYNEX PAY Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reply to your ticket (${ticketId})`,

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

          <div style="text-align:center;">
            <img src="https://msafeapp.com/logo.png" 
                 style="width:120px; margin-bottom:20px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center;">
            FLOYNEX PAY Support Response
          </h2>

          <p>Hello <strong>${name || "Customer"}</strong> 👋</p>

          <p>We have responded to your request:</p>

         <div style="background:#f1f1f1; padding:12px; border-radius:8px; margin-bottom:10px;">
  <b>Your Message:</b><br/>
  ${formatText(userMessage)}
</div>

<div style="background:#e8f5e9; padding:12px; border-radius:8px;">
  <b>Support Response:</b><br/>
  ${formatText(reply)}
</div>


          <p style="margin-top:15px;">
            Ticket ID: <b>${ticketId}</b>
          </p>

          <hr style="margin:25px 0;" />

          <p style="color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX PAY Team</strong>
          </p>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
async function sendKycApprovedEmail(to, name) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "KYC Verified Successfully ✅",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

    <div style="text-align:center;">
      <img src="https://msafeapp.com/logo.png" 
           style="width:120px; margin-bottom:20px;" />
    </div>

    <h2 style="color:#2e7d32; text-align:center;">KYC Verified Successfully ✅</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>Your identity verification has been successfully completed.</p>

    <p>You now have full access to all wallet features.</p>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/login.html"
         style="display:inline-block; margin:20px 0; padding:12px 25px; 
                background:#2e7d32; color:#fff; text-decoration:none; border-radius:6px;">
        Login to Your Account
      </a>
    </div>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      Best regards,<br/>
      <strong>FLOYNEX PAY Team</strong>
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendKycRejectedEmail(to, name, reason) {
  const safeReason = reason || "Your submitted documents did not meet our verification requirements.";

  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "KYC Verification Failed ❌",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

    <div style="text-align:center;">
      <img src="https://msafeapp.com/logo.png" style="width:120px;" />
    </div>

    <h2 style="color:#c62828; text-align:center;">KYC Rejected ❌</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>We regret to inform you that your KYC verification was not successful.</p>

    <div style="background:#fdecea; padding:12px; border-radius:8px; margin:15px 0;">
      <strong>Reason:</strong><br/>
      ${formatText(safeReason)}
    </div>

    <p>Please review your documents and submit again.</p>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      Best regards,<br/>
      <strong>FLOYNEX PAY Team</strong>
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendWalletFrozenEmail(to, name, reason) {
  const safeReason = reason || "Your account has been temporarily restricted for security reasons.";

  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Account Frozen ⚠️",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

    <div style="text-align:center;">
      <img src="https://msafeapp.com/logo.png" style="width:120px;" />
    </div>

    <h2 style="color:#ef6c00; text-align:center;">Account Frozen ⚠️</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>Your account has been temporarily restricted.</p>

    <div style="background:#fff3e0; padding:12px; border-radius:8px; margin:15px 0;">
      <strong>Reason:</strong><br/>
      ${formatText(safeReason)}
    </div>

    <p>Please contact support if you need assistance.</p>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      Best regards,<br/>
      <strong>FLOYNEX PAY Team</strong>
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendWalletActivatedEmail(to, name) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Account Activated 🟢",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

    <div style="text-align:center;">
      <img src="https://msafeapp.com/logo.png" style="width:120px;" />
    </div>

    <h2 style="color:#2e7d32; text-align:center;">Account Activated 🟢</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>Your account has been successfully reactivated.</p>

    <p>You can now continue using all services normally.</p>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      Best regards,<br/>
      <strong>FLOYNEX PAY Team</strong>
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendOtpEmail(to, name, otp) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code 🔐",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; text-align:center;">

    <img src="https://msafeapp.com/logo.png" 
         style="width:120px; margin-bottom:20px;" />

    <h2 style="color:#2e7d32;">Security Verification 🔐</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>Use the OTP below to complete your request:</p>

    <h1 style="letter-spacing:4px; color:#2e7d32;">${otp}</h1>

    <p style="font-size:13px; color:#777;">
      This code expires in 5 minutes.
    </p>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      If you did not request this, ignore this email.
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendPinChangedEmail(to, name) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "PIN Changed Successfully ✅",

    html: `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; text-align:center;">

    <img src="https://msafeapp.com/logo.png" style="width:120px;" />

    <h2 style="color:#2e7d32;">PIN Updated Successfully ✅</h2>

    <p>Hello <strong>${name || "Customer"}</strong>,</p>

    <p>Your wallet PIN has been changed successfully.</p>

    <p style="color:#c62828;">
      If you did NOT perform this action, contact support immediately.
    </p>

    <hr style="margin:25px 0;" />

    <p style="color:#555;">
      FLOYNEX PAY Team
    </p>

  </div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}

async function sendTestStatementEmail(to, name, startDate, endDate) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: `FLOYNEX PAY Withdrawal Statement Preview (${startDate} - ${endDate})`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

          <div style="text-align:center; margin-bottom:20px;">
            <img src="https://msafeapp.com/logo.png" alt="FLOYNEX PAY Logo" style="width:120px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center;">Withdrawal Statement Preview</h2>

          <p>Dear <strong>${name || "Customer"}</strong>,</p>

          <p>We are sending this test email to confirm that statement emails are delivered successfully.</p>

          <p><strong>Statement Period:</strong> ${startDate} to ${endDate}</p>

          <p>Once verified, the actual PDF statement will be attached in future emails.</p>

          <p style="margin-top:20px;">
            Thank you for using <strong>FLOYNEX PAY</strong> to manage your payments securely.
          </p>

          <hr style="margin:25px 0;" />

          <p style="color:#555; font-size:14px;">
            Best regards,<br/>
            <strong>FLOYNEX PAY Team</strong><br/>
            <em>Secure. Reliable. Transparent.</em>
          </p>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
async function sendWithdrawalStatementEmail(to, wallet, withdrawals, startDate, endDate) {
  // 1. Generate PDF
  const pdfPath = await generateWithdrawalPDF(wallet, withdrawals, startDate, endDate);

  const fullName = `${wallet.firstName} ${wallet.middleName} ${wallet.lastName}`;

  // 2. Email with attachment
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: `FLOYNEX PAY Withdrawal Statement (${startDate} - ${endDate})`,

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

          <div style="text-align:center; margin-bottom:20px;">
            <img src="https://msafeapp.com/logo.png" style="width:120px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center;">
            Withdrawal Statement
          </h2>

          <p>Dear <strong>${fullName}</strong>,</p>

          <p>
            Please find attached your <strong>FLOYNEX PAY withdrawal statement</strong>.
          </p>

          <p>
            <strong>Period:</strong> ${startDate} to ${endDate}
          </p>

          <p>
            If you did not request this statement, please contact support immediately.
          </p>

          <hr style="margin:25px 0;" />

          <p style="color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX PAY Team</strong><br/>
            <em>Secure. Reliable. Transparent.</em>
          </p>

        </div>
      </div>
    `,

    attachments: [
      {
        filename: `FLOYNEX PAY-Statement-${startDate}-to-${endDate}.pdf`,
        path: pdfPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);

  // 3. (Optional but recommended) delete file after sending
  const fs = require("fs");
  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
}

async function sendSendReceivedStatementEmail(to, wallet, transactions, startDate, endDate) {
  const fullName = `${wallet.firstName} ${wallet.middleName} ${wallet.lastName}`;

  // 1️⃣ Generate the PDF
  const pdfPath = await generateSendReceivedPDF(wallet, transactions, startDate, endDate);

  // 2️⃣ HTML body for email
  const htmlContent = `
  console.log("Transactions passed to PDF:");
console.log(transactions);

console.log("Formatted transactions:");
console.log(formatted);
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://msafeapp.com/logo.png" alt="FLOYNEX PAY Logo" style="width:120px;" />
        </div>

        <h2 style="color:#2e7d32; text-align:center;">Sent/Received Statement</h2>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Please find attached your <strong>FLOYNEX PAY Send/Received statement</strong> for the period <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p>

        <p>If you did not request this, please contact support immediately.</p>

        <hr style="margin:25px 0;" />
        <p style="color:#555; font-size:14px;">
          Best regards,<br/>
          <strong>FLOYNEX PAY Team</strong><br/>
          <em>Secure. Reliable. Transparent.</em>
        </p>
      </div>
    </div>
  `;

  // 3️⃣ Send email with PDF attachment
  await transporter.sendMail({
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: `FLOYNEX PAY Sent/Received Statement (${startDate} - ${endDate})`,
    html: htmlContent,
    attachments: [
      {
        filename: `FLOYNEX PAY-SR-Statement-${startDate}-to-${endDate}.pdf`,
        path: pdfPath
      }
    ]
  });

  // 4️⃣ Delete temp PDF after sending
  const fs = require("fs");
  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
}

async function sendStatementRequestEmail(to, wallet, startDate, endDate, transactions) {
  const fullName = `${wallet.firstName} ${wallet.middleName} ${wallet.lastName}`;

  // ✅ ONLY ONE PDF TYPE (TRANSACTION)
  const safeTransactions = Array.isArray(transactions)
  ? transactions
  : [];

const pdfPath = await generateTransactionPDF(
  wallet,
  safeTransactions,
  startDate,
  endDate
);
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Statement Request Received Successfully ✅",

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; text-align:center;">

          <img src="https://msafeapp.com/logo.png" style="width:120px; margin-bottom:20px;" />

          <h2 style="color:#2e7d32;">Request Statement ✅</h2>

          <p>Dear <strong>${fullName}</strong>,</p>

          <p>
            Your <strong>Transaction Statement</strong> request has been received successfully.
          </p>

          <p>
            <strong>Period:</strong> ${startDate} to ${endDate}
          </p>

          <p>
            Your PDF statement is attached below.
          </p>

          <hr style="margin:25px 0;" />

          <p style="color:#555;">
            Best regards,<br/>
            <strong>FLOYNEX PAY Team</strong>
          </p>

        </div>
      </div>
    `,

    attachments: [
      {
        filename: `FLOYNEX PAY-Transaction-Statement-${startDate}-to-${endDate}.pdf`,
        path: pdfPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);

  // cleanup
  const fs = require("fs");
  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
}
async function sendAffiliateRegistrationEmail(to, fullName, promoCode) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Affiliate Registration Received 🎉",

    html: `
<div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
<div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">

<div style="text-align:center;">
<img src="https://msafeapp.com/logo.png"
style="width:120px;margin-bottom:20px;">
</div>

<h2 style="color:#2e7d32;text-align:center;">
Welcome to FLOYNEX PAY Affiliate Program
</h2>

<p>Hello <strong>${fullName}</strong>,</p>

<p>
Your affiliate application has been received successfully.
</p>

<p>Your application is currently under review.</p>

<div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;">

<p><strong>Email</strong><br>${to}</p>

<p><strong>Promo Code</strong><br>${promoCode}</p>

<p><strong>Status</strong><br>
<span style="color:#ef6c00;font-weight:bold;">
Pending Approval
</span>
</p>

</div>

<p>
Once your application has been reviewed, you'll receive another email informing you whether it has been approved.
</p>

<hr>

<p>
Best regards,<br>
<strong>FLOYNEX PAY Team</strong>
</p>

</div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}
async function sendAffiliateApprovedEmail(to, fullName, promoCode) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Affiliate Account Has Been Approved ✅",

    html: `
<div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
<div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">

<div style="text-align:center;">
<img src="https://msafeapp.com/logo.png"
style="width:120px;margin-bottom:20px;">
</div>

<h2 style="color:#2e7d32;text-align:center;">
Congratulations! 🎉
</h2>

<p>Hello <strong>${fullName}</strong>,</p>

<p>
Your FLOYNEX PAY Affiliate application has been approved.
</p>

<p>
Your affiliate account is now active and you can begin referring customers immediately.
</p>

<div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;">

<p><strong>Email</strong><br>${to}</p>

<p><strong>Promo Code</strong><br>${promoCode}</p>

<p><strong>Status</strong><br>
<span style="color:#2e7d32;font-weight:bold;">
Approved & Active
</span>
</p>

</div>

<p>
Share your promo code with new customers. Once they subscribe using your code, you'll begin earning commissions automatically.
</p>

<hr>

<p>
Best regards,<br>
<strong>FLOYNEX PAY Team</strong>
</p>

</div>
</div>
`
  };

  await transporter.sendMail(mailOptions);
}


// Security Deletion Template Integration
async function sendAccountDeletionEmail(to, name, code) {
  const mailOptions = {
    from: `"FLOYNEX PAY" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Security Alert: Account Deletion Code ⚠️",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px; text-align:center;">
          <img src="https://msafeapp.com/logo.png" style="width:120px; margin-bottom:20px;" />
          <h2 style="color:#c62828;">Account Deletion Request ⚠️</h2>
          <p>Hello <strong>${name || "Customer"}</strong>,</p>
          <p>We received a request to permanently delete your FLOYNEX PAY account. Use the secure confirmation code below to proceed:</p>
          <h1 style="letter-spacing:6px; color:#c62828; background:#fbe9e7; padding:15px; display:inline-block; border-radius:6px; font-size:32px;">${code}</h1>
          <p style="font-size:13px; color:#777; margin-top:15px;">This security code expires in 15 minutes.</p>
          <hr style="margin:25px 0;" />
          <p style="color:#555; font-size:13px;"><strong>If you did not request this action, please change your account password immediately.</strong></p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
}
async function sendJobApplicationConfirmationEmail(to, name, ticketId, jobTitle, referenceNumber) {
  const mailOptions = {
    from: `"FLOYNEX PAY Careers" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Job Application Received - ${jobTitle} (${ticketId})`,

    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">

          <div style="text-align:center;">
            <img src="https://msafeapp.com/logo.png" 
                 alt="FLOYNEX PAY Logo" 
                 style="width:120px; margin-bottom:20px;" />
          </div>

          <h2 style="color:#2e7d32; text-align:center;">
            Job Application Received 🎉
          </h2>

          <p>Hello <strong>${name || "Applicant"}</strong> 👋,</p>

          <p>
            Thank you for applying for the position of <strong>${jobTitle}</strong> at <strong>Floynex Digital Technologies Ltd</strong>[cite: 1].
          </p>

          <p>
            We have successfully received your application documents and signed application form[cite: 1]. Your application ticket has been created and assigned to our Talent Acquisition Department[cite: 1].
          </p>

          <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin:20px 0;">
            <p style="margin:5px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
            <p style="margin:5px 0;"><strong>Internal Ref:</strong> ${referenceNumber}</p>
            <p style="margin:5px 0;"><strong>Position:</strong> ${jobTitle}</p>
            <p style="margin:5px 0;"><strong>Status:</strong> <span style="color:#ef6c00; font-weight:bold;">Under HR Review</span></p>
          </div>

          <p>
            Our HR team will review your qualifications and contact you if your profile matches the role requirements[cite: 1].
          </p>

          <hr style="margin:25px 0;" />

          <p style="color:#555;">
            Best regards,<br/>
            <strong>Floynex Talent Acquisition Team</strong><br/>
            <em>Floynex Digital Technologies Ltd</em>[cite: 1]
          </p>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
module.exports = {
  sendResetEmail,
  sendWelcomeEmail,
  sendSupportReplyEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendWalletFrozenEmail,
  sendWalletActivatedEmail,
  sendOtpEmail,
  sendPinChangedEmail,
  sendTestStatementEmail,
  sendWithdrawalStatementEmail,
  sendSendReceivedStatementEmail,
  sendStatementRequestEmail,
  sendAffiliateRegistrationEmail,
  sendJobApplicationConfirmationEmail,
  sendAccountDeletionEmail
};