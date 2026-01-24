import React, { useState, useEffect, useRef, useMemo } from "react";
import VerificationDataPanel, { VerificationDataRow } from "./VerificationDataPanel";
import stediService, { Subscriber, Provider } from "@/services/stediService";
import { Patient } from "@/types/patient";
import { useStediApi } from "@/context/StediApiContext";
import { decryptSensitiveData, decryptInsuranceField } from "@/services/sensitiveDataService";
import { parseStediResponse } from "@/utils/stediParser";
import { API_VERIFICATION_DATA } from "@/constants/verificationData";

// Sample API JSON response - moved outside component for performance
const SAMPLE_API_RESPONSE = JSON.stringify({
  "verification_id": "VER-2025-001234",
  "timestamp": "2025-01-21T10:30:45Z",
  "patient": {
    "name": "Christopher James Davis",
    "dob": "1985-03-15",
    "member_id": "BCBS123456789"
  },
  "insurance": {
    "carrier": "Blue Cross Blue Shield",
    "group_number": "GRP987654",
    "policy_status": "active",
    "effective_date": "2024-01-01",
    "plan_type": "PPO Premium"
  },
  "eligibility": {
    "active": true,
    "coverage_status": "verified",
    "verification_date": "2025-01-21"
  },
  "benefits": {
    "annual_maximum": 2000,
    "annual_used": 450,
    "annual_remaining": 1550,
    "deductible": 50,
    "deductible_met": 50,
    "preventive_coverage": "100%",
    "basic_coverage": "80%",
    "major_coverage": "50%",
    "waiting_periods": {
      "preventive": "none",
      "basic": "none",
      "major": "12 months"
    }
  }
}, null, 2);

// Sample code-level coverage data - moved outside component for performance
const CODE_LEVEL_DATA = `COVERAGE BY CODE VIEW - DETAILED ANALYSIS

Preventive Services (100% Coverage):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D0120  Periodic Oral Evaluation           $45.00    $0.00     ✓ Covered 2x/year
D0210  Complete Series X-rays             $125.00   $0.00     ✓ Once per 3 years
D0274  Bitewing X-rays (4 films)          $65.00    $0.00     ✓ Covered 2x/year
D1110  Prophylaxis - Adult                $95.00    $0.00     ✓ Covered 2x/year
D1206  Fluoride Varnish                   $40.00    $0.00     ✓ No age limit
D1351  Sealant - per tooth                $55.00    $0.00     ✓ Under age 16

Basic Restorative Services (80% Coverage):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D2140  Amalgam - 1 surface                $150.00   $30.00    ✓ No waiting period
D2150  Amalgam - 2 surfaces               $185.00   $37.00    ✓ No waiting period
D2391  Composite - 1 surface posterior    $175.00   $35.00    ✓ No waiting period
D2392  Composite - 2 surfaces posterior   $215.00   $43.00    ✓ No waiting period
D7140  Simple Extraction                  $195.00   $39.00    ✓ No limitations

Major Services (50% Coverage):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D2750  Crown - Porcelain fused to metal   $1,100.00 $550.00   ⚠ 12-month wait
D2751  Crown - Porcelain                  $1,200.00 $600.00   ⚠ 12-month wait
D2790  Crown - Full cast metal            $950.00   $475.00   ⚠ 12-month wait
D6010  Surgical placement of implant      $2,100.00 $1,050.00 ⚠ Not covered
D6240  Crown over implant                 $1,500.00 $750.00   ⚠ Not covered

Periodontal Services (80% Coverage):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D4341  Scaling & root planing (per quad)  $275.00   $55.00    ✓ 1x per 24 months
D4910  Periodontal maintenance            $125.00   $25.00    ✓ 4x per year

ANNUAL BENEFIT STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Maximum Benefit:        $2,000.00
Used to Date:           $450.00
Remaining:              $1,550.00
Deductible:             $50.00 (Met)
Plan Renewal:           January 1st`;

interface CoverageVerificationResultsProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patient?: Patient;
  onTransactionCreated?: () => void;
}

type Step = 'step1' | 'step2' | 'step3' | 'idle';
type StepStatus = 'pending' | 'in_progress' | 'completed';

