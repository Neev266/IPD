import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/database.js";

const startServer = async () => {
  try {
    // Initialise mock Database
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`Backend server is running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("FATAL: Failed to start the backend server:", err);
    process.exit(1);
  }
};

startServer();
