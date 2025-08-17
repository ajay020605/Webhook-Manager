import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { config } from "../config.js";

const router = express.Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6)
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Sign-up
router.post("/signup", async (req, res) => {
  try {
    const { email, username, password } = signupSchema.parse(req.body);

    // Check existing email or username
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: "Email or username already in use" });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ email, username, passwordHash });

    // Issue JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sign-in
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = signinSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid email or password" });

    // Issue JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
