import { Package, MaliciousCheckResponse } from './types';
export declare class OSMClient {
    private baseUrl;
    private apiKey;
    constructor(apiKey: string);
    private sleep;
    checkMalicious(pkg: Package, retries?: number): Promise<MaliciousCheckResponse>;
}
