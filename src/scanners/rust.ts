import fs from 'fs';
import path from 'path';
import { Package } from '../types';

export function scanRust(projectPath: string): Package[] {
  const cargoTomlPath = path.join(projectPath, 'Cargo.toml');
  if (!fs.existsSync(cargoTomlPath)) return [];

  try {
    const content = fs.readFileSync(cargoTomlPath, 'utf8').replace(/\\n/g, '\n');
    const packages: Package[] = [];

    const lines = content.split(/\r?\n/);
    let inDependencies = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[dependencies]') || trimmed.startsWith('[dev-dependencies]')) {
        inDependencies = true;
        continue;
      }
      if (trimmed.startsWith('[') && trimmed !== '[dependencies]' && trimmed !== '[dev-dependencies]') {
        inDependencies = false;
        continue;
      }

      if (inDependencies && trimmed && !trimmed.startsWith('#')) {
        const [name, versionPart] = trimmed.split('=').map(s => s.trim());
        if (name && versionPart) {
          const versionMatch = versionPart.match(/"([^"]+)"/);
          packages.push({
            name,
            version: versionMatch ? versionMatch[1] : undefined,
            ecosystem: 'rust',
          });
        }
      }
    }

    return packages;
  } catch (error) {
    console.error(`Error parsing Cargo.toml: ${error}`);
    return [];
  }
}
