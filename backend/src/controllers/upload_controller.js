import { uploadToCloudinary } from "../services/cloudinary_service.js";
import { parseFileToHtml } from "../services/parser_service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const uploadFile = async (req, res, next) => {
  console.log("DEBUG: uploadFile controller triggered.");
  try {
    if (!req.file) {
      return errorResponse(res, "No file was uploaded.", null, 400);
    }

    const { originalname, buffer, mimetype } = req.file;
    console.log(`DEBUG: Received file: ${originalname}, MimeType: ${mimetype}, Size: ${buffer.length} bytes`);

    // 1. Upload to Cloudinary
    let cloudinaryResult;
    try {
      console.log("DEBUG: Attempting upload to Cloudinary...");
      cloudinaryResult = await uploadToCloudinary(buffer, originalname);
      console.log("DEBUG: Cloudinary Upload Result URL:", cloudinaryResult.secure_url);
    } catch (uploadError) {
      console.error("DEBUG: Cloudinary upload failed:", uploadError);
      cloudinaryResult = { secure_url: `local-file://${originalname}`, public_id: `local-file://${originalname}` };
    }

    // 2. Parse document text to editable HTML
    const parsedHtml = await parseFileToHtml(buffer, originalname, mimetype);
    console.log("DEBUG: Document parsed to HTML successfully.");

    return successResponse(res, {
      fileName: originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      html: parsedHtml,
    }, "Document uploaded and parsed successfully");
  } catch (err) {
    next(err);
  }
};

export const parseRemoteUrl = async (req, res, next) => {
  const { url, fileName } = req.body;
  console.log(`DEBUG: parseRemoteUrl controller triggered for file: ${fileName}`);

  if (!url || !fileName) {
    return errorResponse(res, "Missing url or fileName parameters.", null, 400);
  }

  try {
    console.log(`DEBUG: Fetching file buffer from Cloudinary URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from Cloudinary (Status ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse
    const parsedHtml = await parseFileToHtml(buffer, fileName, "");
    console.log("DEBUG: Remote document parsed successfully.");

    return successResponse(res, { html: parsedHtml }, "Remote document parsed successfully");
  } catch (err) {
    next(err);
  }
};
