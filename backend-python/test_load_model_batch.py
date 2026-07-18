import os
import time
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline

model_path = "./deberta-v2-xlarge/deberta-v2-xlarge"

print("Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForQuestionAnswering.from_pretrained(model_path)

print("Creating QA pipeline...")
# Let's pass a batch_size to the pipeline
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer, batch_size=8)

context = "This agreement is concluded on July 8, 2026, between Loha Company Ltd (the Buyer) and Shenzhen LOHAS Supply Chain Management Co., Ltd. (the Seller). It shall be governed by the laws of the People's Republic of China. The contract is valid for 5 years."

questions = [
    "Highlight the parts of the agreement that define the document name.",
    "Highlight the parts of the agreement that define the parties.",
    "Highlight the parts of the agreement that define the date of the agreement.",
    "Highlight the parts of the agreement that define the effective date of the agreement.",
    "Highlight the parts of the agreement that define the expiration date of the agreement.",
    "Highlight the parts of the agreement that define the renewal term.",
    "Highlight the parts of the agreement that define the governing law.",
    "Highlight the parts of the agreement that define cap on liability."
]

inputs = [{"question": q, "context": context} for q in questions]

print("Running batched inference...")
start = time.time()
results = qa_pipeline(inputs)
duration = time.time() - start

print(f"Batched inference for {len(questions)} questions completed in {duration:.2f} seconds.")
for q, r in zip(questions, results):
    print(f"Q: {q}\nAns: {r['answer']} (Score: {r['score']:.4f})\n")
