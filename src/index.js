import express from "express";
import mongoose from "mongoose";
import { config } from "./config.js";
import webhookRoutes  from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import cors from "cors";
const app = express();

// Parse JSON; for signature verification you’d also keep raw body, but JSON is fine for now
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true                // if you need cookies/auth
}));
app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/webhooks", webhookRoutes);
app.use("/auth", authRoutes);
app.use("/api/apps", appRoutes);
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(config.port, () => console.log(`🚀 API on http://localhost:${config.port}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
