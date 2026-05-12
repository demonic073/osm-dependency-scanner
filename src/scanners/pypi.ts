import fs from 'fs';
import path from 'path';
import { Package } from '../types';

export function scanPyPI(projectPath: string): Package[] {
  const requirementsPath = path.join(projectPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) return [];

  try {
    const content = fs.readFileSync(requirementsPath, 'utf8').replace(/\\n/g, '\n');
    const packages: Package[] = [];

    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Basic parsing for name==version or name>=version
      const match = trimmed.match(/^([a-zA-Z0-9\-_[\]]+)([>=<~!]+.*)?$/);
      if (match) {
        packages.push({
          name: match[1].split('[')[0], // Remove extras like [test]
          version: match[2] ? match[2].replace(/[>=<~!]/g, '').trim().split(',')[0] : undefined,
          ecosystem: 'pypi',
        });
      }
    }

    return packages;
  } catch (error) {
    console.error(`Error parsing requirements.txt: ${error}`);
    return [];
  }
}
