import json
from app.services.classification_service import classification_service

text = """said firm and the partners of the said firm from time to time and their survivor/s and the heirs, executors and administrators of the last surviving partner) of the FIRST PART;

AND

M/S. ACORP, a partnership firm registered under the provisions of the Indian Partnership Act, 1932 with the Registrar of Firms, Mumbai (Maharashtra) under number [_____________]; and having its principal place of business at A/323 Virwani Industrial Estate, Western Express Highway, Goregaon (East), Mumbai – 400 063, hereinafter referred to as “the Developer” (which expression shall, unless it be repugnant to the context or meaning thereof, be deemed to mean and include the present partners of the said firm and the partners of the said firm from time to time and their survivor/s and the heirs, executors, administrators and assigns of the last surviving partner) of the SECOND PART;

AND"""

chunks = [{"content": text, "chunk_index": 0}]

print("Running classification...")
try:
    results = classification_service.classify_chunks(chunks, threshold=0.0001)
    print("Classification completed successfully.")
    print("Results:")
    print(json.dumps(results, indent=2))
except Exception as e:
    print(f"Error during classification: {e}")
