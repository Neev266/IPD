export const authMiddleware = (req, res, next) => {
  // Simple mock authorization middleware
  console.log("DEBUG: Auth middleware passed (Development/Demo Mode).");
  next();
};
