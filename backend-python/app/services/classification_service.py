import os
import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline
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
        self.pipeline = None

    def load_model(self):
        """Loads model and tokenizer into memory if not already loaded."""
        if self.pipeline is None:
            model_path = settings.MODEL_PATH
            if not os.path.exists(model_path):
                raise FileNotFoundError(
                    f"Model path '{model_path}' does not exist. "
                    f"Please check your path configuration."
                )

            print(f"Loading tokenizer and QA model from '{model_path}'...")
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForQuestionAnswering.from_pretrained(model_path)
            
            # Determine PyTorch device
            device = 0 if torch.cuda.is_available() else -1
            
            self.pipeline = pipeline(
                "question-answering",
                model=model,
                tokenizer=tokenizer,
                device=device,
                batch_size=16  # run in parallel batches for efficiency
            )
            print("Model and tokenizer loaded successfully.")

    def classify_chunks(self, chunks, categories=None, threshold=0.01):
        """
        Parses a list of chunks through the QA model to find relevant clauses.
        Returns a list of classifications per chunk.
        """
        self.load_model()

        # Default to all 41 categories if none specified
        if not categories:
            categories = list(CUAD_QUESTIONS.keys())

        results = []

        for chunk in chunks:
            content = chunk.get("content", "")
            chunk_index = chunk.get("chunk_index", 0)

            # Clean and sanitize the string content
            # 1. Remove carriage returns
            cleaned_content = content.replace("\r", "")
            # 2. Strip non-printable control characters (ASCII < 32 except newline/tab)
            cleaned_content = "".join(
                c if (ord(c) >= 32 or c in "\n\t") else " " 
                for c in cleaned_content
            )
            # 3. Normalize whitespace on each line, maintaining paragraph structure
            cleaned_content = "\n".join(
                " ".join(line.split()) 
                for line in cleaned_content.split("\n")
            ).strip()

            if not cleaned_content:
                results.append({
                    "chunk_index": chunk_index,
                    "content": content,
                    "findings": []
                })
                continue

            # Build QA pipeline inputs for this chunk
            inputs = []
            valid_categories = []
            for cat in categories:
                if cat in CUAD_QUESTIONS:
                    inputs.append({
                        "question": CUAD_QUESTIONS[cat],
                        "context": cleaned_content
                    })
                    valid_categories.append(cat)

            if not inputs:
                results.append({
                    "chunk_index": chunk_index,
                    "content": content,
                    "findings": []
                })
                continue

            # Run pipeline in batch mode
            qa_results = self.pipeline(inputs)

            if isinstance(qa_results, dict):
                qa_results = [qa_results]

            # Filter results by score and non-empty answers
            findings = []
            for cat, qa_res in zip(valid_categories, qa_results):
                score = qa_res.get("score", 0.0)
                answer = qa_res.get("answer", "").strip()

                # Clean clean carriage returns and double spaces
                answer = " ".join(answer.split())

                if score >= threshold and len(answer) > 0:
                    findings.append({
                        "category": cat,
                        "answer": answer,
                        "score": float(score),
                        "start": int(qa_res.get("start", 0)),
                        "end": int(qa_res.get("end", 0))
                    })

            results.append({
                "chunk_index": chunk_index,
                "content": cleaned_content,
                "findings": findings
            })

        return results

classification_service = ClassificationService()
