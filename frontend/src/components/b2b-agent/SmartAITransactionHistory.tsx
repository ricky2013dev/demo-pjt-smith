import React, { useState, useEffect, useRef } from 'react';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';
import { getTransactionTypeColor } from '@/constants/transactionTypes';
import { ImageViewerWithModal } from './ImageViewer';

interface CallCommunication {
  timestamp: string;
  speaker: 'AI' | 'InsuranceRep' | 'System';
  message: string;
  type: 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note';
}

interface Transaction {
  id: string;
  requestId: string;
  type: 'FETCH' | 'API' | 'CALL' | 'FAX' | 'SAVE';
  method: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  insuranceRep: string;
  runBy: string;
  dataVerified?: string[];
  verificationScore: number;
  fetchStatus: 'completed' | 'pending';
  saveStatus: 'completed' | 'pending';
  responseCode?: string;
  endpoint?: string;
  phoneNumber?: string;
  errorMessage?: string;
  callHistory?: CallCommunication[];
  eligibilityCheck?: string;
  benefitsVerification?: string;
  coverageDetails?: string;
  deductibleInfo?: string;
  transcript?: string;
  rawResponse?: string;
}

export const mockData: Transaction[] = [
  // FETCH PMS
  {
    id: '0',
    requestId: 'REQ-2025-11-28-0800',
    type: 'FETCH',
    method: 'GET /pms/patient/data',
    startTime: '2025-11-28 08:00:00',
    endTime: '2025-11-28 08:02:15',
    duration: '2m 15s',
    status: 'SUCCESS',
    patientId: 'P002',
    patientName: 'Sarah Johnson',
    insuranceProvider: '-',
    insuranceRep: '-',
    runBy: 'Smith AI System',
    dataVerified: ['Patient ID', 'Patient Name', 'DOB', 'Contact Info', 'Medical History'],
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'pending',
    endpoint: 'https://pms.dental.local/api/patient/data',
    details: {
      eligibilityCheck: 'Patient record retrieved from PMS',
      benefitsVerification: 'Data synchronized with local database',
      coverageDetails: 'Patient active in system',
      deductibleInfo: 'Initial data fetch completed',
      transcript: 'Fetch PMS data completed successfully. Patient information retrieved and validated.'
    }
  },
  // API SUCCESS
  {
    id: '1',
    requestId: 'REQ-2025-11-28-0930',
    type: 'API',
    method: 'POST /api/benefits/query',
    startTime: '2025-11-28 09:30:15',
    endTime: '2025-11-28 09:31:25',
    duration: '1m 10s',
    status: 'SUCCESS',
    patientId: 'P001',
    patientName: 'Robert Taylor',
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'API System',
    runBy: 'Smith AI System',
    dataVerified: ['Patient Name', 'Patient SSN', 'Patient Date of Birth', 'Relationship to Subscriber', 'Subscriber Name', 'Subscriber SSN', 'Subscriber Date of Birth', 'Subscriber ID Number', 'Insurance Company', 'Insurer Type - Primary', 'Insurer Type - Secondary', 'Insurance Address', 'Insurance Phone', 'Employer', 'Group Number', 'Effective Date', 'Renewal Month', 'Yearly Maximum', 'Deductible Per Individual', 'Deductible Per Family', 'Deductible Applies To - Preventative', 'Deductible Applies To - Basic', 'Deductible Applies To - Major', 'Preventative Covered At (%)', 'Preventative Waiting Period', 'Preventative Effective Date', 'Bitewing Frequency'],
    verificationScore: 80,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    responseCode: '200',
    endpoint: 'https://api.cigna.com/dental/benefits',
    details: {
      eligibilityCheck: 'ACTIVE - Policy effective through 12/31/2026. Policy status: active and in good standing. Verification date: 01/21/2025',
      benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50% | Waiting Periods: Preventive - None, Basic - None, Major - 12 months',
      coverageDetails: 'Annual Maximum: $2,000 | Used: $450 | Remaining: $1,550 | Plan Type: PPO Premium',
      deductibleInfo: 'Individual Deductible: $50 | Family Deductible: $150 | Deductible Met: $50',
      rawResponse: '{"verification_id":"VER-2025-001234","timestamp":"2025-01-21T10:30:45Z","patient":{"name":"Michael Robert Anderson","dob":"1978-07-22","member_id":"BCBS123456789"},"insurance":{"carrier":"Blue Cross Blue Shield","group_number":"GRP987654","policy_status":"active","effective_date":"2024-01-01","plan_type":"PPO Premium"},"eligibility":{"active":true,"coverage_status":"verified","verification_date":"2025-01-21"},"benefits":{"annual_maximum":2000,"annual_used":450,"annual_remaining":1550,"deductible":50,"deductible_met":50,"preventive_coverage":"100%","basic_coverage":"80%","major_coverage":"50%","waiting_periods":{"preventive":"none","basic":"none","major":"12 months"}}}'
    }
  },
  // FAX DOCUMENT ANALYSIS
  {
    id: '2',
    requestId: 'REQ-2025-11-28-0915',
    type: 'FAX',
    method: 'FAX /fax/document-analysis',
    startTime: '2025-11-28 09:15:30',
    endTime: '2025-11-28 09:20:55',
    duration: '5m 25s',
    status: 'SUCCESS',
    patientId: 'P002',
    patientName: 'Sarah Johnson',
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'Fax System',
    runBy: 'Smith AI System',
    dataVerified: ['Member ID', 'Patient Name', 'Plan Name', 'Effective Date', 'Coverage', 'Deductible', 'Annual Maximum'],
    verificationScore: 30,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    details: {
      eligibilityCheck: 'ACTIVE - Policy effective through 12/31/2025',
      benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50%',
      coverageDetails: 'Annual Maximum: $2,000 | Used: $0 | Remaining: $2,000',
      deductibleInfo: 'Individual Deductible: $50 | Met: $0',
      transcript: 'Fax document analysis completed successfully. Insurance information extracted and verified from fax document.'
    }
  },
  // CALL SUCCESS
  {
    id: '3',
    requestId: 'REQ-2025-11-28-1045',
    type: 'CALL',
    method: 'VOICE /ai-agent/verify',
    startTime: '2025-11-28 10:45:22',
    endTime: '2025-11-28 11:33:22',
    duration: '48m 0s',
    status: 'SUCCESS',
    patientId: 'P002',
    patientName: 'Sarah Johnson',
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'Amanda Rodriguez',
    runBy: 'Smith AI System',
    dataVerified: ['Eligibility', 'Benefits', 'Coverage Limits', 'Deductibles'],
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'pending',
    phoneNumber: '1-800-555-0188',
    callHistory: [
      {
        timestamp: '10:45:22',
        speaker: 'AI',
        message: 'Good morning, this is Smith Dental verification system. I am calling to verify dental insurance benefits for patient Sarah Johnson.',
        type: 'question'
      },
      {
        timestamp: '10:45:35',
        speaker: 'InsuranceRep',
        message: 'Good morning, this is Amanda from Cigna Dental. I can help you with that. May I have the member ID or policy number?',
        type: 'answer'
      },
      {
        timestamp: '10:45:50',
        speaker: 'AI',
        message: 'Thank you. The member ID is CIG-4567890 and the patient date of birth is March 15, 1990.',
        type: 'confirmation'
      },
      {
        timestamp: '10:46:10',
        speaker: 'InsuranceRep',
        message: 'I have Sarah Johnson in our system. Policy is active and in good standing. What information do you need to verify?',
        type: 'answer'
      },
      {
        timestamp: '10:46:25',
        speaker: 'AI',
        message: 'We need a comprehensive benefits verification. Can you confirm the policy effective dates and annual maximum?',
        type: 'question'
      },
      {
        timestamp: '10:46:45',
        speaker: 'InsuranceRep',
        message: 'Policy effective dates are January 1, 2025 through December 31, 2026. Annual maximum is $2,000 per calendar year.',
        type: 'answer'
      },
      {
        timestamp: '10:47:05',
        speaker: 'AI',
        message: 'How much of the annual maximum has been used?',
        type: 'question'
      },
      {
        timestamp: '10:47:20',
        speaker: 'InsuranceRep',
        message: 'None has been used. The full $2,000 is still available.',
        type: 'answer'
      },
      {
        timestamp: '10:47:35',
        speaker: 'AI',
        message: 'What is the individual deductible?',
        type: 'question'
      },
      {
        timestamp: '10:47:50',
        speaker: 'InsuranceRep',
        message: 'Individual deductible is $50 per calendar year and has not been met.',
        type: 'answer'
      },
      {
        timestamp: '10:48:10',
        speaker: 'AI',
        message: 'Can you provide coverage percentages for preventive, basic, and major services?',
        type: 'question'
      },
      {
        timestamp: '10:48:35',
        speaker: 'InsuranceRep',
        message: 'Preventive is covered at 100% with no deductible. Basic is 80% after deductible. Major is 50% after deductible.',
        type: 'answer'
      },
      {
        timestamp: '10:49:00',
        speaker: 'AI',
        message: 'Thank you. Let me confirm: Policy active through 12/31/2026, annual max $2,000 (unused), deductible $50 (not met), Preventive 100%, Basic 80%, Major 50%. Is that correct?',
        type: 'confirmation'
      },
      {
        timestamp: '10:49:20',
        speaker: 'InsuranceRep',
        message: 'Yes, that is absolutely correct. Is there anything else you need?',
        type: 'answer'
      },
      {
        timestamp: '10:49:35',
        speaker: 'AI',
        message: 'No, that covers everything we needed. Thank you for your assistance.',
        type: 'confirmation'
      },
      {
        timestamp: '10:49:45',
        speaker: 'System',
        message: 'Call completed successfully. All required information verified. Status: SUCCESS',
        type: 'note'
      }
    ],
    details: {
      transcript: 'Complete verification successful for patient Sarah Johnson. All benefits verified.',
      benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50%',
      coverageDetails: 'Annual Maximum: $2,000 | Used: $0 | Remaining: $2,000',
      deductibleInfo: 'Individual Deductible: $50 | Met: $0'
    }
  },
  // SAVE TO PMS
  {
    id: '4',
    requestId: 'REQ-2025-11-28-1135',
    type: 'SAVE',
    method: 'POST /pms/patient/save',
    startTime: '2025-11-28 11:35:00',
    endTime: '2025-11-28 11:36:30',
    duration: '1m 30s',
    status: 'SUCCESS',
    patientId: 'P002',
    patientName: 'Sarah Johnson',
    insuranceProvider: '-',
    insuranceRep: '-',
    runBy: 'Smith AI System',
    dataVerified: ['Verified Data', 'Insurance Benefits', 'Coverage Details', 'Deductible Info', 'Eligibility Status'],
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    endpoint: 'https://pms.dental.local/api/patient/save',
    details: {
      eligibilityCheck: 'All verification data saved to PMS',
      benefitsVerification: 'Insurance benefits synchronized with PMS',
      coverageDetails: 'Coverage details updated in patient record',
      deductibleInfo: 'Deductible information recorded in system',
      transcript: 'Save to PMS completed successfully. All verified information has been synchronized with the patient management system.'
    }
  }
];

