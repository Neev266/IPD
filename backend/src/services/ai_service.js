import { parseHTMLToSections, chunkSections } from "../utils/html_parser.js";
import { env } from "../config/env.js";

const CATEGORY_METADATA = {
  "Non-Compete": {
    risk: "High",
    explanation: "A non-compete clause was found. This restricts your ability to engage in competing business activities during or after the contract term.",
    suggestion: "Ensure the scope (geography and duration) is as narrow as possible, or negotiate its removal if it is not a standard industry practice."
  },
  "Exclusivity": {
    risk: "High",
    explanation: "An exclusivity clause was found. This prevents you from working with other clients or vendors in a similar capacity.",
    suggestion: "Limit exclusivity to specific project-based scope and ensure it does not apply globally to all business units."
  },
  "Uncapped Liability": {
    risk: "High",
    explanation: "Uncapped liability exposes your company to unlimited financial claims in the event of a breach of contract.",
    suggestion: "Add a liability cap, usually limited to a multiple of fees paid (e.g., 1x or 2x annual contract value)."
  },
  "No-Solicit Of Customers": {
    risk: "Medium",
    explanation: "A customer non-solicitation clause restricts you from soliciting the other party's clients.",
    suggestion: "Verify that it only applies to direct solicitation and does not prevent general public advertising or responding to independent requests."
  },
  "No-Solicit Of Employees": {
    risk: "Medium",
    explanation: "An employee non-solicitation clause restricts you from hiring the other party's team members.",
    suggestion: "Ensure this is mutual and has a reasonable time limit (typically 12 months post-termination)."
  },
  "Liquidated Damages": {
    risk: "Medium",
    explanation: "Liquidated damages require a pre-determined payment in case of a breach, regardless of actual loss.",
    suggestion: "Check if the amount is realistic and proportionate to actual potential damages; otherwise, negotiate standard compensatory damages."
  },
  "Termination For Convenience": {
    risk: "Medium",
    explanation: "One or both parties can terminate the agreement without cause. Short notice periods can cause sudden operational disruption.",
    suggestion: "Ensure the notice period is sufficient (e.g., 30-90 days) and that any outstanding costs or work-in-progress is fully paid."
  },
  "Cap On Liability": {
    risk: "Medium",
    explanation: "A cap on liability was found. It restricts the damages you can recover from the other party.",
    suggestion: "Ensure the cap is mutual, high enough to cover potential risks, and does not apply to gross negligence or willful misconduct."
  },
  "Warranty Duration": {
    risk: "Low",
    explanation: "Specifies the duration and terms of the product/service warranty.",
    suggestion: "Confirm the warranty period meets standard expectations and covers key components."
  },
  "Insurance": {
    risk: "Low",
    explanation: "Specifies the required insurance coverage types and limits.",
    suggestion: "Ensure the specified limits align with your existing insurance policies."
  },
  "Governing Law": {
    risk: "Low",
    explanation: "Defines the legal jurisdiction that will govern the contract.",
    suggestion: "Ensure the governing law jurisdiction is agreeable and convenient for dispute resolution."
  },
  "Parties": {
    risk: "Low",
    explanation: "Identifies the contracting entities.",
    suggestion: "Ensure legal names match registered corporate details."
  },
  "Agreement Date": {
    risk: "Low",
    explanation: "The execution date of the agreement.",
    suggestion: "Verify that the date matches the day the final party signs."
  },
  "Effective Date": {
    risk: "Low",
    explanation: "The date when the rights and obligations under the contract take effect.",
    suggestion: "Verify that the effective date is clearly defined and matches operational plans."
  },
  "Expiration Date": {
    risk: "Low",
    explanation: "The date when the contract is scheduled to expire.",
    suggestion: "Set up reminders 90 days before this date to plan for renewal or termination."
  },
  "Renewal Term": {
    risk: "Low",
    explanation: "Specifies renewal conditions (e.g., automatic renewal).",
    suggestion: "Ensure any automatic renewal clauses can be cancelled with reasonable notice."
  },
  "Notice Period To Terminate Renewal": {
    risk: "Low",
    explanation: "Specifies the notice period required to prevent automatic renewal.",
    suggestion: "Review and diarize this notice period to avoid unwanted automatic renewals."
  },
  "default": {
    risk: "Low",
    explanation: "Clause identified by AI model.",
    suggestion: "Review standard terms to ensure alignment with business guidelines."
  }
};

