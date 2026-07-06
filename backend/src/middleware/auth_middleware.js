import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("DEBUG: No Authorization header, falling back to userId query/body.");
      const userId = req.query.userId || req.body.userId;
      if (userId) {
        req.user = { id: userId };
        return next();
      }
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded; // Contains id and email
      next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized access: Invalid or expired token" });
    }
  } catch (err) {
    next(err);
  }
};
