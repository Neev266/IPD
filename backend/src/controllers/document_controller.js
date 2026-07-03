import { listDocumentsFromCloudinary, deleteFromCloudinary } from "../services/cloudinary_service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getDocuments = async (req, res, next) => {
  console.log("DEBUG: getDocuments controller triggered.");
  try {
    const resources = await listDocumentsFromCloudinary();
    return successResponse(res, { resources }, "Documents fetched successfully");
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

  try {
    const result = await deleteFromCloudinary(publicId);
    return successResponse(res, { result }, "Document deleted successfully");
  } catch (err) {
    next(err);
  }
};
