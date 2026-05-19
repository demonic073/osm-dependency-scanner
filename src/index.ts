import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import pc from 'picocolors';
import { OSMClient } from './api';
import { scanNpm } from './scanners/npm';
import { scanPyPI } from './scanners/pypi';
import { scanGo } from './scanners/go';
import { scanRust } from './scanners/rust';
import { Package, ScanResult } from './types';

dotenv.config();

const program = new Command();

program
  .name('osm-scanner')
  .description('Supply Chain Attack Scanner using OpenSourceMalware.com API')
  .version('1.0.0')
  .option('-p, --path <path>', 'Path to the project to scan', '.')
  .option('-k, --api-key <key>', 'OSM API Key (overrides .env OSM_API_KEY)')
  .option('-r, --repo <url>', 'Specific repository URL to scan')
  .option('-c, --clone <url>', 'Clone a git repository and scan it')
  .option('-R, --recursive', 'Recursively scan all subdirectories')
  .action(async (options) => {
    let projectPath = path.resolve(options.path);
    const apiKey = options.apiKey || process.env.OSM_API_KEY;

    if (!apiKey) {
      console.error(pc.red('Error: OSM API Key is required. Provide it via --api-key or OSM_API_KEY in .env'));
      process.exit(1);
    }

    const client = new OSMClient(apiKey);

    async function runScan(targetPath: string): Promise<ScanResult[]> {
      const npmPkgs = scanNpm(targetPath);
      const pypiPkgs = scanPyPI(targetPath);
      const goPkgs = scanGo(targetPath);
      const rustPkgs = scanRust(targetPath);

      const allPackages: Package[] = [...npmPkgs, ...pypiPkgs, ...goPkgs, ...rustPkgs];
      if (allPackages.length === 0) return [];

      console.log(pc.cyan(`\nScanning ${pc.white(allPackages.length)} packages in ${pc.white(targetPath)}...\n`));

      const scanResults: ScanResult[] = [];
      for (const pkg of allPackages) {
        try {
          const check = await client.checkMalicious(pkg);
          const status = check.is_malicious ? 'malicious' : 'clean';
          const statusLabel = status === 'malicious' ? pc.red('[VULNERABLE]') : pc.green('[OK]');
          console.log(`${statusLabel.padEnd(20)} ${pkg.name.padEnd(30)} ${pkg.version || 'unknown'}`);
          
          scanResults.push({
            package: pkg,
            status: status,
            details: check.details,
            report_url: check.report_url,
          });
        } catch (error: any) {
          console.log(`${pc.red('[ERROR]')}      ${pkg.name.padEnd(30)} ${pc.dim(error.message)}`);
          scanResults.push({
            package: pkg,
            status: 'error',
            details: error.message,
          });
        }
      }
      return scanResults;
    }

    if (options.clone) {
      const repoName = path.basename(options.clone, '.git');
      const cloneTarget = path.join(projectPath, repoName);
      console.log(pc.cyan(`Cloning ${pc.white(options.clone)} into ${pc.white(cloneTarget)}...`));
      
      try {
        const { execSync } = require('child_process');
        execSync(`git clone ${options.clone} ${cloneTarget}`, { stdio: 'inherit' });
        projectPath = cloneTarget;
      } catch (error: any) {
        console.error(pc.red(`Error cloning repository: ${error.message}`));
        process.exit(1);
      }
    }

    if (options.repo) {
      console.log(pc.cyan(`Scanning repository: ${pc.white(options.repo)} using OpenSourceMalware API...\n`));
      try {
        const pkg: Package = { name: options.repo, ecosystem: 'repository' };
        const check = await client.checkMalicious(pkg);
        
        if (check.is_malicious) {
          console.log(`${pc.red('[VULNERABLE]')} ${options.repo}`);
          console.log(pc.red('\n--- MALICIOUS REPOSITORY DETECTED! ---'));
          console.log(pc.bold(`[!] ${options.repo}`));
          if (check.details) console.log(pc.yellow(`    Details: ${check.details}`));
          if (check.report_url) console.log(pc.blue(`    Report: ${check.report_url}`));
          process.exit(1);
        } else {
          console.log(`${pc.green('[OK]')}         ${options.repo}`);
          console.log(pc.green('\nRepository is clean.'));
        }
      } catch (error: any) {
        console.error(pc.red(`Error scanning repository: ${error.message}`));
        process.exit(1);
      }
      return;
    }

    if (!fs.existsSync(projectPath)) {
      console.error(pc.red(`Error: scan path does not exist: ${projectPath}`));
      process.exit(1);
    }

    if (!fs.statSync(projectPath).isDirectory()) {
      console.error(pc.red(`Error: scan path is not a directory: ${projectPath}`));
      process.exit(1);
    }

    const SKIP_DIRS = new Set(['node_modules', '.git', 'vendor', '.venv', '__pycache__', 'target', 'dist', 'build']);

    async function collectDirs(dirPath: string): Promise<string[]> {
      const dirs: string[] = [];
      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && !SKIP_DIRS.has(item.name)) {
            const sub = path.join(dirPath, item.name);
            dirs.push(sub);
            const nested = await collectDirs(sub);
            dirs.push(...nested);
          }
        }
      } catch (_) {}
      return dirs;
    }

    let results: ScanResult[] = await runScan(projectPath);

    if (options.recursive) {
      console.log(pc.cyan(`Recursively scanning subdirectories of ${pc.white(projectPath)}...\n`));
      const allDirs = await collectDirs(projectPath);
      for (const dir of allDirs) {
        const subResults = await runScan(dir);
        results = [...results, ...subResults];
      }
    } else if (results.length === 0) {
      const items = fs.readdirSync(projectPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const subPath = path.join(projectPath, item.name);
          const subResults = await runScan(subPath);
          results = [...results, ...subResults];
        }
      }
    }

    if (results.length === 0) {
      console.log(pc.yellow('\nNo supported dependency files found in the specified path or its subdirectories.'));
      return;
    }

    const malicious = results.filter(r => r.status === 'malicious');
    const clean = results.filter(r => r.status === 'clean');
    const errors = results.filter(r => r.status === 'error');

    console.log(pc.bold('\n--- Scan Summary ---'));
    console.log(`${pc.cyan('Total Scanned:')} ${results.length}`);
    console.log(`${pc.green('Clean:')}         ${clean.length}`);
    console.log(`${pc.red('Malicious:')}     ${malicious.length}`);
    console.log(`${pc.yellow('Errors:')}        ${errors.length}`);

    if (malicious.length > 0) {
      console.log(pc.red('\n--- MALICIOUS PACKAGES DETECTED! ---'));
      malicious.forEach(m => {
        console.log(pc.bold(`[!] ${m.package.name} (${m.package.ecosystem}${m.package.version ? ` v${m.package.version}` : ''})`));
        if (m.details) console.log(pc.yellow(`    Details: ${m.details}`));
        if (m.report_url) console.log(pc.blue(`    Report: ${m.report_url}`));
      });
      process.exit(1);
    } else {
      console.log(pc.green('\nNo malicious packages detected.'));
    }

    if (errors.length > 0) {
      console.log(pc.yellow('\n--- Scan Errors ---'));
      errors.forEach(e => {
        console.log(pc.red(`[?] ${e.package.name}: ${pc.dim(e.details)}`));
      });
    }
  });

program.parse(process.argv);
