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
