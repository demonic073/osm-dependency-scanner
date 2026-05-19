import axios from 'axios';
import { Package, MaliciousCheckResponse } from './types';

export class OSMClient {
  private baseUrl = 'https://api.opensourcemalware.com/functions/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkMalicious(pkg: Package, retries = 5): Promise<MaliciousCheckResponse> {
    await this.sleep(100);
    const isRepo = pkg.ecosystem === 'repository';
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/check-malicious`, {
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
      } catch (error: any) {
        if (error.response?.status === 404) {
          return { is_malicious: false };
        }
        if (error.response?.status === 429 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 5000;
          await this.sleep(delay);
          continue;
        }
        throw new Error(`API Request failed: ${error.message}`);
      }
    }
    throw new Error('API Request failed: max retries exceeded');
  }
}
