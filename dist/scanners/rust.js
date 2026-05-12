"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRust = scanRust;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function scanRust(projectPath) {
    const cargoTomlPath = path_1.default.join(projectPath, 'Cargo.toml');
    if (!fs_1.default.existsSync(cargoTomlPath))
        return [];
    try {
        const content = fs_1.default.readFileSync(cargoTomlPath, 'utf8').replace(/\\n/g, '\n');
        const packages = [];
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
    }
    catch (error) {
        console.error(`Error parsing Cargo.toml: ${error}`);
        return [];
    }
}
