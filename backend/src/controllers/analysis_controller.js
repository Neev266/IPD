import { successResponse } from "../utils/response.js";
import { analyzeDocumentRisk } from "../services/ai_service.js";
import { Analysis } from "../models/analysis_model.js";
import { supabase } from "../config/supabase.js";

export const getAnalysis = async (req, res, next) => {
  console.log("DEBUG: getAnalysis controller triggered.");
  try {
    const { htmlContent, documentId } = req.body;

    // 1. If documentId is provided, check if classifications are already cached in Supabase
    if (documentId && documentId !== "unknown") {
      console.log(`[Analysis Controller] Checking database for cached classifications (Document ID: ${documentId})...`);
      const { data: cachedFindings, error: fetchError } = await supabase
        .from("document_classifications")
        .select("*")
        .eq("document_id", documentId)
        .order("id", { ascending: true });

      if (!fetchError && cachedFindings && cachedFindings.length > 0) {
        console.log(`[Analysis Controller] Found ${cachedFindings.length} cached findings. Returning instantly.`);
        
        const findings = cachedFindings.map((row) => ({
          id: `f_${row.id}`,
          title: row.category,
          text: row.answer,
          risk: row.risk,
          explanation: row.explanation,
          suggestion: row.suggestion,
          confidenceScore: row.confidence_score
        }));

        // Compute risk score based on cached findings
        let riskScore = 0.15;
        const hasHighRisk = findings.some((f) => f.risk === "High");
        const hasMedRisk = findings.some((f) => f.risk === "Medium");

        if (hasHighRisk) {
          riskScore = 0.85;
        } else if (hasMedRisk) {
          riskScore = 0.50;
        } else if (findings.length > 0) {
          riskScore = 0.25;
        }

        const analysis = new Analysis(
          String(Date.now()),
          documentId,
          riskScore,
          findings
        );
        return successResponse(res, { analysis }, "Cached document analysis loaded successfully");
      }
    }

    // 2. Fallback: Run CPU DeBERTa classification if not cached
    let result;
    if (htmlContent) {
      result = await analyzeDocumentRisk(htmlContent);
    } else if (documentId && documentId !== "unknown") {
      console.log(`[Analysis Controller] HTML content not provided. Fetching chunks from database for Document ID: ${documentId}...`);
      const { data: dbChunks, error: dbChunksError } = await supabase
        .from("legal_chunks")
        .select("content, chunk_index")
        .eq("document_id", documentId)
        .order("chunk_index", { ascending: true });

      if (dbChunksError) {
        throw new Error(`Database query error while retrieving chunks: ${dbChunksError.message}`);
      }

      if (!dbChunks || dbChunks.length === 0) {
        throw new Error(`No HTML content provided, and no chunks found in the database for Document ID: ${documentId}`);
      }

      console.log(`[Analysis Controller] Retrieved ${dbChunks.length} chunks from database. Running classification...`);
      const { analyzeChunks } = await import("../services/ai_service.js");
      result = await analyzeChunks(dbChunks);
    } else {
      throw new Error("HTML content is required for analysis when no cached data or document ID is available.");
    }

    const analysis = new Analysis(
      String(Date.now()),
      documentId || "unknown",
      result.riskScore,
      result.findings
    );

    // 3. Cache the newly generated classifications if documentId is valid
    if (documentId && documentId !== "unknown" && result.findings.length > 0) {
      console.log(`[Analysis Controller] Caching ${result.findings.length} findings in Supabase...`);
      const rowsToInsert = result.findings.map((f) => ({
        document_id: documentId,
        category: f.title,
        answer: f.text,
        risk: f.risk,
        explanation: f.explanation,
        suggestion: f.suggestion,
        confidence_score: f.confidenceScore
      }));

      const { error: insertError } = await supabase
        .from("document_classifications")
        .insert(rowsToInsert);

      if (insertError) {
        console.error("[Analysis Controller Error] Failed to cache findings:", insertError.message);
      } else {
        console.log("[Analysis Controller] Findings cached successfully.");
      }
    }

    return successResponse(res, { analysis }, "Document analysis completed successfully");
  } catch (err) {
    next(err);
  }
};

