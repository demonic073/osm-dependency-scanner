export interface Package {
    name: string;
    version?: string;
    ecosystem: Ecosystem;
}
export type Ecosystem = 'npm' | 'pypi' | 'go' | 'rust' | 'maven' | 'nuget' | 'vscode' | 'skills' | 'repository' | 'url' | 'domain' | 'ip' | 'wallet' | 'container';
export interface MaliciousCheckResponse {
    is_malicious: boolean;
    threat_type?: string;
    details?: string;
    report_url?: string;
}
export interface ScanResult {
    package: Package;
    status: 'malicious' | 'clean' | 'error';
    details?: string;
    report_url?: string;
}
