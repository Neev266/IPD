import os
import torch
import time
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
from app.core.config import settings

# 41 CUAD categories mapped to their official question formulations
CUAD_QUESTIONS = {
    "Document Name": "Highlight the parts of the agreement that define the document name.",
    "Parties": "Highlight the parts of the agreement that define the parties.",
    "Agreement Date": "Highlight the parts of the agreement that define the date of the agreement.",
    "Effective Date": "Highlight the parts of the agreement that define the effective date of the agreement.",
    "Expiration Date": "Highlight the parts of the agreement that define the expiration date of the agreement.",
    "Renewal Term": "Highlight the parts of the agreement that define the renewal term.",
    "Notice Period To Terminate Renewal": "Highlight the parts of the agreement that define the notice period to terminate renewal.",
    "Governing Law": "Highlight the parts of the agreement that define the governing law.",
    "Most Favored Nation": "Highlight the parts of the agreement that define most favored nation.",
    "Non-Compete": "Highlight the parts of the agreement that define non-compete.",
    "Exclusivity": "Highlight the parts of the agreement that define exclusivity.",
    "No-Solicit Of Customers": "Highlight the parts of the agreement that define no-solicit of customers.",
    "Competitive Restriction Exception": "Highlight the parts of the agreement that define competitive restriction exception.",
    "No-Solicit Of Employees": "Highlight the parts of the agreement that define no-solicit of employees.",
    "Non-Disparagement": "Highlight the parts of the agreement that define non-disparagement.",
    "Termination For Convenience": "Highlight the parts of the agreement that define termination for convenience.",
    "Rofr/Rofo/Rofn": "Highlight the parts of the agreement that define ROFR, ROFO, or ROFN.",
    "Change Of Control": "Highlight the parts of the agreement that define change of control.",
    "Anti-Assignment": "Highlight the parts of the agreement that define anti-assignment.",
    "Revenue/Profit Sharing": "Highlight the parts of the agreement that define revenue/profit sharing.",
    "Price Restrictions": "Highlight the parts of the agreement that define price restrictions.",
    "Minimum Commitment": "Highlight the parts of the agreement that define minimum commitment.",
    "Volume Restriction": "Highlight the parts of the agreement that define volume restriction.",
    "Ip Ownership Assignment": "Highlight the parts of the agreement that define intellectual property ownership assignment.",
    "Joint Ip Ownership": "Highlight the parts of the agreement that define joint intellectual property ownership.",
    "License Grant": "Highlight the parts of the agreement that define license grant.",
    "Non-Transferable License": "Highlight the parts of the agreement that define non-transferable license.",
    "Affiliate License-Licensor": "Highlight the parts of the agreement that define affiliate license to licensor.",
    "Affiliate License-Licensee": "Highlight the parts of the agreement that define affiliate license to licensee.",
    "Unlimited/All-You-Can-Eat-License": "Highlight the parts of the agreement that define unlimited or all-you-can-eat license.",
    "Irrevocable Or Perpetual License": "Highlight the parts of the agreement that define irrevocable or perpetual license.",
    "Source Code Escrow": "Highlight the parts of the agreement that define source code escrow.",
    "Post-Termination Services": "Highlight the parts of the agreement that define post-termination services.",
    "Audit Rights": "Highlight the parts of the agreement that define audit rights.",
    "Uncapped Liability": "Highlight the parts of the agreement that define uncapped liability.",
    "Cap On Liability": "Highlight the parts of the agreement that define cap on liability.",
    "Liquidated Damages": "Highlight the parts of the agreement that define liquidated damages.",
    "Warranty Duration": "Highlight the parts of the agreement that define warranty duration.",
    "Insurance": "Highlight the parts of the agreement that define insurance.",
    "Covenant Not To Sue": "Highlight the parts of the agreement that define covenant not to sue.",
    "Third Party Beneficiary": "Highlight the parts of the agreement that define third party beneficiary."
}

