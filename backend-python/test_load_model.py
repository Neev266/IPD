import os
import time
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline

model_path = "./deberta-v2-xlarge/deberta-v2-xlarge"

print("Loading tokenizer...")
start = time.time()
tokenizer = AutoTokenizer.from_pretrained(model_path)
print(f"Tokenizer loaded in {time.time() - start:.2f} seconds.")

print("Loading model...")
start = time.time()
# Load in CPU mode since CUDA is not available
model = AutoModelForQuestionAnswering.from_pretrained(model_path)
print(f"Model loaded in {time.time() - start:.2f} seconds.")

print("Creating QA pipeline...")
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

context = "This agreement is made on July 8, 2026, between Company A and Company B. It shall be governed by the laws of the State of California."
question = "What is the governing law?"

print(f"Querying model...\nContext: {context}\nQuestion: {question}")
start = time.time()
result = qa_pipeline(question=question, context=context)
print(f"Result: {result}")
print(f"Inference completed in {time.time() - start:.2f} seconds.")
