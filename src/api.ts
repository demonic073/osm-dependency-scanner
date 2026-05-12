import axios from 'axios';
import { Package, MaliciousCheckResponse } from './types';

export class OSMClient {
  private baseUrl = 'https://api.opensourcemalware.com/functions/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkMalicious(pkg: Package): Promise<MaliciousCheckResponse> {
    try {
      const isRepo = pkg.ecosystem === 'repository';
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
      if (error.response && error.response.status === 404) {
        return { is_malicious: false };
      }
      throw new Error(`API Request failed: ${error.message}`);
    }
  }
}
