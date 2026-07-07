import { successResponse } from "../utils/response.js";
import { analyzeDocumentRisk } from "../services/ai_service.js";
import { Analysis } from "../models/analysis_model.js";

export const getAnalysis = async (req, res, next) => {
  console.log("DEBUG: getAnalysis controller triggered.");
  try {
    const { htmlContent, documentId } = req.body;
    const result = await analyzeDocumentRisk(htmlContent);
    const analysis = new Analysis(
      String(Date.now()),
      documentId || "unknown",
      result.riskScore,
      result.findings
    );
    return successResponse(res, { analysis }, "Document analysis completed successfully");
  } catch (err) {
    next(err);
  }
};
