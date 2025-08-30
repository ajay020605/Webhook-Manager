import express from "express";
import { Event } from "../models/Event.js";
import { App } from "../models/App.js";
import { webhookQueue } from "../queue/webhookQueue.js";
import { config } from "../config.js";

import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 1) Receive incoming Zoom webhook
// Currently protected with authMiddleware (good for testing)
// For production, replace authMiddleware with a signature/secret check.
router.post("/receive", authMiddleware, async (req, res) => {
  try {
    console.log("Incoming webhook:", req.body);
    console.log("Incoming headers:", req.headers);

    // 🔑 Find Zoom app for this specific user
    const app = await App.findOne({ name: "Zoom", user: req.user._id });
    if (!app) {
      return res.status(404).json({ success: false, error: "Zoom app not found for this user" });
    }

    // Use targetUrl from the app or fallback to default
    const targetUrl = app.targetUrl || config.defaults.targetUrl;

    // Save the event
    const event = await Event.create({
      headers: req.headers,
      payload: req.body,
      status: "pending",
      targetUrl,
      app: app._id,
      user: app.user // associate with correct user
    });

    // Queue the event for delivery
    await webhookQueue.add(
      "deliver",
      { eventId: event._id.toString() },
      {
        attempts: config.retries.maxAttempts,
        backoff: { type: "exponential", delay: config.retries.backoffMs }
      }
    );

    res.json({ success: true, id: event._id, app: app.name });
  } catch (err) {
    console.error("Receive error:", err);
    res.status(500).json({ success: false, error: "Failed to receive webhook" });
  }
});

// 2) List events for logged-in user
router.get("/events", authMiddleware, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const userId = req.user._id;

    const query = { user: userId };
    if (status) query.status = status;

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("user", "_id email username"); // populate safe fields

    res.json(events);
  } catch (err) {
    console.error("List events error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// 3) Replay by ID (only allow if event belongs to user)
router.post("/replay/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findOne({ _id: id, user: userId });
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    await webhookQueue.add(
      "deliver",
      { eventId: id },
      {
        attempts: config.retries.maxAttempts,
        backoff: { type: "exponential", delay: config.retries.backoffMs }
      }
    );

    res.json({ success: true, queued: id });
  } catch (err) {
    console.error("Replay error:", err);
    res.status(500).json({ success: false, error: "Failed to replay event" });
  }
});

export default router;
