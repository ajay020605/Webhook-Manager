import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  statusCode: { type: Number },
  latencyMs: { type: Number },
  error: { type: String }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ reference to User
  headers: { type: Object, default: {} },
  payload: { type: Object, required: true },
  status: { type: String, enum: ["pending", "retrying", "success", "failed"], default: "pending" },
  attempts: { type: Number, default: 0 },
  targetUrl: { type: String, default: null },
  attemptLog: { type: [attemptSchema], default: [] }
}, { timestamps: true });

export const Event = mongoose.model("Event", eventSchema);
