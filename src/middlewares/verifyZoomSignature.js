// import crypto from "crypto";
// import { App } from "../models/App.js";

// export default async function verifyZoomSignature(req, res, next) {
//   try {
//     const zoomSignature = req.headers["x-zm-signature"];
//     const timestamp = req.headers["x-zm-request-timestamp"];

//     if (!zoomSignature || !timestamp) {
//       return res.status(400).json({ error: "Missing Zoom signature or timestamp" });
//     }

//     const rawBody = req.rawBody;
//     if (!rawBody) {
//       return res.status(400).json({ error: "Raw body missing for Zoom verification" });
//     }

//     // Parse payload to get account_id and app name
//     let payload;
//     try {
//       payload = JSON.parse(rawBody);
//     } catch (err) {
//       return res.status(400).json({ error: "Invalid JSON payload" });
//     }

//     const accountId = await ;
//     const appName = "Zoom"; // fallback if you store app name

//     if (!accountId) {
//       return res.status(400).json({ error: "account_id missing in payload" });
//     }

//     // Fetch the app from DB by account_id and app name
//     const app = await App.findOne({ accountId, name: appName });
//     if (!app) return res.status(404).json({ error: "Zoom app not found" });

//     const secretToken = app.verificationCode;
//     if (!secretToken) return res.status(500).json({ error: "Zoom app secret missing" });

//     // Compute HMAC signature
//     const message = `v0:${timestamp}:${rawBody}`;
//     const hash = crypto.createHmac("sha256", secretToken).update(message).digest("base64");
//     const expectedSignature = `v0=${hash}`;

//     if (expectedSignature !== zoomSignature) {
//       return res.status(401).json({ error: "Invalid Zoom signature" });
//     }

//     // Attach app data for downstream use if needed
//     req.appData = app;

//     next();
//   } catch (err) {
//     console.error("Zoom verification error:", err);
//     res.status(500).json({ error: "Server error during Zoom verification" });
//   }
// }
