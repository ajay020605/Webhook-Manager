import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import nodemailer from "nodemailer";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

/* =========================
   Email (nodemailer)
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email sending failed:", err);
    throw new Error("Failed to send email");
  }
}

/* =========================
   Helpers
========================= */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* =========================
   Signup
========================= */
router.post("/signup", async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  try {
    if (!email || !username || !password || !confirmPassword)
      return res.status(400).json({ error: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = new User({ email, username, passwordHash, otp, otpExpiry });
    await user.save();

    await sendEmail({
      to: email,
      subject: "Verify your account",
      text: `Your OTP to verify your account is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ message: "Signup successful, please verify OTP" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   Verify Signup OTP
========================= */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpiry)
      return res.status(400).json({ error: "No OTP request found" });

    if (user.otp !== otp || new Date(user.otpExpiry).getTime() < Date.now())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   Signin
========================= */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   Forgot Password
========================= */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendEmail({
      to: email,
      subject: "Reset Password OTP",
      text: `Your OTP for resetting password is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   Reset Password
========================= */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  try {
    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpiry)
      return res.status(400).json({ error: "No password reset request found" });

    if (user.otp !== otp || new Date(user.otpExpiry).getTime() < Date.now())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================
   Profile (protected)
========================= */
router.get("/profile", authMiddleware, async (req, res) => {
  res.json(req.user);
});

/* =========================
   Change Password (logged-in user)
========================= */
router.post("/change-password-request", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Change Password OTP",
      text: `Your OTP for changing password is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  const { otp, newPassword, confirmNewPassword } = req.body;

  try {
    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const user = await User.findById(req.user._id);
    if (!user?.otp || !user?.otpExpiry)
      return res.status(400).json({ error: "No password change request found" });

    if (user.otp !== otp || new Date(user.otpExpiry).getTime() < Date.now())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 1️⃣ Define the schema
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
});
// PUT /auth/update-profile
router.put("/update-profile", authMiddleware, async (req, res) => {
  const { username, email } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if email/username is already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ error: "Email already in use" });
      user.email = email;
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) return res.status(400).json({ error: "Username already in use" });
      user.username = username;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
