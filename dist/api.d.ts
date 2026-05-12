import { Package, MaliciousCheckResponse } from './types';
export declare class OSMClient {
    private baseUrl;
    private apiKey;
    constructor(apiKey: string);
    checkMalicious(pkg: Package): Promise<MaliciousCheckResponse>;
}