// Capitalize first letter of each word, lowercase the rest
const capitalizeWord = (word: string): string => {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const formatPatientName = (patient: Patient | undefined): string => {
  if (!patient?.name?.given?.[0]) return 'Unknown Patient';
  const given = patient.name.given
    .map(name => name.split(' ').map(capitalizeWord).join(' '))
    .join(' ');
  const family = capitalizeWord(patient.name.family || '');
  return `${given} ${family}`.trim();
};

const CoverageVerificationResults: React.FC<CoverageVerificationResultsProps> = ({
  isOpen,
  onClose,
  patientName = "Christopher James Davis",
  patient,
  onTransactionCreated
}) => {
  const { stediMode } = useStediApi();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<Step>('idle');
  const [step1Status, setStep1Status] = useState<StepStatus>('pending');
  const [step2Status, setStep2Status] = useState<StepStatus>('pending');
  const [step3Status, setStep3Status] = useState<StepStatus>('pending');

  const [step1Text, setStep1Text] = useState("");
  const [step2Text, setStep2Text] = useState("");
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [verificationStartTime, setVerificationStartTime] = useState<Date | null>(null);
  const [verificationEndTime, setVerificationEndTime] = useState<Date | null>(null);

  const [verificationData, setVerificationData] = useState<VerificationDataRow[]>(API_VERIFICATION_DATA);
  const [codeAnalysisText, setCodeAnalysisText] = useState(CODE_LEVEL_DATA);

  // Memoized filter results to avoid redundant calculations
  const verifiedFields = useMemo(
    () => verificationData.filter(r => r.missing === 'N'),
    [verificationData]
  );
  const verifiedFieldsCount = verifiedFields.length;
  const missingFieldsCount = useMemo(
    () => verificationData.filter(r => r.missing === 'Y').length,
    [verificationData]
  );

  // Refs for auto-scrolling
  const contentRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to active step
  const scrollToStep = (stepRef: React.RefObject<HTMLDivElement | null>) => {
    if (stepRef.current && contentRef.current) {
      const stepElement = stepRef.current;
      const contentElement = contentRef.current;

      // Scroll to the step with some offset for better visibility
      const elementTop = stepElement.offsetTop;
      const offset = 20; // Small offset from top

      contentElement.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when current step changes
  useEffect(() => {
    if (currentStep === 'step1' && step1Status === 'in_progress') {
      scrollToStep(step1Ref);
    } else if (currentStep === 'step2' && step2Status === 'in_progress') {
      scrollToStep(step2Ref);
    }
  }, [currentStep, step1Status, step2Status]);

  // Throttled auto-scroll during typing to prevent layout thrashing
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (step1Status === 'in_progress' && contentRef.current) {
      if (scrollTimeoutRef.current) return; // Skip if already scheduled
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
        scrollTimeoutRef.current = null;
      }, 50); // Throttle to every 50ms
    }
  }, [step1Text, step1Status]);

  useEffect(() => {
    if (step2Status === 'in_progress' && contentRef.current) {
      if (scrollTimeoutRef.current) return; // Skip if already scheduled
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
        scrollTimeoutRef.current = null;
      }, 50); // Throttle to every 50ms
    }
  }, [step2Text, step2Status]);

  // Optimized typing animation using requestAnimationFrame and chunk updates
  const typeText = (
    fullText: string,
    setText: (text: string) => void,
    speed: number = 10
  ): Promise<void> => {
    return new Promise((resolve) => {
      // If speed is 0 or very low, just set the text immediately for best performance
      if (speed === 0) {
        setText(fullText);
        resolve();
        return;
      }

      let index = 0;
      let lastUpdateTime = performance.now();
      const charsPerFrame = Math.max(1, Math.floor(100 / speed)); // Adaptive chunk size

      const animate = (currentTime: number) => {
        const elapsed = currentTime - lastUpdateTime;

        if (elapsed >= speed) {
          lastUpdateTime = currentTime;
          index = Math.min(index + charsPerFrame, fullText.length);
          setText(fullText.slice(0, index));

          if (index >= fullText.length) {
            resolve();
            return;
          }
        }

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  };

  // Fetch current user when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
      }
    };
    fetchCurrentUser();
  }, []);

  // Function to save transaction history to database
  const saveTransactionHistory = async (startTime: Date, endTime: Date, currentVerificationData: VerificationDataRow[], currentStep1Text: string) => {
    if (!patient?.id) {
      return;
    }

    const isRealDataMode = currentUser?.stediMode && currentUser.stediMode !== 'mockup';

    // Only save if not in mockup mode
    if (!isRealDataMode) {
      return;
    }

    try {
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const durationText = duration < 60
        ? `${duration}s`
        : `${Math.floor(duration / 60)}m ${duration % 60}s`;

      const currentVerifiedFields = currentVerificationData.filter(r => r.missing === 'N');
      const verificationScore = Math.round((currentVerifiedFields.length / currentVerificationData.length) * 100);

      // Get insurance provider from patient data
      let insuranceProvider = currentVerificationData.find(r => r.saiCode === 'VF000004')?.aiCallValue || '-';
      let insuranceRep = 'API System (Stedi)';

      const patientNameString = formatPatientName(patient);

      const transactionData = {
        requestId: `REQ-${startTime.toISOString().split('T')[0]}-${startTime.toTimeString().slice(0, 5).replace(':', '')}`,
        patientId: patient.id,
        patientName: patientNameString,
        type: 'API',
        method: 'POST /api/benefits/query',
        startTime: startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime: endTime.toISOString().slice(0, 19).replace('T', ' '),
        duration: durationText,
        status: 'SUCCESS',
        insuranceProvider,
        insuranceRep,
        runBy: 'Smith AI System',
        verificationScore,
        fetchStatus: 'completed',
        saveStatus: 'completed',
        responseCode: '200',
        endpoint: 'https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3',
        eligibilityCheck: 'ACTIVE - Policy verified via STEDI API',
        benefitsVerification: `Verified ${currentVerifiedFields.length} out of ${currentVerificationData.length} fields`,
        coverageDetails: 'Coverage details retrieved and verified via API',
        deductibleInfo: 'Deductible information retrieved from API response',
        rawResponse: currentStep1Text || '',
        dataVerified: currentVerifiedFields.map(r => r.fieldName)
      };


      // First, try to find an existing 'Waiting' API transaction for this patient
      const transactionsResponse = await fetch('/api/transactions', {
        credentials: 'include'
      });

      let waitingTransaction = null;
      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json();
        const patientTransactions = data.transactions.filter((t: any) => t.patientId === patient.id);
        waitingTransaction = patientTransactions.find((t: any) => t.type === 'API' && t.status === 'Waiting');
      }

      let response;
      if (waitingTransaction) {
        // Update existing 'Waiting' transaction
        response = await fetch(`/api/transactions/${waitingTransaction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(transactionData)
        });
      } else {
        // Create new transaction (fallback for patients without a Waiting transaction)
        response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(transactionData)
        });
      }

      if (response.ok) {
        // Trigger refresh of transaction history
        if (onTransactionCreated) {
          onTransactionCreated();
        }
      } else {
        const error = await response.json();
      }
    } catch (error) {
    }
  };

  // Function to save coverage by code data to database
  const saveCoverageByCodeData = async (currentVerificationData: VerificationDataRow[]) => {
    if (!patient?.id) {
      return;
    }

    const isRealDataMode = currentUser?.stediMode && currentUser.stediMode !== 'mockup';

    // Only save if not in mockup mode
    if (!isRealDataMode) {
      return;
    }

    try {
      const response = await fetch(`/api/coverage-by-code/${patient.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          coverageData: currentVerificationData,
          dataMode,
          stediTest
        })
      });

      if (response.ok) {
      } else {
        const error = await response.json();
      }
    } catch (error) {
    }
  };

  // Start verification process
  useEffect(() => {
    if (isOpen && currentStep === 'idle') {
      // Auto-start after a brief delay
      setTimeout(() => {
        startVerification();
      }, 500);
    }
  }, [isOpen]);

  // Auto-scroll to step 3 when it's completed to show results
  useEffect(() => {
    if (step3Status === 'completed' && step3Ref.current && contentRef.current) {
      // Give a moment for the DOM to update, then scroll
      setTimeout(() => {
        scrollToStep(step3Ref);
      }, 100);
    }
  }, [step3Status]);

  // Show completion toast when step 3 completes
  useEffect(() => {
    if (step3Status === 'completed') {
      // Auto-hide toast after 4 seconds
      const timer = setTimeout(() => {
        setShowCompletionToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step3Status]);

  const startVerification = async () => {
    console.log('CoverageVerification: startVerification invoked. Current stediMode:', stediMode);
    try {
      // Track start time
      const startTime = new Date();
      setVerificationStartTime(startTime);

      // Step 1: Get API Result
      setCurrentStep('step1');
      setStep1Status('in_progress');
      await new Promise(resolve => setTimeout(resolve, 50));

      let apiResponseText = SAMPLE_API_RESPONSE;

      // Logic depends on stediMode
      if (stediMode === 'mockup') {
        console.log('CoverageVerification: Mode is mockup, using sample response');
        // Already set to SAMPLE_API_RESPONSE
      } else if (stediMode === 'test-data') {
        console.log('CoverageVerification: Mode is test-data, calling verifyStediAPI with test payload');
        // For test-data, we don't need real subscriber/provider from patient
        const result = await stediService.verifyStediAPI({} as any, {} as any, 'test-data');
        if (result.success && result.data) {
          apiResponseText = JSON.stringify(result.data, null, 2);
        }
      } else if (stediMode === 'real-data') {
        console.log('CoverageVerification: Mode is real-data, validating patient info');

        if (patient && (patient as any).insurance && (patient as any).insurance.length > 0) {
          const insurance = (patient as any).insurance[0];

          let decryptedBirthDate = patient.birthDate || "1987-05-21";
          let decryptedSubscriberId = insurance.subscriberId || "0000000000";

          // Decrypt fields if they are masked or encrypted
          try {
            console.log('CoverageVerification: Decrypting sensitive fields for real-time verification...');

            // Decrypt Birth Date
            if (decryptedBirthDate.includes('*') || (patient as any).birthDateEncrypted) {
              const result = await decryptSensitiveData(patient.id, 'birthDate');
              if (result) {
                decryptedBirthDate = result;
                console.log('CoverageVerification: Decrypted Birth Date successfully');
              }
            }

            // Decrypt Subscriber ID
            if (decryptedSubscriberId.includes('*') || (insurance as any).subscriberIdEncrypted || (patient as any).subscriberIdEncrypted) {
              const result = await decryptInsuranceField(patient.id, insurance.id, 'subscriberId');
              if (result) {
                decryptedSubscriberId = result;
                console.log('CoverageVerification: Decrypted Subscriber ID successfully');
              }
            }
          } catch (decryptError) {
            console.error('CoverageVerification: Decryption failed, using available data:', decryptError);
            // Continue with whatever data we have
          }

          const subscriber: Subscriber = {
            memberId: decryptedSubscriberId,
            firstName: capitalizeWord(patient.name?.given?.[0] || "John"),
            lastName: capitalizeWord(patient.name?.family || "Doe"),
            dateOfBirth: decryptedBirthDate.replace(/-/g, '') // Ensure format is YYYYMMDD
          };

          const provider: Provider = {
            npi: currentUser?.provider?.npiNumber || "1234567890",
            organizationName: currentUser?.provider?.name || "Smith Dental Clinic"
          };

          console.log('CoverageVerification: Calling verifyStediAPI with real decrypted data:', {
            subscriber: { ...subscriber, memberId: '***', dateOfBirth: '***' },
            provider
          });

          const result = await stediService.verifyStediAPI(subscriber, provider, 'real-data', patient);

          if (result.success && result.data) {
            apiResponseText = JSON.stringify(result.data, null, 2);
          } else if (result.error) {
            console.error('CoverageVerification: API Error:', result.error);
            apiResponseText = JSON.stringify({ error: result.error, stediResponse: result.stediResponse }, null, 2);
          }
        } else {
          console.warn('CoverageVerification: Real-data mode selected but patient insurance is missing!');
          apiResponseText = JSON.stringify({
            error: "Patient insurance information is missing. Cannot perform real-time verification.",
            fallback: "Using sample data for demonstration purposes."
          }, null, 2);
        }
      }

      setStep1Text(apiResponseText);
      setStep1Status('completed');

      // Local variables to hold parsed data to avoid stale state issues
      let finalVerificationData = API_VERIFICATION_DATA;
      let finalAnalysisText = CODE_LEVEL_DATA;

      // Update dynamic data if not in mockup mode
      if (stediMode !== 'mockup') {
        try {
          const parsed = parseStediResponse(JSON.parse(apiResponseText));
          finalVerificationData = parsed.verificationData;
          finalAnalysisText = parsed.codeAnalysis;

          // Update state for render
          setVerificationData(finalVerificationData);
          setCodeAnalysisText(finalAnalysisText);
        } catch (e) {
          console.error('Failed to parse STEDI response:', e);
        }
      } else {
        setVerificationData(API_VERIFICATION_DATA);
        setCodeAnalysisText(CODE_LEVEL_DATA);
      }

      // Step 2: Analyze and convert to code-level
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentStep('step2');
      setStep2Status('in_progress');

      // Use the local finalAnalysisText variable directly
      await typeText(finalAnalysisText, setStep2Text, 0);
      setStep2Status('completed');

      // Step 3: Display verification results in table format
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentStep('step3');
      setStep3Status('in_progress');
      await new Promise(resolve => setTimeout(resolve, 50));
      setStep3Status('completed');

      // Final Step: Save data to database using the fresh local variables
      const endTime = new Date();
      setVerificationEndTime(endTime);
      setShowCompletionToast(true);

      saveCoverageByCodeData(finalVerificationData);
      saveTransactionHistory(startTime, endTime, finalVerificationData, apiResponseText);

    } catch (error) {
      console.error('CoverageVerification: Error during verification process:', error);
      setStep1Status('completed');
      setStep1Text(JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, null, 2));
    }
  };

  const resetModal = () => {
    setCurrentStep('idle');
    setStep1Status('pending');
    setStep2Status('pending');
    setStep3Status('pending');
    setStep1Text("");
    setStep2Text("");
    setVerificationData(API_VERIFICATION_DATA);
    setCodeAnalysisText(CODE_LEVEL_DATA);
    setVerificationStartTime(null);
    setVerificationEndTime(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
              verified_user
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Coverage Verification Results
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {patientName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-center">
            {/* Step 1 */}
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step1Status === 'completed'
                ? 'bg-green-500 text-white'
                : step1Status === 'in_progress'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                }`}>
                {step1Status === 'completed' ? '✓' : '1'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-slate-900 dark:text-white">API Response</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">JSON Data</div>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-2 ${step1Status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}></div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step2Status === 'completed'
                ? 'bg-green-500 text-white'
                : step2Status === 'in_progress'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                }`}>
                {step2Status === 'completed' ? '✓' : '2'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-slate-900 dark:text-white">Code Analysis</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Coverage Codes</div>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-2 ${step2Status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}></div>

            {/* Step 3 */}
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step3Status === 'completed'
                ? 'bg-green-500 text-white'
                : step3Status === 'in_progress'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                }`}>
                {step3Status === 'completed' ? '✓' : '3'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-slate-900 dark:text-white">Verification Data</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Results Table</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: API JSON Response */}
          {(currentStep === 'step1' || step1Status === 'completed') && (
            <div ref={step1Ref} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    api
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Step 1: API Response
                  </h3>
                </div>
                {step1Status === 'completed' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Completed
                  </span>
                )}
                {step1Status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Processing...
                  </span>
                )}
              </div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400 whitespace-pre">{step1Text}</pre>
                {step1Status === 'in_progress' && (
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Code-level Coverage Analysis */}
          {(currentStep === 'step2' || step2Status === 'completed') && (
            <div ref={step2Ref} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
                    analytics
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Step 2: Coverage by Code Analysis
                  </h3>
                </div>
                {step2Status === 'completed' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Completed
                  </span>
                )}
                {step2Status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Analyzing...
                  </span>
                )}
              </div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-cyan-400 whitespace-pre">{step2Text}</pre>
                {step2Status === 'in_progress' && (
                  <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Verification Data Results Table */}
          {(currentStep === 'step3' || step3Status !== 'pending') && (
            <div ref={step3Ref} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                    table_chart
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Step 3: API Verification Results
                  </h3>
                </div>
                {step3Status === 'completed' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Completed
                  </span>
                )}
                {step3Status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Processing...
                  </span>
                )}
              </div>
              {step3Status !== 'pending' && (
                <VerificationDataPanel
                  data={verificationData}
                  showTabs={true}
                  title="API Verification Results"
                  subtitle="Watching"
                />
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          {step3Status === 'completed' && (
            <>
              <button
                onClick={resetModal}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Run Again
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </>
          )}
          {step3Status !== 'completed' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Completion Toast Notification - Centered in Modal */}
      {showCompletionToast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md pointer-events-auto animate-fadeIn">
            {/* Success Header */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-6 py-4 flex items-start gap-4">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0">
                task_alt
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  API Verification Complete
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The API run has successfully verified coverage details. However, {missingFieldsCount} fields are still missing and require voice AI verification.
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 flex-shrink-0">check_circle</span>
                <span className="text-slate-700 dark:text-slate-300"><strong>Verified:</strong> {verifiedFieldsCount} fields successfully verified via API</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-status-red flex-shrink-0">pending</span>
                <span className="text-slate-700 dark:text-slate-300"><strong>Still Missing:</strong> {missingFieldsCount} fields need voice AI verification</span>
              </div>
            </div>

            {/* Next Step */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Next Step:</strong> Run AI Call to complete the verification process
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageVerificationResults;
