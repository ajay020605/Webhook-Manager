// routes/appRoutes.js
import express from "express";
import { App } from "../models/App.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

/**
 * Create or update an app for the logged-in user
 * POST /api/apps
 * Body: { name, verificationCode, targetUrl }
 */router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, targetUrl } = req.body;

    if (!name || !targetUrl) {
      return res.status(400).json({ error: "Name and targetUrl are required" });
    }

    // Try to find existing app for this user by name
    let app = await App.findOne({ name, user: userId });

    if (app) {
      // App exists → update targetUrl
      app.targetUrl = targetUrl;
      await app.save();
    } else {
      // App doesn't exist → create new
      app = await App.create({
        name,
        targetUrl,
        user: userId
      });
    }

    return res.status(200).json({ message: "App created/updated successfully", app });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


/**
 * Get all apps for the logged-in user
 * GET /api/apps
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const apps = await App.find({ user: userId });
    return res.status(200).json(apps);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
