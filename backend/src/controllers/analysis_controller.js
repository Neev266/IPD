import { successResponse } from "../utils/response.js";
import { analyzeDocumentRisk } from "../services/ai_service.js";
import { Analysis } from "../models/analysis_model.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { GoogleGenAI } from "@google/genai";

export const getAnalysis = async (req, res, next) => {
  console.log("DEBUG: getAnalysis controller triggered.");
  try {
    const { htmlContent, documentId, documentName } = req.body;

    let dbDocumentId = null;
    if (documentName) {
      console.log(`[Analysis Controller] Looking up document UUID for name: "${documentName}"`);
      const { data: docRow } = await supabase
        .from("documents")
        .select("id")
        .eq("document_name", documentName)
        .maybeSingle();
      if (docRow) {
        dbDocumentId = docRow.id;
        console.log(`[Analysis Controller] Found document UUID: ${dbDocumentId}`);
      }
    }

    if (!dbDocumentId && documentId && documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      dbDocumentId = documentId;
    }

    // 1. If we have a valid database UUID, check if classifications are already cached in Supabase
    if (dbDocumentId) {
      console.log(`[Analysis Controller] Checking database for cached classifications (Document ID: ${dbDocumentId})...`);
      const { data: cachedFindings, error: fetchError } = await supabase
        .from("document_classifications")
        .select("*")
        .eq("document_id", dbDocumentId)
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
          documentId || "unknown",
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
    } else if (dbDocumentId) {
      console.log(`[Analysis Controller] HTML content not provided. Fetching chunks from database for Document ID: ${dbDocumentId}...`);
      const { data: dbChunks, error: dbChunksError } = await supabase
        .from("legal_chunks")
        .select("content, chunk_index")
        .eq("document_id", dbDocumentId)
        .order("chunk_index", { ascending: true });

      if (dbChunksError) {
        throw new Error(`Database query error while retrieving chunks: ${dbChunksError.message}`);
      }

      if (!dbChunks || dbChunks.length === 0) {
        throw new Error(`No HTML content provided, and no chunks found in the database for Document ID: ${dbDocumentId}`);
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

    // 3. Cache the newly generated classifications if dbDocumentId is valid
    if (dbDocumentId && result.findings.length > 0) {
      console.log(`[Analysis Controller] Caching ${result.findings.length} findings in Supabase...`);
      const rowsToInsert = result.findings.map((f) => ({
        document_id: dbDocumentId,
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

export const handleChat = async (req, res, next) => {
  console.log("[Chat Controller] handleChat triggered.");
  try {
    const { message, history, memoryContext, documentId, documentName } = req.body;

    if (!message) {
      throw new Error("Message query text is required.");
    }

    // Keep only the last 8 messages of history for dialogue memory
    const last8History = history ? history.slice(-8) : [];

    // Find the document UUID in the database using the document name
    let dbDocumentId = null;
    if (documentName) {
      const { data: docRow } = await supabase
        .from("documents")
        .select("id")
        .eq("document_name", documentName)
        .maybeSingle();
      if (docRow) {
        dbDocumentId = docRow.id;
      }
    }

    if (!dbDocumentId && documentId && documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      dbDocumentId = documentId;
    }

    // 1. Build or retrieve the running memory context (using classifications as initial context)
    let activeMemory = memoryContext;
    if (!activeMemory && dbDocumentId) {
      console.log(`[Chat Controller] Building initial memory context from classifications...`);
      const { data: cachedFindings } = await supabase
        .from("document_classifications")
        .select("*")
        .eq("document_id", dbDocumentId)
        .order("id", { ascending: true });

      if (cachedFindings && cachedFindings.length > 0) {
        activeMemory = "Initial compliance classification risk analysis context:\n" +
          cachedFindings.map((cf) => `- Category: ${cf.category}\n  Risk: ${cf.risk}\n  Extract: "${cf.answer}"\n  Explanation: ${cf.explanation || ""}\n  Suggestion: ${cf.suggestion || ""}`).join("\n");
      } else {
        activeMemory = "No compliance flags or risk classifications detected for this document yet.";
      }
    }

    if (!activeMemory) {
      activeMemory = "No initial memory context available.";
    }

    // 2. Perform a similarity search on legal_chunks using the user's message
    let relevantChunkText = "No relevant text chunks found.";
    let riskFlagText = "No risk flags associated with this chunk.";

    try {
      const { searchLegalChunks } = await import("../services/pipeline_service.js");
      // Search top 2 matching chunks to get sufficient context
      const searchResults = await searchLegalChunks(message, 0.1, 2);
      if (searchResults && searchResults.length > 0) {
        relevantChunkText = searchResults.map(r => `[Chunk Index ${r.chunk_index}]: ${r.content}`).join("\n\n");

        // Look up if any cached classification matches or overlaps with the retrieved chunks
        if (dbDocumentId) {
          const { data: cachedFindings } = await supabase
            .from("document_classifications")
            .select("*")
            .eq("document_id", dbDocumentId);

          if (cachedFindings && cachedFindings.length > 0) {
            const matchedRisks = [];
            for (const res of searchResults) {
              const lowerContent = res.content.toLowerCase();
              for (const cf of cachedFindings) {
                if (cf.answer && lowerContent.includes(cf.answer.toLowerCase())) {
                  matchedRisks.push(`- Category: ${cf.category} (${cf.risk} Risk): ${cf.explanation || ""}\n  Suggested Fix: ${cf.suggestion || ""}`);
                }
              }
            }
            if (matchedRisks.length > 0) {
              riskFlagText = matchedRisks.join("\n");
            }
          }
        }
      }
    } catch (searchErr) {
      console.error("[Chat Controller Warning] Semantic search failed:", searchErr.message);
    }

    // 3. Format history for Gemini
    const formattedHistory = last8History.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");

    // 4. Invoke Gemini API
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const systemPrompt = `You are an expert AI Legal Assistant helping a user review a legal contract.
You have access to the document's compliance analysis, relevant text chunks, and a running memory context.

CURRENT MEMORY CONTEXT:
${activeMemory}

RELEVANT CHUNKS FROM DOCUMENT:
${relevantChunkText}

RISK FLAG(S) FOR THE CHUNKS:
${riskFlagText}

CHAT HISTORY (LAST 8 MESSAGES):
${formattedHistory}

USER QUESTION:
${message}

INSTRUCTIONS:
1. Provide a clear, precise, and helpful answer to the user's question using the relevant chunks, risk flags, and memory context.
2. Update the memory context to include any new topics discussed, user preferences stated, or clarifications made in this turn. Keep the memory context concise, structured, and focused on the key terms of the document.`;

    console.log("[Chat Controller] Invoking Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            reply: { type: "STRING" },
            updatedMemoryContext: { type: "STRING" }
          },
          required: ["reply", "updatedMemoryContext"]
        }
      }
    });
    console.log("===== GEMINI RAW RESPONSE =====");
    console.log(response.text);
    console.log("===============================");
    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText.trim());

    // Helper to clean unnecessary formatting markers (*, -, #, and `)
    const cleanMarkdownSymbols = (text) => {
      if (!text) return "";
      return text
        // Remove markdown heading symbols (e.g., #, ##, ###)
        .replace(/#+/g, "")
        // Remove bold and italic asterisks (e.g., **text** or *text*)
        .replace(/\*{1,2}/g, "")
        // Remove list bullets at the beginning of any line (e.g., "- " or "* " or " - ")
        .replace(/^\s*[\*\-]\s+/gm, "")
        // Remove horizontal dividers (e.g., "---" or "***")
        .replace(/^\s*[\*\-]{3,}\s*$/gm, "")
        // Remove backticks (code symbols)
        .replace(/`/g, "")
        .trim();
    };

    const reply = cleanMarkdownSymbols(parsedData.reply || "I'm sorry, I encountered an issue processing your query.");
    const memory = cleanMarkdownSymbols(parsedData.updatedMemoryContext || activeMemory);

    return successResponse(
      res,
      {
        reply,
        memoryContext: memory
      },
      "Chat query completed successfully"
    );
  } catch (err) {
    next(err);
  }
};
