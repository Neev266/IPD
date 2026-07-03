import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "./env.js";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log("DEBUG: Cloudinary configured successfully.");
} else {
  console.warn(
    "WARNING: Cloudinary environment variables are missing or default. Uploads will run in mock local mode."
  );
}

export default cloudinary;
