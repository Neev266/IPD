const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove unused React imports
      content = content.replace(/import React from 'react';\r?\n/g, '');
      content = content.replace(/import React, {(.+?)} from 'react';/g, "import { $1 } from 'react';");
      content = content.replace(/import \* as React from "react"\r?\n/g, '');
      
      // specific fixes
      if (fullPath.endsWith('AuditHistory.tsx')) {
        content = content.replace(/\(event, idx\)/g, '(event)');
      }
      if (fullPath.endsWith('ClauseLibrary.tsx')) {
        content = content.replace(/CardDescription(, )?/g, '');
        content = content.replace(/FileText(, )?/g, '');
      }
      if (fullPath.endsWith('ContractEditor.tsx')) {
        content = content.replace(/React, /g, '');
      }
      if (fullPath.endsWith('Contracts.tsx')) {
        content = content.replace(/CardDescription(, )?/g, '');
        content = content.replace(/React, /g, '');
      }
      if (fullPath.endsWith('RiskAlerts.tsx')) {
        content = content.replace(/CardHeader, /g, '');
        content = content.replace(/CardTitle, /g, '');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
