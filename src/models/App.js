// models/App.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const appSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },       // App name, e.g., "Zoom"
    targetUrl: { type: String, required: true },  // Webhook target URL
  },
  { timestamps: true }
);

// Ensure a user can have only one entry per app name
appSchema.index({ user: 1, name: 1 }, { unique: true });

// Helper to create or update an app
appSchema.statics.createOrUpdate = async function (userId, appName, targetUrl) {
  return this.findOneAndUpdate(
    { user: userId, name: appName },    // Find app for this user
    { targetUrl },                      // Update target URL
    { upsert: true, new: true, runValidators: true } // Create if doesn't exist, return updated doc
  );
};

export const App = model("App", appSchema);
