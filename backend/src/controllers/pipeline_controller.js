import { ingestHtmlContent, searchLegalChunks } from "../services/pipeline_service.js";
import { parseFileToHtml } from "../services/parser_service.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Controller to handle ingestion of a legal HTML document.
 * Supports:
 * 1. File Upload (multipart/form-data with field "file")
 * 2. Raw HTML String (JSON body parameter "html")
 * Requires JSON/body parameter "documentName" for identification.
 */
export const ingestDocument = async (req, res, next) => {
  try {
    let htmlContent = "";
    let documentName = req.body.documentName;

    // Check for uploaded file
    if (req.file) {
      htmlContent = await parseFileToHtml(req.file.buffer, req.file.originalname, req.file.mimetype);
      // Use uploaded file name (excluding extension) as fallback documentName if not specified
      if (!documentName) {
        documentName = req.file.originalname.replace(/\.[^/.]+$/, "");
      }
    } else if (req.body.html) {
      htmlContent = req.body.html;
    }

    if (!htmlContent) {
      return errorResponse(res, "Missing HTML content. Upload a file or provide 'html' in the body.", null, 400);
    }

    if (!documentName) {
      return errorResponse(res, "Missing 'documentName' parameter.", null, 400);
    }

    console.log(`[Pipeline Controller] Processing ingestion request for document: "${documentName}"`);
    const result = await ingestHtmlContent(htmlContent, documentName);

    return successResponse(
      res,
      result,
      "Legal document ingested, chunked, embedded, and saved successfully.",
      201
    );
  } catch (error) {
    console.error("[Pipeline Controller Ingest Error]:", error);
    next(error);
  }
};

/**
 * Controller to perform cosine similarity search against ingested legal chunks.
 * Expects JSON body/query parameters:
 * - "query": Search phrase / term (required)
 * - "threshold": Minimum cosine similarity score (optional, defaults to 0.3)
 * - "limit": Maximum records count to return (optional, defaults to 5)
 */
export const searchDocument = async (req, res, next) => {
  try {
    const query = req.body.query || req.query.query;
    const thresholdVal = req.body.threshold || req.query.threshold;
    const limitVal = req.body.limit || req.query.limit;

    if (!query) {
      return errorResponse(res, "Missing 'query' parameter for similarity search.", null, 400);
    }

    const matchThreshold = thresholdVal ? parseFloat(thresholdVal) : 0.3;
    const matchCount = limitVal ? parseInt(limitVal, 10) : 5;

    console.log(`[Pipeline Controller] Searching similarity for: "${query}" (Threshold: ${matchThreshold}, Limit: ${matchCount})`);
    const results = await searchLegalChunks(query, matchThreshold, matchCount);

    return successResponse(
      res,
      { results },
      `Similarity search completed with ${results.length} matches.`
    );
  } catch (error) {
    console.error("[Pipeline Controller Search Error]:", error);
    next(error);
  }
};
