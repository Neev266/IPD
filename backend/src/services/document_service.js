import { supabase } from "../config/supabase.js";

/**
 * Checks if the document already exists, executes a cascading delete if so,
 * then inserts the document and bulk-inserts the chunks with embeddings.
 * 
 * @param {string} documentName - Name of the document.
 * @param {Array} chunksWithEmbeddings - Chunks with generated embedding float arrays.
 * @returns {Promise<string>} - The newly created document UUID.
 */
export async function upsertToDatabase(documentName, chunksWithEmbeddings) {
  console.log(`[Document Service] Querying documents for existing document: "${documentName}"`);

  // Check if document already exists
  const { data: existingDoc, error: checkError } = await supabase
    .from("documents")
    .select("id")
    .eq("document_name", documentName)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Database check error: ${checkError.message}`);
  }

  if (existingDoc) {
    console.log(`[Document Service] Document already exists with ID: ${existingDoc.id}. Deleting records (cascade)...`);
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", existingDoc.id);

    if (deleteError) {
      throw new Error(`Database delete error: ${deleteError.message}`);
    }
  }

  // Insert the new parent document
  console.log(`[Document Service] Inserting new document: "${documentName}"`);
  const { data: newDoc, error: insertDocError } = await supabase
    .from("documents")
    .insert({ document_name: documentName })
    .select("id")
    .single();

  if (insertDocError) {
    throw new Error(`Database insert document error: ${insertDocError.message}`);
  }

  const documentId = newDoc.id;
  console.log(`[Document Service] New document created with ID: ${documentId}`);

  // Format chunks for insertion and clean text format
  const chunksToInsert = chunksWithEmbeddings.map((c) => {
    const cleanContent = (c.content || "")
      .replace(/\r/g, "") // remove carriage returns
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ") // remove control characters
      .split("\n")
      .map(line => line.trim().replace(/\s+/g, " ")) // trim and normalize line spaces
      .filter(line => line.length > 0) // remove empty lines
      .join("\n");

    return {
      document_id: documentId,
      content: cleanContent,
      section_header: c.section_header,
      chunk_index: c.chunk_index,
      embedding: c.embedding, // Primitive float array accepted natively by pgvector
    };
  });


  // Perform bulk insertion in batches of 100 to optimize bandwidth and avoid database limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
    const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
    console.log(`[Document Service] Inserting chunks batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunksToInsert.length / BATCH_SIZE)}...`);
    const { error: insertChunksError } = await supabase
      .from("legal_chunks")
      .insert(batch);

    if (insertChunksError) {
      throw new Error(`Database chunks insert error: ${insertChunksError.message}`);
    }
  }

  console.log(`[Document Service] Successfully upserted document and ${chunksToInsert.length} chunks.`);
  return documentId;
}
