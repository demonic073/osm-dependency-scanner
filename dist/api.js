"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OSMClient = void 0;
const axios_1 = __importDefault(require("axios"));
class OSMClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.opensourcemalware.com/functions/v1';
        this.apiKey = apiKey;
    }
    async checkMalicious(pkg) {
        try {
            const isRepo = pkg.ecosystem === 'repository';
            const response = await axios_1.default.get(`${this.baseUrl}/check-malicious`, {
                params: {
                    report_type: isRepo ? 'repository' : 'package',
                    resource_identifier: pkg.name,
                    ecosystem: isRepo ? undefined : pkg.ecosystem,
                    version: pkg.version,
                },
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return {
                is_malicious: !!response.data.malicious,
                threat_type: response.data.details?.threat_id,
                details: response.data.details?.description,
                report_url: response.data.osm_url,
            };
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return { is_malicious: false };
            }
            throw new Error(`API Request failed: ${error.message}`);
        }
    }
}
exports.OSMClient = OSMClient;
