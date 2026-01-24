// Service for Stedi API integration
import type { Patient } from '@/types/patient';

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
    const baseUrl = this.backendUrl || '';
    const url = `${baseUrl}/api/stedi/dental-benefits`;
    console.log('StediService: checkDentalBenefits called with:', { subscriber, provider, url });

    if (!subscriber?.memberId || !provider?.npi) {
      console.error('StediService: Missing required subscriber/provider data');
      throw new Error('Subscriber member ID and Provider NPI are required for real data verification.');
    }

    try {
      console.log('StediService: Executing fetch to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriber, provider }),
      });

      console.log('StediService: response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        console.error('StediService: Server error:', data.error);
        throw new Error(data.error || `Failed to check dental benefits: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('StediService: Error in checkDentalBenefits:', error);
      throw error;
    }
  }

  /**
   * Check raw eligibility for test data using same payload as API Tester
   * POST /api/stedi/raw-eligibility
   */
  async checkRawEligibility(payload: any): Promise<any> {
    const baseUrl = this.backendUrl || '';
    const url = `${baseUrl}/api/stedi/raw-eligibility`;
    console.log('StediService: Calling raw eligibility at:', url, 'with payload:', payload);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('StediService: Raw eligibility response status:', response.status);
      const data = await response.json();
      if (!response.ok) {
        console.error('StediService: Raw eligibility failed:', data.error);
        throw new Error(data.error || 'Failed to check raw eligibility');
      }

      return data;
    } catch (error) {
      console.error('StediService: Network error in checkRawEligibility:', error);
      throw error;
    }
  }

  /**
   * Verify Stedi API connection using appropriate mode
   */
  async verifyStediAPI(
    subscriber: Subscriber,
    provider: Provider,
    mode: 'mockup' | 'test-data' | 'real-data' = 'real-data',
    patient?: Patient
  ): Promise<any> {
    console.log('StediService: verifyStediAPI called with mode:', mode);

    // Return mock data if in mockup mode
    if (mode === 'mockup') {
      console.log('StediService: Returning mock data');
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockStediResponse;
    }

    // Use test data payload if in test-data mode
    if (mode === 'test-data') {
      console.log('StediService: Using test data mode (John/Jordan Doe)');
      const testPayload = {
        "tradingPartnerServiceId": "62308",
        "provider": {
          "organizationName": "Provider Name",
          "npi": "1999999984"
        },
        "subscriber": {
          "firstName": "John",
          "lastName": "Doe",
          "memberId": "CIGNAJTUxNm"
        },
        "dependents": [
          {
            "firstName": "Jordan",
            "lastName": "Doe",
            "dateOfBirth": "20150920"
          }
        ],
        "encounter": {
          "serviceTypeCodes": ["35"]
        }
      };
      const result = await this.checkRawEligibility(testPayload);
      // Return in a consistent format
      return { success: true, data: result };
    }

    // Use real patient data
    if (mode === 'real-data') {
      console.log('StediService: Using real patient data mode (raw format)');
      const payload: any = {
        "tradingPartnerServiceId": "62308", // Default to CIGNA as in test case
        "provider": {
          "organizationName": provider.organizationName || "Provider Name",
          "npi": provider.npi
        },
        "subscriber": {
          "firstName": subscriber.firstName,
          "lastName": subscriber.lastName,
          "memberId": subscriber.memberId,
          "dateOfBirth": subscriber.dateOfBirth?.replace(/-/g, '') // Format to YYYYMMDD
        },
        "encounter": {
          "serviceTypeCodes": ["35"]
        }
      };

      // Add patient as dependent if available (ensuring we use the decrypted subscriber date)
      if (patient) {
        payload.dependents = [
          {
            "firstName": patient.name?.given?.[0] || "Patient",
            "lastName": patient.name?.family || "Patient",
            "dateOfBirth": subscriber.dateOfBirth // Use the already decrypted and formatted date
          }
        ];
      }

      const result = await this.checkRawEligibility(payload);
      return { success: true, data: result };
    }

    return { success: false, error: 'Invalid mode specified.' };
  }
}

// Export a singleton instance
export const stediService = new StediService();
export default stediService;
