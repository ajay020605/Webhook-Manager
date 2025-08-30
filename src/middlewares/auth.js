import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers["x-authorization"];
    if (!header) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid Authorization format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB and exclude sensitive fields
    const user = await User.findById(decoded.userId).select("-passwordHash -otp -otpExpiry");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // attach full user document
    console.log("Authenticated user:", user._id);

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
