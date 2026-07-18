import { analyzeDocumentRisk } from "./src/services/ai_service.js";

async function runTest() {
  console.log("=== Running End-to-End Analysis Service Test ===\n");
  
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>NON-DISCLOSURE AGREEMENT</h1>
        <p>This Agreement is entered into on July 8, 2026, by and between ClientCorp ("Discloser") and vendorCorp ("Recipient").</p>
        
        <h2>Section 1. Term and Termination</h2>
        <p>This agreement shall remain in effect for 3 years. Either party may terminate this agreement at any time for convenience with 5 days written notice.</p>
        
        <h2>Section 2. Governing Law</h2>
        <p>This Agreement and all disputes arising hereunder shall be governed by and construed in accordance with the laws of the State of California, United States.</p>
        
        <h2>Section 3. Restrictive Covenants</h2>
        <p>Recipient agrees that during the term of this Agreement and for a period of two years thereafter, Recipient shall not engage in any business activity that directly competes with Discloser within the United States.</p>
      </body>
    </html>
  `;

  try {
    const result = await analyzeDocumentRisk(sampleHtml);
    console.log("=== ANALYSIS COMPLETED SUCCESSFULLY ===");
    console.log(`Document Risk Score: ${result.riskScore}`);
    console.log("Findings:");
    console.dir(result.findings, { depth: null });
  } catch (error) {
    console.error("❌ Test failed with error:", error.message || error);
  }
}

runTest();