class ClassificationService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Apply global TF32 configurations for modern GPUs (RTX 4050, etc.)
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True

    def load_model(self):
        """Loads model and tokenizer into memory if not already loaded."""
        if self.model is None or self.tokenizer is None:
            model_path = settings.MODEL_PATH
            if not os.path.exists(model_path):
                raise FileNotFoundError(
                    f"Model path '{model_path}' does not exist. Please check your configuration."
                )

            print(f"[Model Load] Starting model load from: {model_path} on device: {self.device}")
            start_time = time.time()
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)
            
            # Load model with float16 on GPU, float32 on CPU
            if self.device.type == "cuda":
                self.model = AutoModelForQuestionAnswering.from_pretrained(
                    model_path, 
                    torch_dtype=torch.float16
                )
            else:
                self.model = AutoModelForQuestionAnswering.from_pretrained(model_path)
                
            self.model.to(self.device)
            self.model.eval()
            
            load_duration = time.time() - start_time
            print(f"[Model Load] Tokenizer and QA model loaded successfully in {load_duration:.2f} seconds.")

    def classify_chunks(self, chunks, categories=None, threshold=0.01):
        """
        Parses a list of chunks, forms a global question-context list,
        runs optimized tokenizer-batched inference, and returns findings.
        """
        total_start_time = time.time()
        
        # Load the model if not already in memory
        self.load_model()

        # Default to all 41 categories if none specified
        if not categories:
            categories = list(CUAD_QUESTIONS.keys())

        # Initialize output dictionary mapped by chunk_index to retain order
        results_map = {}
        flat_inputs = []

        # 1. Clean content and populate results map
        for chunk in chunks:
            content = chunk.get("content", "")
            chunk_index = chunk.get("chunk_index", 0)

            # Clean and sanitize the string content exactly like original
            cleaned_content = content.replace("\r", "")
            cleaned_content = "".join(
                c if (ord(c) >= 32 or c in "\n\t") else " " 
                for c in cleaned_content
            )
            cleaned_content = "\n".join(
                " ".join(line.split()) 
                for line in cleaned_content.split("\n")
            ).strip()

            results_map[chunk_index] = {
                "chunk_index": chunk_index,
                "content": cleaned_content,
                "findings": []
            }

            if not cleaned_content:
                continue

            # Build global list of (question, context) pairs
            for cat in categories:
                if cat in CUAD_QUESTIONS:
                    flat_inputs.append({
                        "chunk_index": chunk_index,
                        "category": cat,
                        "question": CUAD_QUESTIONS[cat],
                        "context": cleaned_content
                    })

        # Return empty findings immediately if there is nothing to classify
        if not flat_inputs:
            return list(results_map.values())

        # Determine batch size dynamically based on device
        batch_size = 64 if self.device.type == "cuda" else 8
        print(f"[Classifier] Starting batch processing for {len(flat_inputs)} queries. Batch size: {batch_size}")

        tokenizer_time = 0.0
        inference_time = 0.0

        # 2. Process flat inputs in batches
        for start_idx in range(0, len(flat_inputs), batch_size):
            batch = flat_inputs[start_idx : start_idx + batch_size]
            questions = [item["question"] for item in batch]
            contexts = [item["context"] for item in batch]

            # Tokenize batch
            t_start = time.time()
            encoding = self.tokenizer(
                questions,
                contexts,
                padding=True,
                truncation="only_second",
                max_length=512,
                return_offsets_mapping=True,
                return_tensors="pt"
            )
            tokenizer_time += time.time() - t_start

            # Move tensors to GPU
            input_ids = encoding["input_ids"].to(self.device)
            attention_mask = encoding["attention_mask"].to(self.device)
            token_type_ids = encoding.get("token_type_ids")
            if token_type_ids is not None:
                token_type_ids = token_type_ids.to(self.device)

            # Model Forward Pass
            i_start = time.time()
            with torch.inference_mode():
                if token_type_ids is not None:
                    outputs = self.model(
                        input_ids=input_ids, 
                        attention_mask=attention_mask, 
                        token_type_ids=token_type_ids
                    )
                else:
                    outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            inference_time += time.time() - i_start

            # Keep tensors on GPU until softmax, then move to CPU for manual decoding
            start_probs = torch.softmax(outputs.start_logits, dim=-1).cpu()
            end_probs = torch.softmax(outputs.end_logits, dim=-1).cpu()
            input_ids_cpu = input_ids.cpu()

            # 3. Decode findings manually
            for i in range(len(batch)):
                item = batch[i]
                context = item["context"]
                ids = input_ids_cpu[i].tolist()
                
                # Decoding path
                try:
                    seq_ids = encoding.sequence_ids(i)
                    offsets = encoding["offset_mapping"][i]
                    if seq_ids is None or offsets is None:
                        raise ValueError("No sequence IDs or offsets")

                    seq_len = len(seq_ids)
                    best_score = -1.0
                    best_span = (0, 0)

                    # Scan valid spans (seq_ids == 1 corresponds to context tokens)
                    for start_idx_tok in range(seq_len):
                        if seq_ids[start_idx_tok] != 1:
                            continue
                        for end_idx_tok in range(start_idx_tok, min(start_idx_tok + 30, seq_len)):
                            if seq_ids[end_idx_tok] != 1:
                                continue
                            score = float(start_probs[i][start_idx_tok] * end_probs[i][end_idx_tok])
                            if score > best_score:
                                best_score = score
                                best_span = (start_idx_tok, end_idx_tok)

                    start_char = int(offsets[best_span[0]][0])
                    end_char = int(offsets[best_span[1]][1])
                    answer = context[start_char:end_char].strip()

                except Exception:
                    # Robust fallback for slow tokenizers or unexpected token index structures
                    sep_token_id = self.tokenizer.sep_token_id
                    sep_indices = [idx for idx, token_id in enumerate(ids) if token_id == sep_token_id]

                    if len(sep_indices) >= 1:
                        start_context_idx = sep_indices[0] + 1
                        end_context_idx = sep_indices[1] if len(sep_indices) > 1 else len(ids)
                    else:
                        start_context_idx = 0
                        end_context_idx = len(ids)

                    best_score = -1.0
                    best_span = (0, 0)
                    for start_idx_tok in range(start_context_idx, end_context_idx):
                        for end_idx_tok in range(start_idx_tok, min(start_idx_tok + 30, end_context_idx)):
                            score = float(start_probs[i][start_idx_tok] * end_probs[i][end_idx_tok])
                            if score > best_score:
                                best_score = score
                                best_span = (start_idx_tok, end_idx_tok)

                    answer_ids = ids[best_span[0] : best_span[1] + 1]
                    answer = self.tokenizer.decode(answer_ids).strip()
                    
                    # Clean special tokens
                    if self.tokenizer.pad_token in answer:
                        answer = answer.replace(self.tokenizer.pad_token, "")
                    if self.tokenizer.sep_token in answer:
                        answer = answer.replace(self.tokenizer.sep_token, "")
                    answer = answer.strip()

                    start_char = context.find(answer)
                    if start_char != -1:
                        end_char = start_char + len(answer)
                    else:
                        start_char = 0
                        end_char = 0

                # Clean whitespaces in answer
                answer_cleaned = " ".join(answer.split())

                if best_score >= threshold and len(answer_cleaned) > 0:
                    results_map[item["chunk_index"]]["findings"].append({
                        "category": item["category"],
                        "answer": answer_cleaned,
                        "score": round(float(best_score), 4),
                        "start": start_char,
                        "end": end_char
                    })

        total_time = time.time() - total_start_time
        print(f"[Timing] Tokenizer time: {tokenizer_time:.2f}s")
        print(f"[Timing] Inference time: {inference_time:.2f}s")
        print(f"[Timing] Total classification time: {total_time:.2f}s")

        return list(results_map.values())

classification_service = ClassificationService()
