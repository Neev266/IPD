import { GoogleGenAI } from "@google/genai";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @typedef {Object} IngestionChunk
 * @property {string} content
 * @property {string} [section_header]
 * @property {number} chunk_index
 */

/**
 * Iterates over chunks, calling Gemini gemini-embedding-001 model.
 * Handles rate limits with a 500ms delay and retries on failure with a 3000ms delay.
 * 
 * @param {IngestionChunk[]} chunks
 * @param {string} apiKey - Google Gemini API Key.
 * @returns {Promise<any[]>} - Chunks populated with raw float array embeddings.
 */
export async function generateEmbeddings(chunks, apiKey) {
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("Invalid or missing GEMINI_API_KEY environment variable.");
  }

  // Support local test mocking
  if (apiKey === "mock_key") {
    console.log(`[Embedding Service] Mock key detected. Bypassing Gemini API and generating mock 768-dimension vectors.`);
    return chunks.map((chunk) => ({
      ...chunk,
      embedding: Array.from({ length: 768 }, () => Math.random() * 2 - 1),
    }));
  }

  const ai = new GoogleGenAI({ apiKey });
  const chunksWithEmbeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[Embedding Service] Generating for chunk ${i + 1}/${chunks.length} (Index: ${chunk.chunk_index})...`);

    let attempts = 0;
    let success = false;
    let embeddingValues = null;

    while (attempts < 2 && !success) {
      try {
        const response = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: chunk.content,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: 3072
          }
        });
        console.dir(response, { depth: null });

        if (
          response &&
          response.embeddings &&
          response.embeddings.length > 0 &&
          response.embeddings[0].values
        ) {
          embeddingValues = response.embeddings[0].values;
          success = true;
        } else {
          throw new Error("Invalid API response: missing embedding.values");
        }
      } catch (error) {
        attempts++;
        console.error(
          `[Embedding Service Error] Failed at chunk index ${chunk.chunk_index} (Attempt ${attempts}/2). Error: ${error.message || error}`
        );
        if (attempts >= 2) {
          throw new Error(
            `Embedding generation failed permanently for chunk index ${chunk.chunk_index}. Error: ${error.message || error}`
          );
        }
        console.log(`[Embedding Service Retry] Sleeping for 3000ms before retrying...`);
        await sleep(3000);
      }
    }

    chunksWithEmbeddings.push({
      ...chunk,
      embedding: embeddingValues,
    });

    // Enforce 500ms sleep between consecutive requests to honor free tier limits
    if (i < chunks.length - 1) {
      await sleep(500);
    }
  }

  return chunksWithEmbeddings;
}
