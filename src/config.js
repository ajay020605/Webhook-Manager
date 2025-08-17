import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/webhook_manager",
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
  },
  defaults: {
    targetUrl: process.env.DEFAULT_TARGET_URL || null
  },
  retries: {
    maxAttempts: 5,               // total tries (1 + 4 retries)
    backoffMs: 60_000             // exponential base (1m, 2m, 4m, …)
  }
};
