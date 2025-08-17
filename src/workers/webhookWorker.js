import { Worker } from "bullmq";
import axios from "axios";
import { config } from "../config.js";
import { WEBHOOK_QUEUE } from "../queue/webhookQueue.js";
import { Event } from "../models/Event.js";
import mongoose from "mongoose";

// Ensure DB is connected for the worker
await mongoose.connect(config.mongoUri).then(() => {
  console.log("✅ Worker connected to MongoDB");
});

const worker = new Worker(WEBHOOK_QUEUE, async (job) => {
  const { eventId } = job.data;
  const event = await Event.findById(eventId);
  if (!event) return; // nothing to do

  // TODO (later): apply routing rules to compute targetUrl
  const targetUrl = event.targetUrl || config.defaults.targetUrl;
  if (!targetUrl) {
    // No target configured — mark failed and stop retrying
    event.status = "failed";
    event.attempts = job.attemptsMade + 1;
    event.attemptLog.push({ error: "No targetUrl configured" });
    await event.save();
    return;
  }

  const started = Date.now();
  try {
    const resp = await axios.post(targetUrl, event.payload, { timeout: 7000, validateStatus: () => true });
    const latency = Date.now() - started;

    // Log attempt
    event.attempts = job.attemptsMade + 1;
    event.attemptLog.push({ statusCode: resp.status, latencyMs: latency });

    if (resp.status >= 200 && resp.status < 300) {
      event.status = "success";
      await event.save();
      return; // success, done
    }

    // Non-2xx -> ask BullMQ to retry by throwing
    event.status = (event.attempts >= job.opts.attempts) ? "failed" : "retrying";
    await event.save();
    throw new Error(`Non-2xx (${resp.status}) from ${targetUrl}`);
  } catch (err) {
    const latency = Date.now() - started;
    event.attempts = job.attemptsMade + 1;
    event.attemptLog.push({ error: err.message, latencyMs: latency });

    // If this was the last allowed attempt, mark as failed; else retrying
    event.status = (event.attempts >= (job.opts.attempts || config.retries.maxAttempts)) ? "failed" : "retrying";
    await event.save();

    // Re-throw so BullMQ schedules the retry with backoff
    throw err;
  }
}, { connection: config.redis });

worker.on("completed", (job) => {
  console.log(`✅ Delivered event ${job.data.eventId}`);
});

worker.on("failed", (job, err) => {
  const left = (job.opts.attempts || config.retries.maxAttempts) - (job.attemptsMade || 0);
  console.log(`❌ Attempt ${job.attemptsMade} failed for ${job?.data?.eventId}. Retries left: ${left}. Reason: ${err?.message}`);
});
