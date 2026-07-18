import requests
import time
import json

payload = {
  "chunks": [
    {
      "content": "This agreement is concluded on July 8, 2026, between Loha Company Ltd and Shenzhen LOHAS Supply Chain Management Co., Ltd. It shall be governed by the laws of the People's Republic of China. The contract is valid for 5 years.",
      "chunk_index": 0
    }
  ],
  "threshold": 0.05
}

print("Sending request to http://127.0.0.1:8000/api/classify...")
start = time.time()
try:
    r = requests.post("http://127.0.0.1:8000/api/classify", json=payload, timeout=60)
    print(f"Status: {r.status_code}")
    print(f"Response:")
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
print(f"Completed in {time.time() - start:.2f} seconds.")
