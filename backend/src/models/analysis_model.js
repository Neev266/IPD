export class Analysis {
  constructor(id, documentId, riskScore, findings) {
    this.id = id;
    this.documentId = documentId;
    this.riskScore = riskScore;
    this.findings = findings;
    this.analyzedAt = new Date();
  }
}
