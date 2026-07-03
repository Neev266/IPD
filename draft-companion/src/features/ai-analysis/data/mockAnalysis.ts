export type RiskLevel = "High" | "Medium" | "Low";

export interface AnalyzedClause {
  id: string;
  title: string;
  text: string;
  risk: RiskLevel;
  explanation: string;
  suggestion: string;
  confidenceScore: number;
}

const baseClauses: AnalyzedClause[] = [
  {
    id: "c1",
    title: "Indemnity Scope",
    text: "The Service Provider shall indemnify and hold harmless the Client from any and all claims, liabilities, damages, and expenses arising out of the performance of the Services. This includes any consequential or indirect damages regardless of fault.",
    risk: "High",
    explanation: "Section lacks a liability cap and includes consequential damages, exposing the Service Provider to unlimited potential claims.",
    suggestion: "Add a mutual liability cap tied to total fees paid, and expressly exclude indirect/consequential damages.",
    confidenceScore: 0, 
  },
  {
    id: "c2",
    title: "Payment Terms",
    text: "Invoices shall be payable by the Client net-90 days from the date of receipt. Late payments shall accrue interest at a rate of 5% per month.",
    risk: "Medium",
    explanation: "Late fee percentage (5% per month) exceeds statutory usury limits in several jurisdictions. Net-90 terms are unusually long for standard service agreements.",
    suggestion: "Reduce late fee to 1.5% per month. Negotiate payment terms to net-30 or net-45.",
    confidenceScore: 0,
  },
  {
    id: "c3",
    title: "Termination for Convenience",
    text: "The Client may terminate this Agreement at any time and for any reason by providing five (5) days written notice to the Service Provider.",
    risk: "Medium",
    explanation: "5 days notice is insufficient for resource reallocation. It unfairly favors the Client without protecting the Service Provider's sunk costs.",
    suggestion: "Require at least thirty (30) days written notice for convenience termination, or include a termination fee.",
    confidenceScore: 0,
  },
  {
    id: "c4",
    title: "Intellectual Property Ownership",
    text: "Upon payment in full, the Service Provider assigns all rights, title, and interest in the Work Product to the Client. The Service Provider retains a non-exclusive license to use generic tools developed during the engagement.",
    risk: "Low",
    explanation: "Standard IP assignment language. The retention of rights to generic tools provides good protection for the Service Provider.",
    suggestion: "Ensure 'generic tools' is explicitly defined in Exhibit A to avoid future disputes.",
    confidenceScore: 0,
  },
];

export const generateMockAnalysis = () => {
  // Add randomization to confidence scores (80-95%)
  const randomizedClauses = baseClauses.map(clause => ({
    ...clause,
    confidenceScore: Math.floor(Math.random() * (95 - 80 + 1)) + 80,
  }));

  // Optionally shuffle slightly without breaking logic totally
  const sortedClauses = [...randomizedClauses].sort((a, b) => {
    // Keep 'High' risks mostly near the top
    const riskWeight = { High: 0, Medium: 1, Low: 2 };
    return riskWeight[a.risk] - riskWeight[b.risk] + (Math.random() * 0.5 - 0.25);
  });

  return sortedClauses;
};

export const mockSimilarClause = {
  source: "Standard NDA Template v2.1",
  matchPercentage: 94,
  text: "Each party's aggregate liability under this Agreement shall be limited to the total fees paid by Client to Service Provider during the twelve (12) months preceding the claim."
};

export const mockCompareWithLaw = {
  law: "Indian Contract Act - Section 73",
  explanation: "Compensation for loss or damage caused by breach of contract. When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it."
};
