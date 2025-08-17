import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
  const header = req.headers["x-authorization"];  if (!header) return res.status(401).json({ error: "Missing Authorization header" });
  

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Invalid Authorization format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Make sure req.user has _id
    req.user = { _id: decoded.userId };  
    console.log("Authenticated userId:", req.user._id);
    next();
  } catch (err) {
    console.log(err)
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
