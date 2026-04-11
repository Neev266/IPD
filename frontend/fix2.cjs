const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/ui/Button.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ui/Table.tsx'
];

for (const f of filesToFix) {
  const p = path.join(__dirname, f);
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes("import React")) {
    content = "import React from 'react';\n" + content;
    fs.writeFileSync(p, content);
  }
}

const pRisk = path.join(__dirname, 'src/pages/RiskAlerts.tsx');
let riskContent = fs.readFileSync(pRisk, 'utf8');
riskContent = riskContent.replace(/import {([^}]+)CardTitle([^}]+)}/, 'import {$1$2}');
// Clean up stray commas
riskContent = riskContent.replace(/import {([^}]+),\s+}/, 'import {$1}');
riskContent = riskContent.replace(/import {\s+,([^}]+)}/, 'import {$1}');
riskContent = riskContent.replace(/import {\s+CardTitle\s+}/, '');
fs.writeFileSync(pRisk, riskContent);
