import fs from "fs";
import path from "path";
import { parseHTMLToSections, chunkSections } from "./src/utils/html_parser.js";
import { generateEmbeddings } from "./src/services/embedding_service.js";
import { upsertToDatabase } from "./src/services/document_service.js";
import { env } from "./src/config/env.js";

// Re-export for modular usage & backwards compatibility (e.g. test_parser.js)
export { parseHTMLToSections, chunkSections } from "./src/utils/html_parser.js";
export { generateEmbeddings } from "./src/services/embedding_service.js";
export { upsertToDatabase } from "./src/services/document_service.js";

/**
 * MASTER INGESTION FUNCTION
 * Executes the pipeline in serial states:
 * 1. File existence validation and loading.
 * 2. HTML DOM parsing, heading tracking, and structural block isolation.
 * 3. Recursive chunking using RecursiveCharacterTextSplitter.
 * 4. Embedding generation with delay rate limiting and automatic retry.
 * 5. Database upserting with cascading deletion to avoid duplicate entries.
 * 
 * @param {string} filePath - Absolute or relative path to the legal HTML document.
 * @param {string} documentName - Unique identifier name for the document in database.
 * @returns {Promise<{documentId: string, chunkCount: number}>}
 */
export async function ingestLegalHTML(filePath, documentName) {
  console.log(`\n=== Starting Ingestion Pipeline ===`);
  console.log(`File Path: ${filePath}`);
  console.log(`Document Name: ${documentName}`);

  // 1. Assert input file exists. Read file string.
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file does not exist at resolved path: ${resolvedPath}`);
  }

  const htmlContent = fs.readFileSync(resolvedPath, "utf-8");
  console.log(`[Read] Loaded ${htmlContent.length} characters of HTML content.`);

  // 2. Extract, section-tag and chunk HTML content.
  console.log(`[Parsing] Extracting section landmarks and content blocks...`);
  const sections = parseHTMLToSections(htmlContent);
  console.log(`[Parsing] Identified ${sections.length} semantic sections.`);

  console.log(`[Chunking] Chunking sections with RecursiveCharacterTextSplitter...`);
  const chunks = await chunkSections(sections);
  console.log(`[Chunking] Split into ${chunks.length} total chunks.`);

  if (chunks.length === 0) {
    throw new Error("No content chunks generated. Aborting ingestion.");
  }

  // 3. Process chunk conversions inside asynchronous batch loop.
  console.log(`[Embedding] Starting embedding generation...`);
  const chunksWithEmbeddings = await generateEmbeddings(chunks, env.GEMINI_API_KEY);
  console.log(`[Embedding] Generated embeddings for all chunks.`);

  // 4. Wrap database insertion in a bulk transaction batch block.
  console.log(`[Database] Saving records...`);
  const documentId = await upsertToDatabase(documentName, chunksWithEmbeddings);

  console.log(`=== Ingestion Pipeline Completed Successfully ===\n`);
  return {
    documentId,
    chunkCount: chunksWithEmbeddings.length,
  };
}