/**
 * Service to chunk a legal document, classify chunks via Python FastAPI,
 * map categories to structured risks/suggestions, and compute overall risk score.
 * 
 * @param {string} htmlContent - Raw HTML document content.
 * @returns {Promise<{riskScore: number, findings: Array}>}
 */
/**
 * Service to classify a list of pre-defined chunks via Python FastAPI,
 * map categories to structured risks/suggestions, and compute overall risk score.
 * 
 * @param {Array} chunks - Array of chunk objects with content and chunk_index.
 * @returns {Promise<{riskScore: number, findings: Array}>}
 */
export const analyzeChunks = async (chunks) => {
  if (!chunks || chunks.length === 0) {
    throw new Error("No chunks provided for classification.");
  }

  const payloadChunks = chunks.map((c) => {
    const sanitizedContent = (c.content || "")
      .replace(/\r/g, "") // remove carriage returns
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ") // remove control characters
      .trim();
    return {
      content: sanitizedContent,
      chunk_index: c.chunk_index
    };
  });

  const backendUrl = (env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000")
    .replace("localhost", "127.0.0.1")
    .replace(/\r/g, "")
    .trim();
  const url = `${backendUrl}/api/classify`;
  console.log(`[AI Service] Sending ${payloadChunks.length} chunks to Python FastAPI classifier at: ${url}...`);


  let classifications = [];
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chunks: payloadChunks,
        threshold: 0.05
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python classification service returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    classifications = data.classifications || [];
  } catch (error) {
    console.error("[AI Service Error] Failed to call Python classification backend:", error.message, error.cause || error);
    throw new Error(`Failed to run document classification: ${error.message}`);
  }

  // Map raw findings to structured front-end expected findings
  const findings = [];
  let findingCount = 0;

  for (const item of classifications) {
    for (const rawFinding of item.findings) {
      const category = rawFinding.category;
      const meta = CATEGORY_METADATA[category] || CATEGORY_METADATA["default"];

      findings.push({
        id: `f_${findingCount++}`,
        title: category,
        text: rawFinding.answer,
        risk: meta.risk,
        explanation: meta.explanation,
        suggestion: meta.suggestion,
        confidenceScore: Math.round(rawFinding.score * 100)
      });
    }
  }

  // Determine overall document risk score based on the highest risk level found
  let riskScore = 0.15; // default low risk
  const hasHighRisk = findings.some((f) => f.risk === "High");
  const hasMedRisk = findings.some((f) => f.risk === "Medium");

  if (hasHighRisk) {
    riskScore = 0.85;
  } else if (hasMedRisk) {
    riskScore = 0.50;
  } else if (findings.length > 0) {
    riskScore = 0.25;
  }

  console.log(`[AI Service] Analysis completed with ${findings.length} findings. Overall Risk Score: ${riskScore}`);

  return {
    riskScore,
    findings
  };
};

/**
 * Service to chunk a legal document, classify chunks via Python FastAPI,
 * map categories to structured risks/suggestions, and compute overall risk score.
 * 
 * @param {string} htmlContent - Raw HTML document content.
 * @returns {Promise<{riskScore: number, findings: Array}>}
 */
export const analyzeDocumentRisk = async (htmlContent) => {
  if (!htmlContent) {
    throw new Error("HTML content is required for analysis.");
  }

  console.log("[AI Service] Parsing HTML content into chunks...");
  const sections = parseHTMLToSections(htmlContent);
  const chunks = await chunkSections(sections);

  if (chunks.length === 0) {
    throw new Error("No text chunks could be extracted from HTML content.");
  }

  return analyzeChunks(chunks);
};


