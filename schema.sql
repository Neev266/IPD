-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Parent table
CREATE TABLE public.documents (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   document_name TEXT UNIQUE NOT NULL,
   created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child table
CREATE TABLE public.legal_chunks (
   id BIGSERIAL PRIMARY KEY,
   document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
   content TEXT NOT NULL,
   section_header TEXT,
   chunk_index INT NOT NULL,
   embedding VECTOR(3072) NOT NULL
);


-- Similarity Search RPC
CREATE OR REPLACE FUNCTION public.match_legal_chunks(
   query_embedding VECTOR(3072),
   match_threshold FLOAT DEFAULT 0.3,
   match_count INT DEFAULT 5
)
RETURNS TABLE (
   id BIGINT,
   document_id UUID,
   content TEXT,
   section_header TEXT,
   similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
   RETURN QUERY
   SELECT
       lc.id,
       lc.document_id,
       lc.content,
       lc.section_header,
       (1 - (lc.embedding <=> query_embedding))::FLOAT AS similarity
   FROM public.legal_chunks lc
   WHERE (1 - (lc.embedding <=> query_embedding)) > match_threshold
   ORDER BY lc.embedding <=> query_embedding
   LIMIT match_count;
END;
$$;
