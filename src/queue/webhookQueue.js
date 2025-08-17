import { Queue } from "bullmq";
import { config } from "../config.js";

export const WEBHOOK_QUEUE = "webhook-delivery";

export const webhookQueue = new Queue(WEBHOOK_QUEUE, {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 1000
  }
});
