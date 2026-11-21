const crypto = require("crypto");
const path = require("path");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
// dotenv reads .env from the *working directory* by default, and
// `npm run server` runs from the project root - so backend/.env (the SMTP and
// Firebase Admin settings) was never loaded. Load it by path first, then a
// root .env as a fallback (dotenv never overrides a value already set).
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const { auth: adminAuth, firestore } = require("./config/firebase");
const { sendSms, isSmsConfigured } = require("./config/sms");

const app = express();
app.use(cors());
app.use(express.json());

// Videos of older reports, uploaded to this dev server before videos moved
// into Firestore (see utils/videoStore.ts), are still served from here.
const UPLOAD_ROOT = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOAD_ROOT));

// In-memory store for password reset codes:
// "email:<address>" | "phone:<+63...>" -> { uid, code, expiresAt, verified, attempts }
const resetCodes = new Map();
// When a code was last requested for each email / mobile number.
const resetRequestTimes = new Map();
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

// Agency email mappings - each agency has a dedicated admin email
const AGENCY_EMAILS = {
  PNP: "philippinenationalpolice@gmail.com",
  BFP: "bureauoffireprotection@admin.com",
  LDRRMC: "ldrrmc@admin.com",
  REDCROSS: "philippineredcross@admin.com",
  Barangay: "barangay@admin.com",
};

// Email transporter configuration
// For production, use real SMTP credentials in .env file
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

// Endpoint to send incident notification to agency
app.post("/api/notify-agency", async (req, res) => {
  try {
    const { agency, incidentData } = req.body;

    if (!agency || !incidentData) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const agencyEmail = AGENCY_EMAILS[agency];
    if (!agencyEmail) {
      return res
        .status(400)
        .json({ success: false, error: `Unknown agency: ${agency}` });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@hazardapp.com",
      to: agencyEmail,
      subject: `[HAZARD ALERT] New Incident Report - ${agency}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background-color: #dc2626; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">🚨 NEW INCIDENT REPORT</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">A new incident has been reported requiring <strong>${agency}</strong> response.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 120px;">Agency:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${agency}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Incident:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${incidentData.category || "Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Injury Level:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${incidentData.injuryLevel || "Not specified"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Location:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${incidentData.location || "Not provided"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Reported by:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${incidentData.userEmail || "Anonymous"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Status:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${incidentData.status || "Pending"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #555;">Incident ID:</td>
                <td style="padding: 10px; color: #333; font-family: monospace;">${incidentData.id}</td>
              </tr>
            </table>

            ${
              incidentData.coordinates
                ? `
            <div style="margin-top: 16px; padding: 12px; background-color: #f0f8ff; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; color: #333;">
                <strong>📍 Coordinates:</strong> ${incidentData.coordinates.latitude}, ${incidentData.coordinates.longitude}
              </p>
            </div>
            `
                : ""
            }

            <div style="margin-top: 24px; padding: 16px; background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Action Required:</strong> Please respond to this incident immediately. 
                Log in to the Hazard Management System to view full details and update the incident status.
              </p>
            </div>

            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.APP_URL || "http://localhost:8081"}/admin/incidents/${incidentData.id}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007AFF; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Incident Details
              </a>
            </div>
          </div>

          <div style="padding: 16px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
            <p>This is an automated notification from the Hazard Incident Management System.</p>
            <p>© ${new Date().getFullYear()} Hazard App - All Rights Reserved</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Notification sent to ${agency} (${agencyEmail})`,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    // Even if email fails, don't block the incident submission
    res.json({
      success: false,
      error: error.message,
      message: "Failed to send email notification, but incident was saved",
    });
  }
});

// Reset codes are keyed by "email:<address>" or "phone:<+639XXXXXXXXX>", so a
// request can use either the account's email or its mobile number.
function resetTargetFromBody(body = {}) {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (phone) {
    // Same +63 format the signup and profile screens save.
    if (!/^\+639\d{9}$/.test(phone)) {
      return { error: "Enter a valid Philippine mobile number" };
    }
    return { key: `phone:${phone}`, phone };
  }
  if (email) return { key: `email:${email}`, email };
  return { error: "Email or mobile number is required" };
}

// The uid of the account the email / mobile number belongs to, or null.
async function findResetUid(target) {
  if (target.email) {
    try {
      return (await adminAuth.getUserByEmail(target.email)).uid;
    } catch (err) {
      if (err.code === "auth/user-not-found") return null;
      throw err;
    }
  }
  const snap = await firestore
    .collection("users")
    .where("phoneNumber", "==", target.phone)
    .limit(2)
    .get();
  if (snap.size > 1) {
    // Can't tell which account to reset, so reset none of them.
    console.warn(
      `Password reset skipped: ${target.phone} is on more than one account.`,
    );
    return null;
  }
  return snap.empty ? null : snap.docs[0].id;
}

// Step 1: send a 6-digit password reset code to the user's email or mobile
app.post("/api/auth/forgot-password/send-code", async (req, res) => {
  try {
    const target = resetTargetFromBody(req.body);
    if (target.error) {
      return res.status(400).json({ success: false, error: target.error });
    }

    if (target.phone && !isSmsConfigured()) {
      return res.status(503).json({
        success: false,
        error:
          "SMS delivery is not configured on the server. Please contact support.",
      });
    }

    if (!adminAuth) {
      console.error(
        "Firebase Admin Auth is not initialized (missing service account credentials).",
      );
      return res
        .status(500)
        .json({ success: false, error: "Server auth is not configured" });
    }

    // Checked before looking the account up, so the answer is the same
    // whether or not it exists. Also keeps SMS costs down.
    const lastRequest = resetRequestTimes.get(target.key);
    if (lastRequest && Date.now() - lastRequest < RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        error: "Please wait a minute before requesting another code",
      });
    }
    resetRequestTimes.set(target.key, Date.now());

    const genericReply = {
      success: true,
      message: target.phone
        ? "If an account uses this mobile number, a code has been sent."
        : "If an account exists for this email, a code has been sent.",
    };

    const uid = await findResetUid(target);
    // Don't reveal whether the account exists.
    if (!uid) return res.json(genericReply);

    const code = crypto.randomInt(100000, 1000000).toString();
    if (target.phone) {
      await sendSms(
        target.phone,
        `Your Hazard App password reset code is ${code}. It expires in 10 minutes. Don't share it with anyone.`,
      );
    } else if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // With no SMTP account set, print the code so the flow can still be tested.
      console.warn(
        `[email] SMTP_USER / SMTP_PASS not set in backend/.env - would have sent reset code ${code} to ${target.email}`,
      );
    } else {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@hazardapp.com",
        to: target.email,
        subject: "Your Hazard App password reset code",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Reset your password</h2>
          <p style="color: #555; font-size: 15px;">Use the code below to reset your Hazard App password. It expires in 10 minutes.</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #007AFF;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      });
    }

    resetCodes.set(target.key, {
      uid,
      code,
      expiresAt: Date.now() + RESET_CODE_TTL_MS,
      verified: false,
      attempts: 0,
    });
    res.json(genericReply);
  } catch (error) {
    console.error("Error sending reset code:", error);
    if (error.code === "EAUTH") {
      console.error(
        "SMTP login was rejected - set a real SMTP_USER and SMTP_PASS (for Gmail, an App Password) in backend/.env.",
      );
    }
    res
      .status(500)
      .json({ success: false, error: "Failed to send reset code" });
  }
});

