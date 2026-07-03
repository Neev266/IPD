import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const dotenvResult = dotenv.config({ override: true });
console.log("DEBUG: dotenv load result:", dotenvResult);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app (on port 8080) can communicate with us
app.use(cors());
app.use(express.json());

// Set up Multer for memory storage (files are kept in a buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Configure Cloudinary
console.log("DEBUG: Checking Cloudinary environment variables...");
console.log("DEBUG: CLOUDINARY_CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME);
console.log("DEBUG: CLOUDINARY_API_KEY =", process.env.CLOUDINARY_API_KEY);
console.log("DEBUG: CLOUDINARY_API_SECRET =", process.env.CLOUDINARY_API_SECRET ? `${process.env.CLOUDINARY_API_SECRET.slice(0, 4)}...` : "undefined/missing");

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key_here" &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== "your_api_secret_here";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("DEBUG: Cloudinary successfully configured and initialized.");
} else {
  console.warn(
    "WARNING: Cloudinary environment variables are missing or default. Server will parse files locally and bypass Cloudinary uploads."
  );
}

/**
 * Uploads a buffer stream to Cloudinary as raw resource.
 */
const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    console.log(`DEBUG: uploadToCloudinary called for file: ${fileName}`);
    console.log(`DEBUG: isCloudinaryConfigured check = ${isCloudinaryConfigured}`);

    if (!isCloudinaryConfigured) {
      console.warn("DEBUG: Skipping Cloudinary upload because it's not configured.");
      return resolve({ secure_url: `local-file://${fileName}` });
    }

    console.log("DEBUG: Initializing Cloudinary upload stream...");
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "Documents",
        public_id: `${Date.now()}_${fileName.replace(/\s+/g, "_")}`,
      },
      (error, result) => {
        console.log("DEBUG: Cloudinary upload stream callback triggered.");
        if (error) {
          console.error("DEBUG: Cloudinary upload stream encountered error:", error);
          return reject(error);
        }
        console.log("DEBUG: Cloudinary upload stream succeeded. Result details:", result);
        resolve(result);
      }
    );
    
    console.log("DEBUG: Writing buffer to Cloudinary upload stream...");
    uploadStream.end(fileBuffer);
  });
};

/**
 * Utility to parse PDF and convert text into structured HTML paragraphs.
 */
const parsePdfToHtml = async (buffer, fileName) => {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  // Format the text into structured HTML paragraphs/headers
  const cleanedText = text.replace(/\r\n/g, "\n").replace(/ +/g, " ");
  const sections = cleanedText.split(/\n\n+/);
  
  let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">${fileName.replace(/\.[^/.]+$/, "")}</h1>`;
  html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Imported from PDF</p>`;
  html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;
  
  sections.forEach((section) => {
    const trimmed = section.trim();
    if (!trimmed) return;
    
    // Check if it looks like a clause title/heading (e.g. "Clause 1. Scope", "1. Definition")
    const isHeading = trimmed.length < 120 && (
      /^(clause|section|article|part|sched|annex)/i.test(trimmed) || 
      /^\d+\.\s+[A-Z]/?.test(trimmed) ||
      /^[A-Z\s]{4,60}$/.test(trimmed)
    );
    
    if (isHeading) {
      html += `<h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">${trimmed}</h2>`;
    } else {
      // Replace single newlines within a paragraph with spaces to flow text nicely
      const paragraphText = trimmed.replace(/\n/g, " ");
      html += `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">${paragraphText}</p>`;
    }
  });
  
  return html;
};

/**
 * Utility to parse DOCX using mammoth and clean the output.
 */
const parseDocxToHtml = async (buffer, fileName) => {
  const result = await mammoth.convertToHtml({ buffer });
  let htmlContent = result.value;

  if (!htmlContent || htmlContent.trim() === "") {
    // Fallback if mammoth returned empty
    htmlContent = `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px">Empty document content.</p>`;
  }

  let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">${fileName.replace(/\.[^/.]+$/, "")}</h1>`;
  html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Imported from Word Document</p>`;
  html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;
  
  // Wrap mammoth output in standard document styling
  // Standardise paragraphs style
  htmlContent = htmlContent.replace(/<p>/g, `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">`);
  htmlContent = htmlContent.replace(/<h2>/g, `<h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">`);
  htmlContent = htmlContent.replace(/<h1>/g, `<h1 style="font-size:24px;font-weight:700;color:#111;margin-top:28px;margin-bottom:12px">`);
  
  html += htmlContent;
  return html;
};

