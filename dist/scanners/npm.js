"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanNpm = scanNpm;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function scanNpm(projectPath) {
    const packageJsonPath = path_1.default.join(projectPath, 'package.json');
    if (!fs_1.default.existsSync(packageJsonPath))
        return [];
    try {
        const content = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
        const packages = [];
        const dependencies = { ...(content.dependencies || {}), ...(content.devDependencies || {}) };
        for (const [name, version] of Object.entries(dependencies)) {
            packages.push({
                name,
                version: version.replace(/[^0-9.]/g, ''), // Basic version cleanup
                ecosystem: 'npm',
            });
        }
        return packages;
    }
    catch (error) {
        console.error(`Error parsing package.json: ${error}`);
        return [];
    }
}