// Step 2: verify the 6-digit code
app.post("/api/auth/forgot-password/verify-code", async (req, res) => {
  const target = resetTargetFromBody(req.body);
  const { code } = req.body;
  if (target.error || !code) {
    return res.status(400).json({
      success: false,
      error: "Email or mobile number, and code are required",
    });
  }

  const entry = resetCodes.get(target.key);
  if (!entry) {
    return res.status(400).json({
      success: false,
      error: "No reset code was requested for this account",
    });
  }
  if (Date.now() > entry.expiresAt) {
    resetCodes.delete(target.key);
    return res.status(400).json({
      success: false,
      error: "Code has expired, please request a new one",
    });
  }
  if (entry.attempts >= MAX_CODE_ATTEMPTS) {
    resetCodes.delete(target.key);
    return res.status(400).json({
      success: false,
      error: "Too many attempts, please request a new code",
    });
  }

  entry.attempts += 1;
  if (entry.code !== code) {
    return res.status(400).json({ success: false, error: "Invalid code" });
  }

  entry.verified = true;
  res.json({ success: true });
});

// Step 3: set the new password once the code has been verified
app.post("/api/auth/forgot-password/reset", async (req, res) => {
  try {
    const target = resetTargetFromBody(req.body);
    const { code, newPassword } = req.body;
    if (target.error || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email or mobile number, code and new password are required",
      });
    }
    // Same rules as the app's Create Account screen, enforced here too since
    // this endpoint can be called directly.
    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number",
      });
    }

    const entry = resetCodes.get(target.key);
    if (!entry || entry.code !== code || !entry.verified) {
      return res.status(400).json({
        success: false,
        error: "Code must be verified before resetting the password",
      });
    }
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(target.key);
      return res.status(400).json({
        success: false,
        error: "Code has expired, please request a new one",
      });
    }

    if (!adminAuth) {
      return res
        .status(500)
        .json({ success: false, error: "Server auth is not configured" });
    }

    await adminAuth.updateUser(entry.uid, { password: newPassword });

    resetCodes.delete(target.key);
    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notification server running on port ${PORT}`);
  console.log(`Agency emails configured:`);
  Object.entries(AGENCY_EMAILS).forEach(([agency, email]) => {
    console.log(`  ${agency}: ${email}`);
  });
});
