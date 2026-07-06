import { supabase } from "../config/supabase.js";

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
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized access: " + (error?.message || "Invalid token") });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
