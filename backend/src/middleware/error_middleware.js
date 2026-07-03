export const errorMiddleware = (err, req, res, next) => {
  console.error("DEBUG: Express global error boundary caught:", err);
  
  const status = err.status || 500;
  const message = err.message || "An unexpected server error occurred.";
  
  return res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