/**
 * Main Upload & Parse Endpoint
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("DEBUG: POST /api/upload endpoint hit!");
  try {
    if (!req.file) {
      console.warn("DEBUG: No file found in request payload.");
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const { originalname, buffer, mimetype } = req.file;
    const extension = originalname.split(".").pop().toLowerCase();

    console.log(`DEBUG: Received file: ${originalname}, MimeType: ${mimetype}, Size: ${buffer.length} bytes`);

    // 1. Upload to Cloudinary
    let cloudinaryResult;
    try {
      console.log("DEBUG: Attempting upload to Cloudinary...");
      cloudinaryResult = await uploadToCloudinary(buffer, originalname);
      console.log("DEBUG: Cloudinary Upload Result URL:", cloudinaryResult.secure_url);
    } catch (uploadError) {
      console.error("DEBUG: Cloudinary upload failed:", uploadError);
      cloudinaryResult = { secure_url: `local-file://${originalname}` };
    }

    // 2. Convert / Parse document text
    let parsedHtml = "";
    if (extension === "pdf" || mimetype === "application/pdf") {
      parsedHtml = await parsePdfToHtml(buffer, originalname);
    } else if (
      extension === "docx" ||
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      parsedHtml = await parseDocxToHtml(buffer, originalname);
    } else {
      return res.status(400).json({
        error: "Invalid file type. Only PDF and Word (.docx) files are supported.",
      });
    }

    return res.json({
      success: true,
      fileName: originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      html: parsedHtml,
    });
  } catch (err) {
    console.error("DEBUG: Error processing file upload:", err);
    return res.status(500).json({
      error: "An error occurred while uploading and parsing the document.",
      details: err.message,
    });
  }
});

/**
 * Delete Endpoint to remove raw assets from Cloudinary
 */
app.delete("/api/documents", async (req, res) => {
  const { publicId } = req.query;
  console.log(`DEBUG: DELETE /api/documents request received for publicId: ${publicId}`);

  if (!publicId) {
    return res.status(400).json({ error: "Missing publicId parameter." });
  }

  // If it's a local mock file, just bypass Cloudinary delete
  if (publicId.startsWith("local-file://")) {
    console.log("DEBUG: Local file deletion. Bypassing Cloudinary API.");
    return res.json({ success: true, message: "Local mock document deleted." });
  }

  try {
    if (!isCloudinaryConfigured) {
      console.warn("DEBUG: Cloudinary not configured. Skipping deletion from Cloudinary storage.");
      return res.json({ success: true, message: "Bypassed Cloudinary deletion." });
    }

    console.log(`DEBUG: Requesting Cloudinary deletion for raw resource: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    console.log("DEBUG: Cloudinary deletion result:", result);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("DEBUG: Cloudinary deletion error:", err);
    return res.status(500).json({
      error: "Failed to delete resource from Cloudinary storage.",
      details: err.message,
    });
  }
});

/**
 * GET Endpoint to list all raw files under the 'Documents/' folder in Cloudinary
 */
app.get("/api/documents", async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      console.warn("DEBUG: Cloudinary not configured. Returning empty list of documents.");
      return res.json({ resources: [] });
    }

    console.log("DEBUG: Listing resources from Cloudinary folder 'Documents'...");
    const result = await cloudinary.api.resources({
      resource_type: "raw",
      type: "upload",
      prefix: "Documents/",
      max_results: 100,
    });

    console.log(`DEBUG: Found ${result.resources?.length || 0} raw resources in Cloudinary.`);
    
    const resources = (result.resources || []).map((file) => {
      const publicId = file.public_id;
      const nameParts = publicId.split("/");
      const baseName = nameParts[nameParts.length - 1];
      const fileName = baseName.replace(/^\d+_/, ""); // remove timestamp prefix
      
      // format date
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

    return res.json({ resources });
  } catch (err) {
    console.error("DEBUG: Error listing Cloudinary resources:", err);
    return res.status(500).json({
      error: "Failed to list resources from Cloudinary.",
      details: err.message,
    });
  }
});

/**
 * POST Endpoint to fetch and parse a document from a remote Cloudinary URL
 */
app.post("/api/parse-url", async (req, res) => {
  const { url, fileName } = req.body;
  console.log(`DEBUG: POST /api/parse-url request received for file: ${fileName}`);

  if (!url || !fileName) {
    return res.status(400).json({ error: "Missing url or fileName parameters." });
  }

  try {
    console.log(`DEBUG: Fetching file buffer from Cloudinary URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from Cloudinary (Status ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = fileName.split(".").pop().toLowerCase();

    console.log(`DEBUG: File buffer fetched successfully (${buffer.length} bytes). Parsing...`);
    let parsedHtml = "";
    if (extension === "pdf") {
      parsedHtml = await parsePdfToHtml(buffer, fileName);
    } else if (extension === "docx") {
      parsedHtml = await parseDocxToHtml(buffer, fileName);
    } else {
      return res.status(400).json({ error: "Unsupported file extension." });
    }

    console.log("DEBUG: File parsing succeeded.");
    return res.json({ html: parsedHtml });
  } catch (err) {
    console.error("DEBUG: Parse URL error:", err);
    return res.status(500).json({
      error: "Failed to parse remote file.",
      details: err.message,
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