type FaxStep = 'idle' | 'step1' | 'step2' | 'step3' | 'completed';
type StepStatus = 'pending' | 'in_progress' | 'completed';

// Create a global interface to expose fax functionality
declare global {
  interface Window {
    openFaxModal?: () => void;
  }
}

interface SmartAITransactionHistoryProps {
  patientId?: string;
  refreshTrigger?: number;
}

const SmartAITransactionHistory: React.FC<SmartAITransactionHistoryProps> = ({ patientId, refreshTrigger }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'API' | 'CALL' | 'FAX'>('ALL');
  const [activeDetailTab, setActiveDetailTab] = useState<{[key: string]: string}>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fax modal states
  const [currentFaxStep, setCurrentFaxStep] = useState<FaxStep>('idle');
  const [step1Status, setStep1Status] = useState<StepStatus>('pending');
  const [step2Status, setStep2Status] = useState<StepStatus>('pending');
  const [step3Status, setStep3Status] = useState<StepStatus>('pending');
  const [step1Text, setStep1Text] = useState("");
  const [step2Text, setStep2Text] = useState("");
  const [step3Text, setStep3Text] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch current user to check data mode
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

  // Mock data for when data mode is OFF
  const getMockTransactions = (): Transaction[] => {
    // Flatten the details object from old mockData to match new interface
    return mockData.map((txn: any) => ({
      ...txn,
      eligibilityCheck: txn.details?.eligibilityCheck,
      benefitsVerification: txn.details?.benefitsVerification,
      coverageDetails: txn.details?.coverageDetails,
      deductibleInfo: txn.details?.deductibleInfo,
      transcript: txn.details?.transcript,
      rawResponse: txn.details?.rawResponse,
      // Filter by patient if needed
      patientId: patientId || txn.patientId
    })).filter((txn: Transaction) => !patientId || txn.patientId === patientId);
  };

  // Fetch transactions from API or use mock data
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Check if data mode is enabled
      const dataMode = currentUser?.dataSource;

      if (!dataMode) {
        // Data mode is OFF - use mock data
        setTransactions(getMockTransactions());
        setLoading(false);
        return;
      }

      // Data mode is ON - fetch from database

      const response = await fetch('/api/transactions', {
        credentials: 'include'
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      if (data.success && data.transactions) {

        // Filter by patient if patientId is provided
        const filteredTransactions = patientId
          ? data.transactions.filter((t: Transaction) => t.patientId === patientId)
          : data.transactions;

        setTransactions(filteredTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      // Fallback to empty array on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser !== null) {
      fetchTransactions();
    }
  }, [patientId, refreshTrigger, currentUser]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (!activeDetailTab[id]) {
      setActiveDetailTab({...activeDetailTab, [id]: 'action'});
    }
  };

  const setDetailTab = (transactionId: string, tab: string) => {
    setActiveDetailTab({...activeDetailTab, [transactionId]: tab});
  };

  // Typing animation effect
  const typeText = (
    fullText: string,
    setText: (text: string) => void,
    speed: number = 15
  ): Promise<void> => {
    return new Promise((resolve) => {
      let index = 0;
      const intervalId = setInterval(() => {
        if (index <= fullText.length) {
          setText(fullText.substring(0, index));
          index++;
        } else {
          clearInterval(intervalId);
          resolve();
        }
      }, speed);
    });
  };

  // Auto-scroll during typing - disabled for step 1 since it now displays an image
  useEffect(() => {
    // Step 1 now displays an image, no need to auto-scroll
  }, [step1Text]);

  useEffect(() => {
    if (step2Status === 'in_progress' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [step2Text]);

  useEffect(() => {
    if (step3Status === 'in_progress' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [step3Text]);


  const insuranceDataAnalysis = `INSURANCE FAX ANALYSIS - DETAILED BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient Information
──────────────────
Name: Sarah Johnson
Member ID: CIG-4567890
DOB: 03/15/1992
Group: Individual Plan
Status: VERIFIED - Active Coverage

Policy Details
──────────────
Carrier: Cigna Dental Insurance
Plan: Dental PPO
Effective Date: 01/01/2025
Expiration: 12/31/2025
Network: Cigna DPO Network (In-Network)

Coverage Structure
──────────────────
Preventive Services:        100% Coverage
  • 2 Cleanings/Year
  • 2 Exams/Year
  • X-rays (Periodic)
  • Fluoride (Limited Age)

Basic Services:              80% Coverage
  • Fillings
  • Root Scaling & Planing
  • Simple Extractions
  • Requires: $50 Deductible

Major Services:              50% Coverage
  • Crowns (12-month wait)
  • Bridges
  • Dentures
  • Root Canals
  • Requires: Deductible + Major Wait

Deductible Status
──────────────────
Individual Deductible: $50 (Not Yet Met)
Family Deductible: $100 (Not Yet Met)

Annual Maximum Benefit
──────────────────────
Total Benefit: $2,000 per calendar year
Currently Used: $0
Remaining: $2,000 (100%)

Waiting Periods
──────────────
Preventive: None (Immediately Available)
Basic: None (Immediately Available)
Major: 12 Months (from Effective Date)

Important Notes
──────────────
✓ Member is eligible for coverage
✓ No claim limitations for preventive care
✓ Prior authorization required for major services
✓ Dependent coverage available upon request`;

  // Verification data for step 3 - similar to Run API Verification
  const verificationDataRows = [
    { saiCode: "VF000001", refInsCode: "D001", category: "Patient", fieldName: "Member ID", preStepValue: "CIG-4567890", missing: "N", aiCallValue: "CIG-4567890", verifiedBy: "FAX" },
    { saiCode: "VF000002", refInsCode: "D002", category: "Patient", fieldName: "Patient Name", preStepValue: "Sarah Johnson", missing: "N", aiCallValue: "Sarah Johnson", verifiedBy: "FAX" },
    { saiCode: "VF000003", refInsCode: "D003", category: "Policy", fieldName: "Plan Name", preStepValue: "Cigna Dental PPO", missing: "N", aiCallValue: "Cigna Dental PPO", verifiedBy: "FAX" },
    { saiCode: "VF000004", refInsCode: "D004", category: "Policy", fieldName: "Effective Date", preStepValue: "01/01/2025", missing: "N", aiCallValue: "01/01/2025", verifiedBy: "FAX" },
    { saiCode: "VF000005", refInsCode: "D005", category: "Coverage", fieldName: "Preventive Coverage", preStepValue: "100%", missing: "N", aiCallValue: "100%", verifiedBy: "FAX" },
    { saiCode: "VF000006", refInsCode: "D006", category: "Coverage", fieldName: "Basic Coverage", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "FAX" },
    { saiCode: "VF000007", refInsCode: "D007", category: "Coverage", fieldName: "Major Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "FAX" },
    { saiCode: "VF000008", refInsCode: "D008", category: "Deductible", fieldName: "Individual Deductible", preStepValue: "$50", missing: "N", aiCallValue: "$50", verifiedBy: "FAX" },
    { saiCode: "VF000009", refInsCode: "D009", category: "Deductible", fieldName: "Deductible Status", preStepValue: "Not Met", missing: "N", aiCallValue: "Not Met", verifiedBy: "FAX" },
    { saiCode: "VF000010", refInsCode: "D010", category: "Benefit", fieldName: "Annual Maximum", preStepValue: "$2,000", missing: "N", aiCallValue: "$2,000", verifiedBy: "FAX" },
  ];

  // Start fax verification process
  const startFaxVerification = async () => {
    setCurrentFaxStep('step1');
    // Show loading state first for 10 seconds
    setStep1Status('in_progress');

    // Wait 10 seconds for loading animation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Then show the image
    setStep1Text('image');
    setStep1Status('completed');

    // Step 2: Analysis
    await new Promise(resolve => setTimeout(resolve, 800));
    setCurrentFaxStep('step2');
    setStep2Status('in_progress');
    await new Promise(resolve => setTimeout(resolve, 100));
    await typeText(insuranceDataAnalysis, setStep2Text, 5);
    await new Promise(resolve => setTimeout(resolve, 50));
    setStep2Status('completed');

    // Step 3: Verification Data - display as completed without typing
    await new Promise(resolve => setTimeout(resolve, 150));
    setCurrentFaxStep('step3');
    setStep3Status('in_progress');
    await new Promise(resolve => setTimeout(resolve, 100));
    setStep3Status('completed');
  };

  // Open fax modal handler
  const handleRequestFaxDocument = () => {
    setCurrentFaxStep('idle');
    setStep1Status('pending');
    setStep2Status('pending');
    setStep3Status('pending');
    setStep1Text('');
    setStep2Text('');
    setStep3Text('');

    setTimeout(() => {
      startFaxVerification();
    }, 500);
  };

  // Reset fax modal
  const resetFaxModal = () => {
    setCurrentFaxStep('idle');
    setStep1Status('pending');
    setStep2Status('pending');
    setStep3Status('pending');
    setStep1Text('');
    setStep2Text('');
    setStep3Text('');
  };

  // Expose fax modal function globally
  useEffect(() => {
    window.openFaxModal = () => {
      handleRequestFaxDocument();
    };
    return () => {
      delete window.openFaxModal;
    };
  }, []);

  // Format transcript with styling
  const formatTranscript = (transcript: string) => {
    const lines = transcript.split('\n');
    return lines.map((line, idx) => {
      // Check if line starts with AI Agent: or Insurance Rep: or Outcome:
      if (line.startsWith('AI Agent:')) {
        const content = line.substring(10); // Remove "AI Agent: "
        // Highlight key values in blue
        const formattedContent = highlightKeyValues(content);
        return (
          <div key={idx} className="mb-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">AI Agent:</span>
            <span className="text-slate-700 dark:text-slate-300">{formattedContent}</span>
          </div>
        );
      } else if (line.startsWith('Insurance Rep:')) {
        const content = line.substring(15); // Remove "Insurance Rep: "
        const formattedContent = highlightKeyValues(content);
        return (
          <div key={idx} className="mb-2">
            <span className="font-medium text-slate-600 dark:text-slate-400">Insurance Rep:</span>
            <span className="text-slate-700 dark:text-slate-300">{formattedContent}</span>
          </div>
        );
      } else if (line.startsWith('Outcome:')) {
        const content = line.substring(9); // Remove "Outcome: "
        const formattedContent = highlightKeyValues(content);
        return (
          <div key={idx} className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <span className="font-bold text-green-700 dark:text-green-400">Outcome:</span>
            <span className="text-slate-700 dark:text-slate-300">{formattedContent}</span>
          </div>
        );
      } else if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      } else {
        return (
          <div key={idx} className="mb-2 text-slate-700 dark:text-slate-300">
            {highlightKeyValues(line)}
          </div>
        );
      }
    });
  };

  // Highlight key values like policy numbers, procedure codes, reference numbers
  const highlightKeyValues = (text: string) => {
    // Pattern for: policy numbers, procedure codes (D####), reference numbers, dates, dollar amounts
    const pattern = /([A-Z]{3,}-[0-9]+|D[0-9]{4}|BV[0-9-]+|\$[0-9,]+|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}|January [0-9]{1,2}, [0-9]{4}|December [0-9]{1,2}, [0-9]{4}|[0-9]+%)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add highlighted match
      parts.push(
        <span key={match.index} className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Filter data based on selected filters
  const filteredData = transactions.filter(transaction => {
    const typeMatch = typeFilter === 'ALL' || transaction.type === typeFilter;
    return typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 dark:text-green-400';
      case 'PARTIAL':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'FAILED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTypeColor = (type: string) => {
    // Handle FAX type which is not in the shared module
    if (type === 'FAX') {
      return 'text-cyan-600 dark:text-cyan-400';
    }
    return getTransactionTypeColor(type as any) || 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        {/* Type Filters */}
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            typeFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          ALL
        </button>
        <button
          onClick={() => setTypeFilter('API')}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            typeFilter === 'API'
              ? 'bg-blue-600 text-white'
              : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          API
        </button>
        <button
          onClick={() => setTypeFilter('FAX')}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            typeFilter === 'FAX'
              ? 'bg-cyan-600 text-white'
              : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
          }`}
        >
          FAX
        </button>
        <button
          onClick={() => setTypeFilter('CALL')}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            typeFilter === 'CALL'
              ? 'bg-purple-600 text-white'
              : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          CALL
        </button>

        {/* Clear Filters */}
        {typeFilter !== 'ALL' && (
          <button
            onClick={() => {
              setTypeFilter('ALL');
            }}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
          >
            Clear
          </button>
        )}

        {/* Results Count */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Refresh transactions"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {filteredData.length} of {transactions.length}
          </div>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr] gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium">
          <div className="w-6"></div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">Start Time</div>
            <div className="col-span-1 text-center">Duration</div>
            <div className="col-span-1 text-center">Type</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2">Insurance Provider</div>
            <div className="col-span-2">Insurance Rep</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-2">Run By</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-2">
                <span className="material-symbols-outlined text-5xl animate-spin">hourglass_bottom</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Loading transactions...</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Fetching data from database</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-2">
                <span className="material-symbols-outlined text-5xl">filter_list_off</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">No transactions found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your filters</p>
            </div>
          ) : (
            filteredData.map((transaction) => (
            <div key={transaction.id} className="group">
              <div
                onClick={() => toggleExpand(transaction.id)}
                className="grid grid-cols-[auto_1fr] gap-3 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="w-6 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg transition-transform duration-200 ${
                    expandedId === transaction.id ? 'rotate-180' : ''
                  }`}>
                    expand_more
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-3 items-center text-sm">
                  <div className="col-span-2">
                    <div className="text-slate-900 dark:text-white">{transaction.startTime}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{transaction.requestId}</div>
                  </div>
                  <div className="col-span-1 text-center font-mono text-xs text-slate-600 dark:text-slate-400">{transaction.duration}</div>
                  <div className={`col-span-1 text-center font-semibold text-xs ${getTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </div>
                  <div className={`col-span-1 text-center font-semibold text-xs ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </div>
                  <div className="col-span-2 text-slate-700 dark:text-slate-300">{transaction.insuranceProvider}</div>
                  <div className="col-span-2 text-slate-600 dark:text-slate-400">{transaction.insuranceRep}</div>
                  <div className="col-span-1 text-center">
                    <span className={`font-semibold text-sm ${
                      transaction.verificationScore >= 90 ? 'text-green-600 dark:text-green-400' :
                      transaction.verificationScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.verificationScore}%
                    </span>
                  </div>
                  <div className="col-span-2 text-slate-700 dark:text-slate-300">{transaction.runBy}</div>
                </div>
              </div>

              {/* Collapsible Detail */}
              {expandedId === transaction.id && (
                <div className="ml-8 p-2 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-200 dark:border-slate-700 px-4">
                    <button
                      onClick={() => setDetailTab(transaction.id, 'action')}
                      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                        (activeDetailTab[transaction.id] || 'action') === 'action'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Transaction Info
                    </button>
                    <button
                      onClick={() => setDetailTab(transaction.id, 'summary')}
                      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                        (activeDetailTab[transaction.id] || 'action') === 'summary'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Transaction Summary
                    </button>
                    {transaction.status === 'SUCCESS' && transaction.callHistory && transaction.callHistory.length > 0 ? (
                      <button
                        onClick={() => setDetailTab(transaction.id, 'callHistory')}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                          (activeDetailTab[transaction.id] || 'action') === 'callHistory'
                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Call History Detail
                      </button>
                    ) : (
                      <button
                        onClick={() => setDetailTab(transaction.id, 'detail')}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                          (activeDetailTab[transaction.id] || 'action') === 'detail'
                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        Transaction Detail
                      </button>
                    )}
                    <button
                      onClick={() => handleRequestFaxDocument()}
                      className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ml-auto"
                      title="Request insurance fax document"
                    >
                      <span className="material-symbols-outlined text-sm align-text-bottom mr-1">description</span>
                      Run Fax Document Analysis
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-8 mx-8">
                    {/* Transaction Action Info Tab */}
                    {(activeDetailTab[transaction.id] || 'action') === 'action' && (
                      <div className="space-y-4 text-sm">
                        {/* Transaction Meta Info */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Request ID</div>
                            <div className="font-mono text-xs text-slate-900 dark:text-white">{transaction.requestId}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Method</div>
                            <div className="font-mono text-xs text-slate-900 dark:text-white">{transaction.method}</div>
                          </div>
                          {transaction.endpoint && (
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Endpoint</div>
                              <div className="font-mono text-xs text-slate-900 dark:text-white truncate">{transaction.endpoint}</div>
                            </div>
                          )}
                          {transaction.phoneNumber && (
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Phone Number</div>
                              <div className="font-mono text-xs text-slate-900 dark:text-white">{transaction.phoneNumber}</div>
                            </div>
                          )}
                          {transaction.responseCode && (
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Response Code</div>
                              <div className="font-mono text-xs text-slate-900 dark:text-white">{transaction.responseCode}</div>
                            </div>
                          )}
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Timing</div>
                            <div className="text-xs text-slate-900 dark:text-white">
                              Start: {transaction.startTime} | End: {transaction.endTime}
                            </div>
                          </div>
                        </div>

                        {/* Data Verified */}
                        {transaction.dataVerified && transaction.dataVerified.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Data Verified</div>
                            <div className="flex flex-wrap gap-1">
                              {transaction.dataVerified.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-xs">
                                  ✓ {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {transaction.errorMessage && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Error</div>
                            <div className="text-sm text-red-600 dark:text-red-400">{transaction.errorMessage}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Summary Tab */}
                    {(activeDetailTab[transaction.id] || 'action') === 'summary' && (
                      <div className="space-y-3 text-sm">
                        {transaction.eligibilityCheck && (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{VERIFICATION_STATUS_LABELS.ELIGIBILITY_CHECK}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{transaction.eligibilityCheck}</div>
                          </div>
                        )}

                        {transaction.benefitsVerification && (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Benefits Verification</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{transaction.benefitsVerification}</div>
                          </div>
                        )}

                        {transaction.coverageDetails && (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Coverage Details</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{transaction.coverageDetails}</div>
                          </div>
                        )}

                        {transaction.deductibleInfo && (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deductible Information</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{transaction.deductibleInfo}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content All Detail Tab */}
                    {(activeDetailTab[transaction.id] || 'action') === 'detail' && (
                      <div className="space-y-3 text-sm">
                        {transaction.type === 'FAX' ? (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Fax Document (Click to view all pages)</div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-700">
                              <ImageViewerWithModal imageUrl="/assets/fax-sample.png" firstPageMaxWidth="50%" alt="Fax Document" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {transaction.transcript && (
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Call Transcript</div>
                                <div className="text-xs bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                                  {formatTranscript(transaction.transcript)}
                                </div>
                              </div>
                            )}

                            {transaction.rawResponse && (
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Raw API Response</div>
                                <div className="text-xs text-green-400 font-mono bg-slate-900 dark:bg-slate-950 p-3 rounded border border-slate-700 overflow-x-auto">{transaction.rawResponse}</div>
                              </div>
                            )}

                            {!transaction.transcript && !transaction.rawResponse && (
                              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                No detailed content available
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Call History Tab */}
                    {(activeDetailTab[transaction.id] || 'action') === 'callHistory' && transaction.callHistory && (
                      <div className="space-y-4">
                        {/* Call Transcript */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Call Transcript</div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                          {transaction.callHistory.filter(c => c.speaker !== 'System').map((comm, idx) => {
                            const isAI = comm.speaker === 'AI';
                            const highlightedMessage = comm.message.replace(
                              /([A-Z]{3,}-[0-9]+|[A-Z]{2,}-[0-9]+|D[0-9]{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}|\$[0-9,]+(?:\.\d{2})?|[0-9]+%|(?:every\s+)?(?:once|twice|[0-9]+\s+times)\s+(?:per|every|a)\s+\w+|days?|months?|years?|January|February|March|April|May|June|July|August|September|October|November|December)/gi,
                              '<span class="text-blue-600 dark:text-blue-400 font-semibold">$&</span>'
                            );

                            return (
                              <div key={idx} className="mb-2">
                                <span className={`font-bold ${isAI ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {isAI ? 'AI Agent:' : 'Insurance Rep:'}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 ml-1" dangerouslySetInnerHTML={{ __html: highlightedMessage }} />
                              </div>
                            );
                          })}
                        </div>

                        {/* Verified Fields Section */}
                        {transaction.dataVerified && transaction.dataVerified.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Verified Fields ({transaction.dataVerified.length})</div>
                            <div className="flex flex-wrap gap-2">
                              {transaction.dataVerified.map((field, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-xs font-medium">
                                  ✓ {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>

      {/* Fax Document Request Modal - 2 Step Process */}
      {currentFaxStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                  description
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Insurance Fax Verification
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sarah Johnson
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetFaxModal();
                  setCurrentFaxStep('idle');
                }}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step1Status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step1Status === 'in_progress'
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {step1Status === 'completed' ? '✓' : '1'}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-white">Fax Document</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">JSON Data</div>
                  </div>
                </div>

                <div className={`h-0.5 flex-1 mx-2 ${
                  step1Status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}></div>

                {/* Step 2 */}
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step2Status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step2Status === 'in_progress'
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {step2Status === 'completed' ? '✓' : '2'}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-white">Analysis</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Coverage Details</div>
                  </div>
                </div>

                <div className={`h-0.5 flex-1 mx-2 ${
                  step2Status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}></div>

                {/* Step 3 */}
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step3Status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step3Status === 'in_progress'
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {step3Status === 'completed' ? '✓' : '3'}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-white">Fax Verification Data</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Results Table</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Fax Data */}
              {step1Status !== 'pending' && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    {step1Status === 'completed' ? (
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 animate-spin">hourglass_bottom</span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 1: Fax Document Retrieved</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {step1Status === 'in_progress' ? 'Processing fax document...' : 'Fax received from insurance carrier'}
                  </p>

                  {step1Status === 'in_progress' ? (
                    <div className="bg-slate-50 dark:bg-slate-800 p-12 rounded border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-6">
                      {/* Animated Document Icon */}
                      <div className="relative w-16 h-20 mb-2">
                        <span className="material-symbols-outlined text-6xl text-blue-500 animate-pulse">description</span>
                      </div>

                      {/* Bouncing Dots */}
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>

                      {/* Status Text */}
                      <div className="text-center space-y-2">
                        <p className="text-sm text-slate-900 dark:text-white font-semibold">Retrieving fax from insurance carrier...</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Connecting to Cigna Dental server</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                      </div>

                      {/* Process Steps */}
                      <div className="w-full max-w-xs space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                          <span className="text-slate-700 dark:text-slate-300">Connected to server</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-500 text-base animate-spin">hourglass_bottom</span>
                          <span className="text-slate-700 dark:text-slate-300">Downloading document</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-base">schedule</span>
                          <span className="text-slate-500 dark:text-slate-400">Processing OCR</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <ImageViewerWithModal imageUrl="/assets/fax-sample.png" firstPageMaxWidth="100%" alt="Fax Document" />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Analysis */}
              {step2Status !== 'pending' && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 2: Insurance Analysis</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Extracted and analyzed coverage details</p>

                  <div className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {step2Text}
                  </div>
                </div>
              )}

              {/* Step 3: Verification Data Table */}
              {step3Status !== 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 3: Fax Verification Data</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Extracted and verified insurance information</p>

                  {/* Verification Table */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-20">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-20">Category</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 flex-1">Field Name</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 flex-1">Value</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400 w-16">Status</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400 w-16">Verified By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {verificationDataRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{row.saiCode}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{row.category}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 text-xs font-medium">{row.fieldName}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 text-xs">{row.aiCallValue}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Verified
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400 text-xs font-medium">{row.verifiedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">10</div>
                      <div className="text-xs text-green-700 dark:text-green-300 font-medium mt-1">Verified Fields</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">Completion Rate</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">512ms</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Processing Time</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">98%</div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">Confidence</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  resetFaxModal();
                  setCurrentFaxStep('idle');
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-medium rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAITransactionHistory;
