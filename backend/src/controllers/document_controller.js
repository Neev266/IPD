import { listDocumentsFromCloudinary, deleteFromCloudinary, saveDocumentToCloudinary } from "../services/cloudinary_service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getDocuments = async (req, res, next) => {
  console.log("DEBUG: getDocuments controller triggered.");
  try {
    const userId = req.user?.id;
    const resources = await listDocumentsFromCloudinary(userId);
    return successResponse(res, { resources }, "Documents fetched successfully");
  } catch (err) {
    next(err);
  }
};

export const saveDocument = async (req, res, next) => {
  const { publicId, html } = req.body;
  console.log(`DEBUG: saveDocument controller triggered for: ${publicId}`);

  if (!publicId || !html) {
    return errorResponse(res, "Missing publicId or html parameters.", null, 400);
  }

  const userId = req.user?.id;
  if (userId && !publicId.startsWith(`Documents/${userId}/`)) {
    return errorResponse(res, "Unauthorized save attempt.", null, 403);
  }

  try {
    const result = await saveDocumentToCloudinary(html, publicId);
    return successResponse(res, { result }, "Document saved successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  const { publicId } = req.query;
  console.log(`DEBUG: deleteDocument controller triggered for: ${publicId}`);

  if (!publicId) {
    return errorResponse(res, "Missing publicId parameter.", null, 400);
  }

  if (publicId.startsWith("local-file://")) {
    try {
      const result = await deleteFromCloudinary(publicId);
      return successResponse(res, { result }, "Document deleted successfully");
    } catch (err) {
      return next(err);
    }
  }

  const userId = req.user?.id;
  if (userId && !publicId.startsWith(`Documents/${userId}/`)) {
    return errorResponse(res, "Unauthorized deletion attempt.", null, 403);
  }

  try {
    const result = await deleteFromCloudinary(publicId);
    return successResponse(res, { result }, "Document deleted successfully");
  } catch (err) {
    next(err);
  }
};
