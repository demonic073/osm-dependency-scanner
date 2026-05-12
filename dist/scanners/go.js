"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanGo = scanGo;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function scanGo(projectPath) {
    const goModPath = path_1.default.join(projectPath, 'go.mod');
    if (!fs_1.default.existsSync(goModPath))
        return [];
    try {
        const content = fs_1.default.readFileSync(goModPath, 'utf8')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t');
        const packages = [];
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
                if (lineContent.startsWith('(') || lineContent.startsWith(')'))
                    continue;
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
    }
    catch (error) {
        console.error(`Error parsing go.mod: ${error}`);
        return [];
    }
}
