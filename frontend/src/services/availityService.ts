// Service for Availity API integration

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CoverageResponse {
  // Add specific coverage response types based on Availity API documentation
  [key: string]: any;
}

class AvailityService {
  private backendUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Use backend proxy server instead of calling Availity directly
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Get access token using client credentials via backend proxy
   * POST /api/token
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.backendUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      // Set token expiry (subtract 60 seconds for safety margin)
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get coverage information by ID via backend proxy
   * GET /api/coverages/:id
   */
  async getCoverageById(coverageId: string): Promise<CoverageResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.backendUrl}/api/coverages/${coverageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get coverage: ${response.status} ${response.statusText}`);
      }

      const data: CoverageResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get coverages by Payer ID via backend proxy
   * POST /api/coverages
   */
  async getCoveragesByPayerId(payerId: string): Promise<CoverageResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.backendUrl}/api/coverages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get coverages by payer ID: ${response.status} ${response.statusText}`);
      }

      const data: CoverageResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start verification process - combines token retrieval and coverage fetch by ID
   */
  async startVerification(coverageId: string): Promise<CoverageResponse> {
    try {
      // First, get the access token
      await this.getAccessToken();

      // Then, get the coverage by ID
      const coverage = await this.getCoverageById(coverageId);

      return coverage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start verification by Payer ID - combines token retrieval and coverage fetch by payer ID
   */
  async startVerificationByPayerId(payerId: string): Promise<CoverageResponse> {
    try {
      // First, get the access token
      await this.getAccessToken();

      // Then, get the coverages by payer ID
      const coverages = await this.getCoveragesByPayerId(payerId);

      return coverages;
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
export const availityService = new AvailityService();
export default availityService;
