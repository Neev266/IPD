import { successResponse } from "../utils/response.js";
import { analyzeDocumentRisk } from "../services/ai_service.js";

export const getAnalysis = async (req, res, next) => {
  console.log("DEBUG: getAnalysis controller triggered.");
  try {
    const { htmlContent } = req.body;
    const result = await analyzeDocumentRisk(htmlContent);
    return successResponse(res, { analysis: result }, "Document analysis completed successfully");
  } catch (err) {
    next(err);
  }
};
