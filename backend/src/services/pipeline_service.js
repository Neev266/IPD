import { parseHTMLToSections, chunkSections } from "../utils/html_parser.js";
import { generateEmbeddings } from "./embedding_service.js";
import { upsertToDatabase } from "./document_service.js";
import { env } from "../config/env.js";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "../config/supabase.js";

/**
 * Service to process, chunk, embed, and database-upsert a legal document from an HTML string.
 * 
 * @param {string} htmlContent - Raw HTML document content.
 * @param {string} documentName - Unique name for the document.
 * @returns {Promise<{documentId: string, chunkCount: number}>}
 */
export async function ingestHtmlContent(htmlContent, documentName) {
  if (!htmlContent) {
    throw new Error("HTML content is required for ingestion.");
  }
  if (!documentName) {
    throw new Error("Document name is required for ingestion.");
  }

  console.log(`[Pipeline Service] Starting ingestion for: "${documentName}"`);

  // 1. Parse landmarks
  const sections = parseHTMLToSections(htmlContent);
  console.log(`[Pipeline Service] Identified ${sections.length} semantic sections.`);

  // 2. Split chunks
  const chunks = await chunkSections(sections);
  console.log(`[Pipeline Service] Generated ${chunks.length} total chunks.`);
  // 
  // ######## CHUNKS DEBUGGGING ########
  // chunks.forEach((chunk, index) => {
  //   console.log(`\n========== CHUNK ${index + 1} ==========`);

  //   console.log("Chunk Index:", chunk.chunk_index);
  //   console.log("Section Header:", chunk.section_header);

  //   console.log("Content:");
  //   console.log(chunk.content);

  //   console.log("=====================================\n");
  // });

  if (chunks.length === 0) {
    throw new Error("No text chunks could be extracted from the HTML content.");
  }

  // 3. Generate embeddings
  //debugging gemini api key error
  console.log(`Gemini Api Key : ${env.GEMINI_API_KEY}`);
  const chunksWithEmbeddings = await generateEmbeddings(chunks, env.GEMINI_API_KEY);


  // 4. Save to DB
  const documentId = await upsertToDatabase(documentName, chunksWithEmbeddings);

  // 5. Direct call to Python classification service for DeBERTa model
  try {
    const pythonBackendUrl = (env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000")
      .replace("localhost", "127.0.0.1")
      .trim();
    const classifyUrl = `${pythonBackendUrl}/api/classify`;

    console.log(`[Pipeline Service] Invoking Python classification model directly at: ${classifyUrl}`);

    const payloadChunks = chunks.map((c) => {
      const sanitizedContent = (c.content || "")
        .replace(/\r/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        .trim();
      return {
        content: sanitizedContent,
        chunk_index: c.chunk_index
      };
    });

    const response = await fetch(classifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chunks: payloadChunks,
        threshold: 0.01
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python server returned status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    const classifications = responseData.classifications || [];

    if (classifications.length > 0) {
      console.log(`[Pipeline Service] Received ${classifications.length} classified chunks from Python FastAPI.`);
      
      const CATEGORY_METADATA = {
        "Non-Compete": { risk: "High", explanation: "A non-compete clause was found. This restricts your ability to engage in competing business activities.", suggestion: "Narrow scope." },
        "Exclusivity": { risk: "High", explanation: "An exclusivity clause was found. This prevents you from working with other clients or vendors.", suggestion: "Limit scope." },
        "Uncapped Liability": { risk: "High", explanation: "Uncapped liability exposes your company to unlimited financial claims in the event of a breach.", suggestion: "Add a cap." },
        "No-Solicit Of Customers": { risk: "Medium", explanation: "A customer non-solicitation clause restricts you from soliciting the other party's clients.", suggestion: "Limit to direct solicitation." },
        "No-Solicit Of Employees": { risk: "Medium", explanation: "An employee non-solicitation clause restricts you from hiring the other party's team members.", suggestion: "Ensure it is mutual." },
        "Liquidated Damages": { risk: "Medium", explanation: "Liquidated damages require a pre-determined payment in case of a breach.", suggestion: "Negotiate compensatory damages." },
        "Termination For Convenience": { risk: "Medium", explanation: "One or both parties can terminate the agreement without cause.", suggestion: "Ensure notice is sufficient." },
        "Cap On Liability": { risk: "Medium", explanation: "A cap on liability was found. It restricts the damages you can recover from the other party.", suggestion: "Ensure mutual and high enough." },
        "Warranty Duration": { risk: "Low", explanation: "Specifies the duration and terms of the product/service warranty.", suggestion: "Confirm standard period." },
        "Insurance": { risk: "Low", explanation: "Specifies the required insurance coverage types and limits.", suggestion: "Verify coverage alignment." },
        "Governing Law": { risk: "Low", explanation: "Defines the legal jurisdiction that will govern the contract.", suggestion: "Ensure agreeable jurisdiction." },
        "Parties": { risk: "Low", explanation: "Identifies the contracting entities.", suggestion: "Check registrations." },
        "Agreement Date": { risk: "Low", explanation: "The execution date of the agreement.", suggestion: "Verify details." },
        "Effective Date": { risk: "Low", explanation: "The date when the rights and obligations under the contract take effect.", suggestion: "Check date." },
        "Expiration Date": { risk: "Low", explanation: "The date when the contract is scheduled to expire.", suggestion: "Set reminders." },
        "Renewal Term": { risk: "Low", explanation: "Specifies renewal conditions.", suggestion: "Ensure cancellation notice." },
        "Notice Period To Terminate Renewal": { risk: "Low", explanation: "Specifies the notice period required to prevent automatic renewal.", suggestion: "Diarize notice date." },
        "default": { risk: "Low", explanation: "Clause identified by AI model.", suggestion: "Review standard terms." }
      };

      const findingsToInsert = [];
      for (const item of classifications) {
        for (const rawFinding of item.findings) {
          const category = rawFinding.category;
          const meta = CATEGORY_METADATA[category] || CATEGORY_METADATA["default"];

          findingsToInsert.push({
            document_id: documentId,
            category: category,
            answer: rawFinding.answer,
            risk: meta.risk,
            explanation: meta.explanation,
            suggestion: meta.suggestion,
            confidence_score: Math.round(rawFinding.score * 100)
          });
        }
      }

      // Always add the SYSTEM_STATUS cache marker row when caching ingestion classifications
      findingsToInsert.push({
        document_id: documentId,
        category: "SYSTEM_STATUS",
        answer: "CLASSIFICATION_COMPLETED",
        risk: "Low",
        explanation: "System cache marker indicating document has been classified.",
        suggestion: "",
        confidence_score: 100
      });

      console.log(`[Pipeline Service] Inserting ${findingsToInsert.length} classifications to Supabase (including status marker)...`);
      const { error: insertError } = await supabase
        .from("document_classifications")
        .insert(findingsToInsert);

      if (insertError) {
        console.error("[Pipeline Service Error] Failed to store findings in Supabase:", insertError.message);
      } else {
        console.log("[Pipeline Service] Classifications successfully stored in Supabase.");
      }
    }
  } catch (error) {
    console.error("[Pipeline Service Error] Python model classification failed during ingestion:", error.message);
  }

  return {
    documentId,
    chunkCount: chunksWithEmbeddings.length,
  };
}

/**
 * Service to perform similarity search query by embedding the search text and executing the DB RPC.
 * 
 * @param {string} queryText - User's search query.
 * @param {number} [matchThreshold=0.3] - Minimum cosine similarity threshold.
 * @param {number} [matchCount=5] - Maximum matches to return.
 * @returns {Promise<Array>} - Matched chunks with similarity scores.
 */
export async function searchLegalChunks(queryText, matchThreshold = 0.3, matchCount = 5) {
  if (!queryText) {
    throw new Error("Search query text is required.");
  }

  console.log(`[Pipeline Service] Generating embedding for query: "${queryText}"`);

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    throw new Error("Invalid or missing GEMINI_API_KEY environment variable.");
  }

  let queryEmbedding;

  if (env.GEMINI_API_KEY === "mock_key") {
    console.log(`[Pipeline Service] Mock key detected. Bypassing Gemini API and generating mock query vector.`);
    queryEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
  } else {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: queryText,
      config: {
        taskType: "RETRIEVAL_QUERY"
      }
    });

    console.dir(response, { depth: null });

    if (
      !response ||
      !response.embeddings ||
      response.embeddings.length === 0 ||
      !response.embeddings[0].values
    ) {
      throw new Error("Failed to generate embedding for query search.");
    }

    queryEmbedding = response.embeddings[0].values;
  }

  console.log(`[Pipeline Service] Executing similarity search RPC: match_legal_chunks`);
  console.log("Query embedding length:", queryEmbedding.length);
  console.log("First 5 values:", queryEmbedding.slice(0, 5));
  console.log("Threshold:", matchThreshold);
  console.log("Limit:", matchCount);

  const { data: results, error } = await supabase.rpc("match_legal_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  console.log("RPC Error:", error);
  console.log("RPC Results:", results);

  if (error) {
    throw new Error(`Database search RPC failure: ${error.message}`);
  }

  // Filter results by threshold and sort by descending similarity
  const filteredResults = (results || [])
    .filter((result) => result.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);

  return filteredResults;
}
