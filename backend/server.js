const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const { auth: adminAuth } = require("./config/firebase");

const app = express();
app.use(cors());
app.use(express.json());

// Incident videos are stored on local disk instead of Firebase Storage
// (that product was never provisioned for this Firebase project) and served
// back out as static files.
const VIDEO_UPLOAD_DIR = path.join(__dirname, "uploads", "incident-videos");
fs.mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_UPLOAD_DIR),
    // multer parses multipart fields in stream order, so this callback only
    // sees req.body.incidentId if the client appended that field before the
    // file field.
    filename: (req, file, cb) => {
      const incidentId = req.body.incidentId;
      if (!incidentId || !/^[A-Za-z0-9_-]+$/.test(incidentId)) {
        return cb(new Error("Missing or invalid incidentId"));
      }
      cb(null, `${incidentId}.mp4`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "video/mp4" && !file.originalname.endsWith(".mp4")) {
      return cb(new Error("Only .mp4 videos are allowed"));
    }
    cb(null, true);
  },
});

app.post("/api/upload-video", (req, res) => {
  videoUpload.single("video")(req, res, (err) => {
    if (err) {
      console.error("Video upload failed:", err.message);
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No video file provided" });
    }
    res.json({
      success: true,
      path: `/uploads/incident-videos/${req.file.filename}`,
    });
  });
});

// In-memory store for password reset codes: email -> { code, expiresAt, verified, attempts }
const resetCodes = new Map();
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

// Step 1: send a 6-digit password reset code to the user's email
app.post("/api/auth/forgot-password/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    if (!adminAuth) {
      console.error(
        "Firebase Admin Auth is not initialized (missing service account credentials).",
      );
      return res
        .status(500)
        .json({ success: false, error: "Server auth is not configured" });
    }

    try {
      await adminAuth.getUserByEmail(email);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        // Don't reveal whether the account exists.
        return res.json({
          success: true,
          message: "If an account exists for this email, a code has been sent.",
        });
      }
      throw err;
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + RESET_CODE_TTL_MS,
      verified: false,
      attempts: 0,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@hazardapp.com",
      to: email,
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

    res.json({
      success: true,
      message: "If an account exists for this email, a code has been sent.",
    });
  } catch (error) {
    console.error("Error sending reset code:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send reset code" });
  }
});

// Step 2: verify the 6-digit code
app.post("/api/auth/forgot-password/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, error: "Email and code are required" });
  }

  const entry = resetCodes.get(email);
  if (!entry) {
    return res.status(400).json({
      success: false,
      error: "No reset code was requested for this email",
    });
  }
  if (Date.now() > entry.expiresAt) {
    resetCodes.delete(email);
    return res.status(400).json({
      success: false,
      error: "Code has expired, please request a new one",
    });
  }
  if (entry.attempts >= MAX_CODE_ATTEMPTS) {
    resetCodes.delete(email);
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
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email, code and new password are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    const entry = resetCodes.get(email);
    if (!entry || entry.code !== code || !entry.verified) {
      return res.status(400).json({
        success: false,
        error: "Code must be verified before resetting the password",
      });
    }
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(email);
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

    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(userRecord.uid, { password: newPassword });

    resetCodes.delete(email);
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
