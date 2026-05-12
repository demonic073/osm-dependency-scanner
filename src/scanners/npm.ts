import fs from 'fs';
import path from 'path';
import { Package } from '../types';

export function scanNpm(projectPath: string): Package[] {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return [];

  try {
    const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packages: Package[] = [];

    const dependencies = { ...(content.dependencies || {}), ...(content.devDependencies || {}) };
    for (const [name, version] of Object.entries(dependencies)) {
      packages.push({
        name,
        version: (version as string).replace(/[^0-9.]/g, ''), // Basic version cleanup
        ecosystem: 'npm',
      });
    }

    return packages;
  } catch (error) {
    console.error(`Error parsing package.json: ${error}`);
    return [];
  }
}
