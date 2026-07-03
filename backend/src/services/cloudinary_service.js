import cloudinary from "../config/cloudinary.js";
import { isCloudinaryConfigured } from "../config/env.js";

export const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    console.log(`DEBUG: uploadToCloudinary service started for: ${fileName}`);
    
    if (!isCloudinaryConfigured) {
      console.warn("DEBUG: Cloudinary not configured. Resolving with local URI placeholder.");
      return resolve({ secure_url: `local-file://${fileName}`, public_id: `local-file://${fileName}` });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "Documents",
        public_id: `${Date.now()}_${fileName.replace(/\s+/g, "_")}`,
      },
      (error, result) => {
        if (error) {
          console.error("DEBUG: Cloudinary raw stream upload failed:", error);
          return reject(error);
        }
        console.log("DEBUG: Cloudinary raw upload succeeded:", result.secure_url);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  console.log(`DEBUG: deleteFromCloudinary service started for: ${publicId}`);

  if (publicId.startsWith("local-file://")) {
    console.log("DEBUG: Mock deletion for local file. Bypassing API.");
    return { result: "ok" };
  }

  if (!isCloudinaryConfigured) {
    console.warn("DEBUG: Cloudinary not configured. Bypassing deletion.");
    return { result: "bypassed" };
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
  
  console.log("DEBUG: Cloudinary deletion response result:", result);
  return result;
};

export const listDocumentsFromCloudinary = async () => {
  console.log("DEBUG: listDocumentsFromCloudinary service started.");
  
  if (!isCloudinaryConfigured) {
    console.warn("DEBUG: Cloudinary not configured. Returning empty list.");
    return [];
  }

  const result = await cloudinary.api.resources({
    resource_type: "raw",
    type: "upload",
    prefix: "Documents/",
    max_results: 100,
  });

  return (result.resources || []).map((file) => {
    const publicId = file.public_id;
    const nameParts = publicId.split("/");
    const baseName = nameParts[nameParts.length - 1];
    const fileName = baseName.replace(/^\d+_/, ""); // remove timestamp prefix

    const dateObj = new Date(file.created_at);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;

    return {
      cloudinaryPublicId: publicId,
      cloudinaryUrl: file.secure_url,
      fileName: fileName,
      date: dateStr,
      createdAt: file.created_at,
    };
  });
};
