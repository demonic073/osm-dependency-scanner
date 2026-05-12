import fs from 'fs';
import path from 'path';
import { Package } from '../types';

export function scanGo(projectPath: string): Package[] {
  const goModPath = path.join(projectPath, 'go.mod');
  if (!fs.existsSync(goModPath)) return [];

  try {
    const content = fs.readFileSync(goModPath, 'utf8')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
    const packages: Package[] = [];

    const lines = content.split(/\r?\n/);
    let inRequire = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('require (')) {
        inRequire = true;
        continue;
      }
      if (inRequire && trimmed.startsWith(')')) {
        inRequire = false;
        continue;
      }

      if (inRequire || trimmed.startsWith('require ')) {
        const lineContent = trimmed.startsWith('require ') ? trimmed.replace('require ', '').trim() : trimmed;
        if (lineContent.startsWith('(') || lineContent.startsWith(')')) continue;
        
        const parts = lineContent.trim().split(/\s+/);
        if (parts.length >= 2) {
          packages.push({
            name: parts[0].trim(),
            version: parts[1].trim(),
            ecosystem: 'go',
          });
        }
      }
    }

    return packages;
  } catch (error) {
    console.error(`Error parsing go.mod: ${error}`);
    return [];
  }
}
