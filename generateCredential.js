const fs = require("fs");
const crypto = require("crypto");

function generateCredential(password) {
  const pubKey = fs.readFileSync("./certs/sandbox-cert.cer"); // correct path
  const buffer = Buffer.from(password, "utf8");
  const encrypted = crypto.publicEncrypt(
    { key: pubKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    buffer
  );
  return encrypted.toString("base64");
}

// Dynamically assign to env variable
process.env.MPESA_B2C_SECURITY_CREDENTIAL = generateCredential("Safaricom123!");

// Optional: log to verify
console.log("Generated Security Credential:", process.env.MPESA_B2C_SECURITY_CREDENTIAL);
