import dotenv from "dotenv";
dotenv.config({ override: true });

export const env = {
  PORT: process.env.PORT || 5000,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// Simple configuration checker
export const isCloudinaryConfigured = 
  env.CLOUDINARY_CLOUD_NAME && 
  env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here" &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_KEY !== "your_api_key_here" &&
  env.CLOUDINARY_API_SECRET &&
  env.CLOUDINARY_API_SECRET !== "your_api_secret_here";
