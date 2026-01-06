// Service for Stedi API integration

export interface Subscriber {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
}

export interface Provider {
  npi: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
}

export interface ProcedureBenefit {
  code: string;
  description: string;
  category: string;
  benefit: any;
}

export interface DentalBenefitsResponse {
  success: boolean;
  data?: {
    general: any;
    procedures: ProcedureBenefit[];
  };
  error?: string;
}

// Mock Stedi response data
const mockStediResponse: DentalBenefitsResponse = {
  success: true,
  data: {
    general: {
      benefits: [
        {
          service: "Dental - Preventive",
          status: "active",
          percentageCovered: "100",
          copayAmount: "$0"
        },
        {
          service: "Dental - Basic",
          status: "active",
          percentageCovered: "80",
          copayAmount: "$25"
        },
        {
          service: "Dental - Major",
          status: "active",
          percentageCovered: "50",
          copayAmount: "$100"
        }
      ]
    },
    procedures: [
      {
        code: "D0120",
        description: "Periodic oral evaluation",
        category: "Preventive",
        benefit: { percentageCovered: "100" }
      },
      {
        code: "D1110",
        description: "Adult prophylaxis (cleaning)",
        category: "Preventive",
        benefit: { percentageCovered: "100" }
      },
      {
        code: "D2140",
        description: "Amalgam - one surface",
        category: "Restorative",
        benefit: { percentageCovered: "80" }
      }
    ]
  }
};

class StediService {
  private backendUrl: string;

  constructor() {
    // Use backend proxy server instead of calling Stedi directly
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  }

  /**
   * Check dental benefits for a subscriber via backend proxy
   * POST /api/stedi/dental-benefits
   */
  async checkDentalBenefits(
    subscriber: Subscriber,
    provider: Provider
  ): Promise<DentalBenefitsResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/stedi/dental-benefits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriber, provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to check dental benefits: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify Stedi API connection using same endpoint as dental benefits
   * Can use mock data or real API based on isApiEnabled flag
   */
  async verifyStediAPI(
    subscriber: Subscriber,
    provider: Provider,
    isApiEnabled: boolean = true
  ): Promise<DentalBenefitsResponse> {
    // Return mock data if API is disabled
    if (!isApiEnabled) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return mockStediResponse;
    }

    // Reuse the same endpoint as checkDentalBenefits for real API
    return this.checkDentalBenefits(subscriber, provider);
  }
}

// Export a singleton instance
export const stediService = new StediService();
export default stediService;
