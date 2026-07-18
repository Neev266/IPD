from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.classification_service import classification_service

router = APIRouter()

class ChunkInput(BaseModel):
    content: str
    chunk_index: int

class ClassifyRequest(BaseModel):
    chunks: List[ChunkInput]
    categories: Optional[List[str]] = None
    threshold: Optional[float] = 0.01

class Finding(BaseModel):
    category: str
    answer: str
    score: float
    start: int
    end: int

class ChunkClassificationResult(BaseModel):
    chunk_index: int
    content: str
    findings: List[Finding]

class ClassifyResponse(BaseModel):
    classifications: List[ChunkClassificationResult]

@router.post("/classify", response_model=ClassifyResponse)
async def classify_chunks(request: ClassifyRequest):
    try:
        # Convert chunks list to simple dicts for the service layer
        chunks_data = [
            {"content": chunk.content, "chunk_index": chunk.chunk_index} 
            for chunk in request.chunks
        ]
        
        results = classification_service.classify_chunks(
            chunks=chunks_data,
            categories=request.categories,
            threshold=request.threshold
        )
        return {"classifications": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
