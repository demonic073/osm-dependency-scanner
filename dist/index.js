"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const picocolors_1 = __importDefault(require("picocolors"));
const api_1 = require("./api");
const npm_1 = require("./scanners/npm");
const pypi_1 = require("./scanners/pypi");
const go_1 = require("./scanners/go");
const rust_1 = require("./scanners/rust");
dotenv_1.default.config();
const program = new commander_1.Command();
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
    let projectPath = path_1.default.resolve(options.path);
    const apiKey = options.apiKey || process.env.OSM_API_KEY;
    if (!apiKey) {
        console.error(picocolors_1.default.red('Error: OSM API Key is required. Provide it via --api-key or OSM_API_KEY in .env'));
        process.exit(1);
    }
    const client = new api_1.OSMClient(apiKey);
    async function runScan(targetPath) {
        const npmPkgs = (0, npm_1.scanNpm)(targetPath);
        const pypiPkgs = (0, pypi_1.scanPyPI)(targetPath);
        const goPkgs = (0, go_1.scanGo)(targetPath);
        const rustPkgs = (0, rust_1.scanRust)(targetPath);
        const allPackages = [...npmPkgs, ...pypiPkgs, ...goPkgs, ...rustPkgs];
        if (allPackages.length === 0)
            return [];
        console.log(picocolors_1.default.cyan(`\nScanning ${picocolors_1.default.white(allPackages.length)} packages in ${picocolors_1.default.white(targetPath)}...\n`));
        const scanResults = [];
        for (const pkg of allPackages) {
            try {
                const check = await client.checkMalicious(pkg);
                const status = check.is_malicious ? 'malicious' : 'clean';
                const statusLabel = status === 'malicious' ? picocolors_1.default.red('[VULNERABLE]') : picocolors_1.default.green('[OK]');
                console.log(`${statusLabel.padEnd(20)} ${pkg.name.padEnd(30)} ${pkg.version || 'unknown'}`);
                scanResults.push({
                    package: pkg,
                    status: status,
                    details: check.details,
                    report_url: check.report_url,
                });
            }
            catch (error) {
                console.log(`${picocolors_1.default.red('[ERROR]')}      ${pkg.name.padEnd(30)} ${picocolors_1.default.dim(error.message)}`);
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
        const repoName = path_1.default.basename(options.clone, '.git');
        const cloneTarget = path_1.default.join(projectPath, repoName);
        console.log(picocolors_1.default.cyan(`Cloning ${picocolors_1.default.white(options.clone)} into ${picocolors_1.default.white(cloneTarget)}...`));
        try {
            const { execSync } = require('child_process');
            execSync(`git clone ${options.clone} ${cloneTarget}`, { stdio: 'inherit' });
            projectPath = cloneTarget;
        }
        catch (error) {
            console.error(picocolors_1.default.red(`Error cloning repository: ${error.message}`));
            process.exit(1);
        }
    }
    if (options.repo) {
        console.log(picocolors_1.default.cyan(`Scanning repository: ${picocolors_1.default.white(options.repo)} using OpenSourceMalware API...\n`));
        try {
            const pkg = { name: options.repo, ecosystem: 'repository' };
            const check = await client.checkMalicious(pkg);
            if (check.is_malicious) {
                console.log(`${picocolors_1.default.red('[VULNERABLE]')} ${options.repo}`);
                console.log(picocolors_1.default.red('\n--- MALICIOUS REPOSITORY DETECTED! ---'));
                console.log(picocolors_1.default.bold(`[!] ${options.repo}`));
                if (check.details)
                    console.log(picocolors_1.default.yellow(`    Details: ${check.details}`));
                if (check.report_url)
                    console.log(picocolors_1.default.blue(`    Report: ${check.report_url}`));
                process.exit(1);
            }
            else {
                console.log(`${picocolors_1.default.green('[OK]')}         ${options.repo}`);
                console.log(picocolors_1.default.green('\nRepository is clean.'));
            }
        }
        catch (error) {
            console.error(picocolors_1.default.red(`Error scanning repository: ${error.message}`));
            process.exit(1);
        }
        return;
    }
    if (!fs_1.default.existsSync(projectPath)) {
        console.error(picocolors_1.default.red(`Error: scan path does not exist: ${projectPath}`));
        process.exit(1);
    }
    if (!fs_1.default.statSync(projectPath).isDirectory()) {
        console.error(picocolors_1.default.red(`Error: scan path is not a directory: ${projectPath}`));
        process.exit(1);
    }
    const SKIP_DIRS = new Set(['node_modules', '.git', 'vendor', '.venv', '__pycache__', 'target', 'dist', 'build']);
    async function collectDirs(dirPath) {
        const dirs = [];
        try {
            const items = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory() && !SKIP_DIRS.has(item.name)) {
                    const sub = path_1.default.join(dirPath, item.name);
                    dirs.push(sub);
                    const nested = await collectDirs(sub);
                    dirs.push(...nested);
                }
            }
        }
        catch (_) { }
        return dirs;
    }
    let results = await runScan(projectPath);
    if (options.recursive) {
        console.log(picocolors_1.default.cyan(`Recursively scanning subdirectories of ${picocolors_1.default.white(projectPath)}...\n`));
        const allDirs = await collectDirs(projectPath);
        for (const dir of allDirs) {
            const subResults = await runScan(dir);
            results = [...results, ...subResults];
        }
    }
    else if (results.length === 0) {
        const items = fs_1.default.readdirSync(projectPath, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                const subPath = path_1.default.join(projectPath, item.name);
                const subResults = await runScan(subPath);
                results = [...results, ...subResults];
            }
        }
    }
    if (results.length === 0) {
        console.log(picocolors_1.default.yellow('\nNo supported dependency files found in the specified path or its subdirectories.'));
        return;
    }
    const malicious = results.filter(r => r.status === 'malicious');
    const clean = results.filter(r => r.status === 'clean');
    const errors = results.filter(r => r.status === 'error');
    console.log(picocolors_1.default.bold('\n--- Scan Summary ---'));
    console.log(`${picocolors_1.default.cyan('Total Scanned:')} ${results.length}`);
    console.log(`${picocolors_1.default.green('Clean:')}         ${clean.length}`);
    console.log(`${picocolors_1.default.red('Malicious:')}     ${malicious.length}`);
    console.log(`${picocolors_1.default.yellow('Errors:')}        ${errors.length}`);
    if (malicious.length > 0) {
        console.log(picocolors_1.default.red('\n--- MALICIOUS PACKAGES DETECTED! ---'));
        malicious.forEach(m => {
            console.log(picocolors_1.default.bold(`[!] ${m.package.name} (${m.package.ecosystem}${m.package.version ? ` v${m.package.version}` : ''})`));
            if (m.details)
                console.log(picocolors_1.default.yellow(`    Details: ${m.details}`));
            if (m.report_url)
                console.log(picocolors_1.default.blue(`    Report: ${m.report_url}`));
        });
        process.exit(1);
    }
    else {
        console.log(picocolors_1.default.green('\nNo malicious packages detected.'));
    }
    if (errors.length > 0) {
        console.log(picocolors_1.default.yellow('\n--- Scan Errors ---'));
        errors.forEach(e => {
            console.log(picocolors_1.default.red(`[?] ${e.package.name}: ${picocolors_1.default.dim(e.details)}`));
        });
    }
});
program.parse(process.argv);
