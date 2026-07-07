import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseHTMLToSections,
  chunkSections,
  upsertToDatabase,
  ingestLegalHTML,
} from "./parser.js";
import { supabase } from "./src/config/supabase.js";
import { env } from "./src/config/env.js";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Representative mock legal HTML document to verify features
const mockHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Legal Agreement</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
    h1 { font-size: 24px; color: #111; }
    h2 { font-size: 18px; color: #222; }
    p { line-height: 1.5; margin-bottom: 10px; }
  </style>
</head>
<body>
  <!-- Should be stripped entirely by Cheerio -->
  <nav>
    <a href="#section1">Definition</a> | 
    <a href="#section2">Obligations</a> | 
    <a href="#section3">Remedies</a>
  </nav>

  <h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1>
  <p>This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of July 7, 2026, by and between Company A and Company B to protect proprietary information.</p>

  <h2>1. DEFINITION OF CONFIDENTIAL INFORMATION</h2>
  <p>For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Information is in written form, the Disclosing Party shall label or stamp the materials with the word "Confidential" or some similar warning. Confidential Information includes:</p>
  <ul>
    <li>Technical drawings, designs, product specifications, source code, and database schemas.</li>
    <li>Customer data, pricing indices, and strategic marketing programs.</li>
  </ul>

  <h2>2. OBLIGATIONS OF RECEIVING PARTY</h2>
  <p>The Receiving Party shall limit disclosure of Confidential Information within its own organization to its directors, officers, partners, and employees on a strictly need-to-know basis. Specifically, the Receiving Party agrees:</p>
  <ol>
    <li>To hold Confidential Information in the strictest confidence.</li>
    <li>To use the information solely for the evaluation of a potential business relationship.</li>
    <li>Not to reverse engineer or decompile any software shared under this Agreement.</li>
  </ol>

  <h2>3. REMEDIES FOR BREACH</h2>
  <p>The Receiving Party acknowledges that any violation of this Agreement would cause immediate and irreparable harm to the Disclosing Party. Standard remedies apply based on the severity of the breach:</p>
  <table>
    <thead>
      <tr>
        <th>Violation Tier</th>
        <th>Remedy Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Negligent Disclosure</td>
        <td>15-day cure period and security compliance review.</td>
      </tr>
      <tr>
        <td>Intentional Breach</td>
        <td>Immediate injunctive relief, contract termination, and damages.</td>
      </tr>
    </tbody>
  </table>

  <!-- Should be stripped entirely by Cheerio -->
  <footer>
    CONFIDENTIAL - PROPERTY OF BOTH COMPANIES - &copy; 2026.
  </footer>
</body>
</html>
`;

async function runTest() {
  const mockFilePath = path.join(__dirname, "mock_legal_doc.html");
  fs.writeFileSync(mockFilePath, mockHtmlContent, "utf-8");
  console.log(`[Test Setup] Created mock HTML document: ${mockFilePath}`);

  const documentName = "Test Mutual Non-Disclosure Agreement 2026";

  try {
    const hasValidApiKey = env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your_gemini_api_key_here";

    let result;
    if (hasValidApiKey) {
      console.log("\n[Test Mode] Real Gemini API key detected. Running full ingestLegalHTML pipeline...");
      result = await ingestLegalHTML(mockFilePath, documentName);
    } else {
      console.log("\n[Test Mode] No valid GEMINI_API_KEY found in .env. Running pipeline in MOCK EMBEDDING MODE...");

      console.log(`[Read] Loading file from path: ${mockFilePath}`);
      const content = fs.readFileSync(mockFilePath, "utf-8");

      console.log(`[Parsing] Extracting section landmarks and content blocks...`);
      const sections = parseHTMLToSections(content);
      console.log(`[Parsing] Sections found:`, sections.map(s => s.header || "[No Header]"));

      console.log(`[Chunking] Splitting text blocks with RecursiveCharacterTextSplitter...`);
      const chunks = await chunkSections(sections);
      console.log(`[Chunking] Total chunks produced: ${chunks.length}`);

      console.log(`[Embedding] Injected 768-dimension mock float vectors (simulating gemini-embedding-001 dimensions)...`);
      const chunksWithMockEmbeddings = chunks.map((chunk) => {
        // Generate random vector of dimension 768
        const mockVector = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
        return {
          ...chunk,
          embedding: mockVector,
        };
      });

      console.log(`[Database] Upserting document to Supabase...`);
      const documentId = await upsertToDatabase(documentName, chunksWithMockEmbeddings);
      result = {
        documentId,
        chunkCount: chunksWithMockEmbeddings.length,
        chunks: chunksWithMockEmbeddings,
      };
    }

    console.log("\n[Test Verification] Testing cosine similarity search RPC match_legal_chunks...");

    // Create a query embedding vector
    let queryEmbedding;
    if (hasValidApiKey) {
      console.log("Generating actual embedding for query text: 'What is the remedy for intentional breach?'");
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: "What is the remedy for intentional breach?",
      });
      queryEmbedding = response.embedding.values;
    } else {
      console.log("Generating mock query vector...");
      queryEmbedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    }

    console.log("Calling public.match_legal_chunks RPC...");
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "match_legal_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: hasValidApiKey ? 0.3 : 0.001, // Low threshold for mock matches
        match_count: 3,
      }
    );

    if (searchError) {
      console.error(`[Test Verification Error] match_legal_chunks RPC failed: ${searchError.message}`);
    } else {
      console.log(`[Test Verification Success] RPC search matched ${searchResults.length} chunks:`);
      searchResults.forEach((res, i) => {
        console.log(`\nMatch #${i + 1} (Score: ${res.similarity.toFixed(4)}):`);
        console.log(`- Header: ${res.section_header || "[None]"}`);
        console.log(`- Snippet: ${res.content.substring(0, 150)}...`);
      });
    }

  } catch (error) {
    console.error("\n[Test Failure] Pipe test failed:", error);
  } finally {
    if (fs.existsSync(mockFilePath)) {
      fs.unlinkSync(mockFilePath);
      console.log(`\n[Test Cleanup] Deleted mock HTML document: ${mockFilePath}`);
    }
  }
}

runTest();
