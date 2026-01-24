/**
 * Utility functions for deriving patient verification status from transaction history
 * When Data Mode is ON, verification status is automatically determined from transactions
 */

export interface Transaction {
  id: string;
  requestId: string;
  type: 'FETCH' | 'API' | 'CALL' | 'FAX' | 'SAVE';
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting';
  startTime: string;
  endTime?: string;
  patientId: string;
  patientName: string;
  insuranceProvider?: string;
  insuranceRep?: string;
  runBy?: string;
  verificationScore?: number;
  fetchStatus?: string;
  saveStatus?: string;
  responseCode?: string;
  endpoint?: string;
  phoneNumber?: string;
  errorMessage?: string;
  eligibilityCheck?: string;
  benefitsVerification?: string;
  coverageDetails?: string;
  deductibleInfo?: string;
  transcript?: string;
  rawResponse?: string;
  dataVerified?: string[];
  duration?: string;
  method?: string;
}

export interface VerificationStatus {
  fetchPMS: 'pending' | 'in_progress' | 'completed';
  apiVerification: 'pending' | 'in_progress' | 'completed';
  aiAnalysisAndCall: 'pending' | 'in_progress' | 'completed';
  saveToPMS: 'pending' | 'in_progress' | 'completed';
}

/**
 * Derives verification status from transaction history
 * Logic:
 * - If API transaction is "Waiting", Fetch PMS is done, API is waiting/in_progress
 * - If CALL/FAX transaction is "Waiting", Fetch PMS and API are done, AI Analysis and Call is waiting/in_progress
 * - Completed transactions mark their respective steps as completed
 */
export function deriveVerificationStatusFromTransactions(transactions: Transaction[]): VerificationStatus {
  const status: VerificationStatus = {
    fetchPMS: 'pending',
    apiVerification: 'pending',
    aiAnalysisAndCall: 'pending',
    saveToPMS: 'pending',
  };

  // Sort transactions by start time (oldest first) to process them in order
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  // Process each transaction to determine status
  for (const txn of sortedTransactions) {
    switch (txn.type) {
      case 'FETCH':
        if (txn.status === 'SUCCESS') {
          status.fetchPMS = 'completed';
        } else if (txn.status === 'Waiting') {
          status.fetchPMS = 'in_progress';
        }
        break;

      case 'API':
        if (txn.status === 'Waiting') {
          // API is waiting means Fetch PMS is done
          status.fetchPMS = 'completed';
          status.apiVerification = 'in_progress';
        } else if (txn.status === 'SUCCESS' || txn.status === 'PARTIAL') {
          status.fetchPMS = 'completed';
          status.apiVerification = 'completed';
        }
        break;

      case 'FAX':
      case 'CALL':
        if (txn.status === 'Waiting') {
          // FAX/CALL is waiting means previous steps are done
          status.fetchPMS = 'completed';
          status.apiVerification = 'completed';
          status.aiAnalysisAndCall = 'in_progress';
        } else if (txn.status === 'SUCCESS' || txn.status === 'PARTIAL') {
          status.fetchPMS = 'completed';
          status.apiVerification = 'completed';
          status.aiAnalysisAndCall = 'completed';
        }
        break;

      case 'SAVE':
        if (txn.status === 'Waiting') {
          // Save is waiting means all previous steps are done
          status.fetchPMS = 'completed';
          status.apiVerification = 'completed';
          status.aiAnalysisAndCall = 'completed';
          status.saveToPMS = 'in_progress';
        } else if (txn.status === 'SUCCESS') {
          status.fetchPMS = 'completed';
          status.apiVerification = 'completed';
          status.aiAnalysisAndCall = 'completed';
          status.saveToPMS = 'completed';
        }
        break;
    }
  }

  return status;
}

/**
 * Checks if data mode should override verification status
 * In Data Mode, status is derived from transactions
 * In Mock Mode, status comes from the patient record
 */
export function shouldUseTransactionBasedStatus(dataMode: boolean): boolean {
  return dataMode === true;
}
