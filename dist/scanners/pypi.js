"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanPyPI = scanPyPI;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function scanPyPI(projectPath) {
    const requirementsPath = path_1.default.join(projectPath, 'requirements.txt');
    if (!fs_1.default.existsSync(requirementsPath))
        return [];
    try {
        const content = fs_1.default.readFileSync(requirementsPath, 'utf8').replace(/\\n/g, '\n');
        const packages = [];
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
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
    }
    catch (error) {
        console.error(`Error parsing requirements.txt: ${error}`);
        return [];
    }
}
