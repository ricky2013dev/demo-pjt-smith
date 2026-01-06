import React, { useState, useEffect, useMemo } from "react";
import {
  Patient,
  Appointment,
  Insurance,
  Treatment,
  TabType,
  TAB_TYPES,
  TAB_LABELS,
  InsuranceSubTabType,
  INSURANCE_SUB_TAB_TYPES,
  INSURANCE_SUB_TAB_LABELS,
} from '@/types/patient';
import SmithAICenter from "./SmithAICenter";
import VerificationForm from "./VerificationForm";
import CoverageVerificationResults from "./CoverageVerificationResults";
import SmartAITransactionHistory from "./SmartAITransactionHistory";
import CoverageByCodeView from "./CoverageByCodeView";
import AppointmentManagement from "./AppointmentManagement";
import SensitiveDataField from "@/components/SensitiveDataField";
import InsuranceSensitiveDataField from "@/components/InsuranceSensitiveDataField";
import { PRIMARY_BUTTON } from "@/styles/buttonStyles";
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';
import { deriveVerificationStatusFromTransactions, type Transaction, type VerificationStatus } from '@/utils/transactionStatus';

interface PatientDetailProps {
  patient: Patient;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
  canEdit?: boolean; // Allow editing for database users
  onCancel?: () => void;
  onBackToScheduleJobs?: () => void;
  onSavePatient?: (updatedPatient: Partial<Patient>) => Promise<void>;
}

// Tab content wrapper component for consistent spacing
const TabContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "space-y-6"
}) => {
  return <div className={`animate-fadeIn ${className}`}>{children}</div>;
};

const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  activeTab,
  onTabChange,
  isAdmin = false,
  canEdit = false,
  onCancel,
  onBackToScheduleJobs: _onBackToScheduleJobs,
  onSavePatient,
}) => {
  const [showAICenter, setShowAICenter] = useState(false);
  const [insuranceSubTab, setInsuranceSubTab] = useState<InsuranceSubTabType>(INSURANCE_SUB_TAB_TYPES.COVERAGE_DETAILS);

  // Coverage Verification Results Modal state
  const [isCoverageResultsOpen, setIsCoverageResultsOpen] = useState(false);

  // Transaction refresh trigger
  const [transactionRefreshTrigger, setTransactionRefreshTrigger] = useState(0);

  // Patient Basic Info editing states
  // Default to view mode for all users to protect sensitive data
  const [isEditing, setIsEditing] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(patient.name.given[0] || "");
  const [editedMiddleName, setEditedMiddleName] = useState(patient.name.given[1] || "");
  const [editedLastName, setEditedLastName] = useState(patient.name.family);
  const [editedSSN, setEditedSSN] = useState(
    (patient as any).ssnEncrypted ? "XXX-XX-XXXX" : ((patient as any).ssn || "")
  );
  const [editedBirthDate, setEditedBirthDate] = useState(
    (patient as any).birthDateEncrypted ? "XX/XX/XXXX" : patient.birthDate
  );
  const [editedAge, setEditedAge] = useState("");
  const [editedGender, setEditedGender] = useState(patient.gender);
  const [editedActive, setEditedActive] = useState(patient.active);
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedAddress, setEditedAddress] = useState("");

  // Insurance editing states
  const [editedInsurance, setEditedInsurance] = useState<Insurance[]>([]);

  // Document Analysis AI state
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [isAnalyzingDocuments, setIsAnalyzingDocuments] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');

  // Delete patient state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transaction-based status for Data Mode
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Compute effective verification status based on Data Mode
  // In Data Mode: derive from transactions
  // In Mock Mode: use patient's verification status
  const effectiveVerificationStatus = useMemo(() => {
    const isDataMode = currentUser?.dataSource;

    if (isDataMode && transactions.length > 0) {
      // Data Mode ON: derive status from transactions
      const derivedStatus = deriveVerificationStatusFromTransactions(transactions);
      return derivedStatus;
    } else {
      // Data Mode OFF or no transactions: use patient's verification status
      return patient.verificationStatus || {
        fetchPMS: 'pending',
        apiVerification: 'pending',
        documentAnalysis: 'pending',
        callCenter: 'pending',
        saveToPMS: 'pending',
      };
    }
  }, [currentUser?.dataSource, transactions, patient.verificationStatus]);

  const getFullName = () => {
    const given = patient.name.given.join(" ");
    return `${given} ${patient.name.family}`.trim();
  };

  const getVerificationStep = () => {
    const status = effectiveVerificationStatus;
    if (!status) return 1;

    if (status.saveToPMS === 'completed') return 5;
    if (status.saveToPMS === 'in_progress') return 5;
    if (status.callCenter === 'completed') return 4;
    if (status.callCenter === 'in_progress') return 4;
    if (status.documentAnalysis === 'completed') return 3;
    if (status.documentAnalysis === 'in_progress') return 3;
    if (status.apiVerification === 'completed') return 2;
    if (status.apiVerification === 'in_progress') return 2;
    if (status.fetchPMS === 'completed') return 2;
    if (status.fetchPMS === 'in_progress') return 1;
    return 1;
  };

  const getStepConfig = (stepKey: 'fetchPMS' | 'documentAnalysis' | 'apiVerification' | 'callCenter' | 'saveToPMS') => {
    const status = effectiveVerificationStatus?.[stepKey] || 'pending';
    const configs = {
      fetchPMS: {
        icon: status === 'completed' ? 'check' : status === 'in_progress' ? 'sync' : 'download',
        bgColor: status === 'completed' ? 'bg-green-500 dark:bg-green-600' : status === 'in_progress' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        textColor: status === 'completed' ? 'text-white' : status === 'in_progress' ? 'text-white' : 'text-slate-600 dark:text-slate-400',
        label: VERIFICATION_STATUS_LABELS.FETCH_PMS,
        statusText: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending',
        statusColor: status === 'completed' ? 'text-green-600 dark:text-green-400' : status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
      },
      documentAnalysis: {
        icon: status === 'completed' ? 'check' : status === 'in_progress' ? 'sync' : 'description',
        bgColor: status === 'completed' ? 'bg-green-500 dark:bg-green-600' : status === 'in_progress' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        textColor: status === 'completed' ? 'text-white' : status === 'in_progress' ? 'text-white' : 'text-slate-600 dark:text-slate-400',
        label: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS,
        statusText: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending',
        statusColor: status === 'completed' ? 'text-green-600 dark:text-green-400' : status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
      },
      apiVerification: {
        icon: status === 'completed' ? 'check' : status === 'in_progress' ? 'sync' : 'api',
        bgColor: status === 'completed' ? 'bg-green-500 dark:bg-green-600' : status === 'in_progress' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        textColor: status === 'completed' ? 'text-white' : status === 'in_progress' ? 'text-white' : 'text-slate-600 dark:text-slate-400',
        label: VERIFICATION_STATUS_LABELS.API_VERIFICATION,
        statusText: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending',
        statusColor: status === 'completed' ? 'text-green-600 dark:text-green-400' : status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
      },
      callCenter: {
        icon: status === 'completed' ? 'check' : status === 'in_progress' ? 'sync' : 'phone',
        bgColor: status === 'completed' ? 'bg-green-500 dark:bg-green-600' : status === 'in_progress' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        textColor: status === 'completed' ? 'text-white' : status === 'in_progress' ? 'text-white' : 'text-slate-600 dark:text-slate-400',
        label: VERIFICATION_STATUS_LABELS.CALL_CENTER,
        statusText: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending',
        statusColor: status === 'completed' ? 'text-green-600 dark:text-green-400' : status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
      },
      saveToPMS: {
        icon: status === 'completed' ? 'check' : status === 'in_progress' ? 'sync' : 'save',
        bgColor: status === 'completed' ? 'bg-green-500 dark:bg-green-600' : status === 'in_progress' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
        textColor: status === 'completed' ? 'text-white' : status === 'in_progress' ? 'text-white' : 'text-slate-600 dark:text-slate-400',
        label: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS,
        statusText: status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Pending',
        statusColor: status === 'completed' ? 'text-green-600 dark:text-green-400' : status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
      }
    };
    return configs[stepKey];
  };

  // Check if each step is completed
  const isFetchPMSCompleted = () => {
    return effectiveVerificationStatus?.fetchPMS === 'completed';
  };

  const isDocumentAnalysisCompleted = () => {
    return effectiveVerificationStatus?.documentAnalysis === 'completed';
  };

  const isAPIVerificationCompleted = () => {
    return effectiveVerificationStatus?.apiVerification === 'completed';
  };

  const isCallCenterCompleted = () => {
    return effectiveVerificationStatus?.callCenter === 'completed';
  };

  // Check if status is 100% (all 5 steps completed)

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 3 - uploadedDocuments.length);
      setUploadedDocuments([...uploadedDocuments, ...newFiles]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
  };

  const handleStartDocumentAnalysis = () => {
    setShowDocumentUploadModal(false);
    setIsAnalyzingDocuments(true);
    setAnalysisProgress(0);
    setAnalysisMessage('🤖 Initializing AI Document Analysis System...');

    // Stage 1: Initialization (0-15%)
    setTimeout(() => {
      setAnalysisProgress(15);
      setAnalysisMessage('🔍 Scanning uploaded documents for content extraction...');
    }, 1000);

    // Stage 2: OCR Processing (15-30%)
    setTimeout(() => {
      setAnalysisProgress(30);
      setAnalysisMessage('📄 Performing OCR on document images...');
    }, 2500);

    // Stage 3: Text Extraction (30-45%)
    setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisMessage('🧠 Applying Natural Language Processing algorithms...');
    }, 4000);

    // Stage 4: NLP Analysis (45-60%)
    setTimeout(() => {
      setAnalysisProgress(60);
      setAnalysisMessage('🔎 Identifying patient demographics and insurance data...');
    }, 5500);

    // Stage 5: Data Extraction (60-75%)
    setTimeout(() => {
      setAnalysisProgress(75);
      setAnalysisMessage('✅ Validating extracted information accuracy...');
    }, 7000);

    // Stage 6: Validation (75-85%)
    setTimeout(() => {
      setAnalysisProgress(85);
      setAnalysisMessage('🔗 Cross-referencing data with existing patient records...');
    }, 8500);

    // Stage 7: Cross-referencing (85-92%)
    setTimeout(() => {
      setAnalysisProgress(92);
      setAnalysisMessage('💾 Preparing structured data for database insertion...');
    }, 10000);

    // Stage 8: Data Preparation (92-98%)
    setTimeout(() => {
      setAnalysisProgress(98);
      setAnalysisMessage('🎯 Finalizing AI analysis results...');
    }, 11500);

    // Stage 9: Completion (98-100%)
    setTimeout(() => {
      setAnalysisProgress(100);
      setAnalysisMessage('✨ Document analysis complete! Patient data extracted successfully.');
    }, 12500);

    // Close modal
    setTimeout(() => {
      setIsAnalyzingDocuments(false);
      setAnalysisProgress(0);
      setAnalysisMessage('');
      setUploadedDocuments([]);
    }, 14000);
  };

  const getPhone = () => {
    return patient.telecom.find((t) => t.system === "phone")?.value || "N/A";
  };

  const getEmail = () => {
    return patient.telecom.find((t) => t.system === "email")?.value || "N/A";
  };

  const getAddress = () => {
    if (!patient.address || patient.address.length === 0) return "N/A";
    const addr = patient.address[0];
    const line = addr.line?.join(", ");
    return line ? `${line}, ${addr.city}, ${addr.state} ${addr.postalCode}` : `${addr.city}, ${addr.state} ${addr.postalCode}`;
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Fetch current user to determine Data Mode
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

  // Fetch transactions for this patient when in Data Mode
  useEffect(() => {
    const fetchTransactions = async () => {
      // Only fetch transactions if Data Mode is ON
      if (!currentUser?.dataSource) {
        setTransactions([]);
        return;
      }

      try {
        setLoadingTransactions(true);
        const response = await fetch('/api/transactions', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.transactions) {
            // Filter transactions for this patient
            const patientTransactions = data.transactions.filter(
              (t: Transaction) => t.patientId === patient.id
            );
            setTransactions(patientTransactions);
          }
        }
      } catch (error) {
      } finally {
        setLoadingTransactions(false);
      }
    };

    if (currentUser !== null) {
      fetchTransactions();
    }
  }, [patient.id, currentUser, transactionRefreshTrigger]);

  // Initialize edited contact info and insurance from patient data
  React.useEffect(() => {
    setEditedFirstName(patient.name.given[0] || "");
    setEditedMiddleName(patient.name.given[1] || "");
    setEditedLastName(patient.name.family);
    setEditedSSN((patient as any).ssnEncrypted ? "XXX-XX-XXXX" : ((patient as any).ssn || ""));
    setEditedBirthDate((patient as any).birthDateEncrypted ? "XX/XX/XXXX" : patient.birthDate);
    setEditedGender(patient.gender);
    setEditedActive(patient.active);
    setEditedPhone(getPhone());
    setEditedEmail(getEmail());
    setEditedAddress(getAddress());

    // Mask encrypted insurance fields
    const insuranceData = ((patient as any).insurance || []).map((ins: any) => ({
      ...ins,
      policyNumber: ins.policyNumberEncrypted ? "************" : ins.policyNumber,
      groupNumber: ins.groupNumberEncrypted ? "********" : ins.groupNumber
    }));
    setEditedInsurance(insuranceData);

    setEditedAge(patient.birthDate ? calculateAge(patient.birthDate).toString() : "");
  }, [patient]);

  // Handle save changes
  const handleSave = async () => {
    if (onSavePatient) {
      try {
        const updatedPatient: Partial<Patient> = {
          id: patient.id,
          name: {
            given: [editedFirstName, editedMiddleName].filter(Boolean),
            family: editedLastName
          },
          gender: editedGender,
          birthDate: editedBirthDate,
          ssn: editedSSN || undefined,
          active: editedActive,
          insurance: editedInsurance,
        };

        await onSavePatient(updatedPatient);
        setIsEditing(false);
      } catch (error) {
        alert("Failed to save patient information. Please try again.");
      }
    } else {
      // Fallback for mockup mode
      setIsEditing(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setEditedBirthDate((patient as any).birthDateEncrypted ? "XX/XX/XXXX" : patient.birthDate);
    setEditedAge(calculateAge(patient.birthDate).toString());
    setEditedGender(patient.gender);
    setEditedActive(patient.active);
    setEditedPhone(getPhone());
    setEditedEmail(getEmail());
    setEditedAddress(getAddress());

    // Mask encrypted insurance fields
    const insuranceData = ((patient as any).insurance || []).map((ins: any) => ({
      ...ins,
      policyNumber: ins.policyNumberEncrypted ? "************" : ins.policyNumber,
      groupNumber: ins.groupNumberEncrypted ? "********" : ins.groupNumber
    }));
    setEditedInsurance(insuranceData);

    setIsEditing(false);
  };

  // Handle delete patient
  const handleDeletePatient = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete patient');
      }

      // Close confirmation dialog
      setShowDeleteConfirmation(false);

      // Reload the current page to refresh all data
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete patient. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Handle insurance field change
  const handleInsuranceChange = (index: number, field: keyof Insurance, value: string) => {
    const updated = [...editedInsurance];
    (updated[index] as any)[field] = value;
    setEditedInsurance(updated);
  };

  const fullName = getFullName();

  return (
    <section key={patient.id} className="hidden w-0 flex-1 flex-col bg-background-light dark:bg-background-dark lg:flex lg:w-[85%] animate-fadeIn">
      {/* Profile Header - Compact */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 justify-between">
          <div className="rounded-full h-10 w-10 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=80&background=e2e8f0&color=475569&bold=false&format=svg`}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {fullName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID: {patient.id}
            </p>
          </div>

          <div className={`flex gap-2 ${patient.id.startsWith('new-') ? 'invisible' : ''}`}>

            {/* Run API Verification */}
            <button
              onClick={() => setIsCoverageResultsOpen(true)}
              className="ml-3 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
              title="Run API verification (can re-run)"
            >
              <span className={`material-symbols-outlined text-base ${isAPIVerificationCompleted()
                ? 'text-green-500'
                : effectiveVerificationStatus?.apiVerification === 'in_progress'
                  ? 'text-blue-500'
                  : ''
                }`}>
                {isAPIVerificationCompleted() ? 'check_circle' : 'verified_user'}
              </span>
              API Verification
            </button>

            {/* Request Insurance Fax - Hidden when Data Mode is ON */}
            {!currentUser?.dataSource && (
              <button
                onClick={() => {
                  // Call the global openFaxModal function exposed by SmartAITransactionHistory
                  if (window.openFaxModal) {
                    window.openFaxModal();
                    // Also navigate to the AI Call History tab to show the modal
                    onTabChange(TAB_TYPES.AI_CALL_HISTORY);
                  }
                }}
                className="ml-3 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
                title="Request insurance fax document"
              >
                <span className="material-symbols-outlined text-base">description</span>
                Fax Document
              </button>
            )}


            {/* Step  Start AI Call */}
            <button
              onClick={() => setShowAICenter(true)}
              className="ml-3 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
              title="Start AI call verification (can re-run)"
            >
              <span className={`material-symbols-outlined text-base ${isCallCenterCompleted()
                ? 'text-green-500'
                : effectiveVerificationStatus?.callCenter === 'in_progress'
                  ? 'text-blue-500'
                  : ''
                }`}>
                {isCallCenterCompleted() ? 'check_circle' : 'smart_toy'}
              </span>
              AI Live Call
            </button>
          </div>

          {/* Verification Steps Progress - Compact */}
          <div className="flex items-center gap-4 max-w-2xl flex-1 ml-auto">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-end mb-1">
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  Step {getVerificationStep()} of 5
                </span>
              </div>
              {/* Simplified Progress Line with 5 Steps */}
              <div className="relative py-1">
                {/* Connector lines for 5 steps */}
                {/* Line 1: Fetch PMS to Document Analysis */}
                <div
                  className={`absolute top-4 h-0.5 transition-colors ${isFetchPMSCompleted()
                    ? 'bg-green-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  style={{ left: '10%', width: '18%' }}
                ></div>
                {/* Line 2: API Verification to Document Analysis */}
                <div
                  className={`absolute top-4 h-0.5 transition-colors ${isAPIVerificationCompleted()
                    ? 'bg-green-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  style={{ left: '30%', width: '18%' }}
                ></div>
                {/* Line 3: Document Analysis to Call Center */}
                <div
                  className={`absolute top-4 h-0.5 transition-colors ${isDocumentAnalysisCompleted()
                    ? 'bg-green-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  style={{ left: '50%', width: '18%' }}
                ></div>
                {/* Line 4: Call Center to Save to PMS */}
                <div
                  className={`absolute top-4 h-0.5 transition-colors ${isCallCenterCompleted()
                    ? 'bg-green-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  style={{ left: '70%', width: '18%' }}
                ></div>

                {/* Steps */}
                <div className="relative flex items-start justify-between">
                  {/* Step 1 - Fetch PMS */}
                  <div className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepConfig('fetchPMS').bgColor} ${getStepConfig('fetchPMS').textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900`}>
                      <span className="material-symbols-outlined text-sm">{getStepConfig('fetchPMS').icon}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 text-center leading-tight px-0.5">
                      {getStepConfig('fetchPMS').label}
                    </p>
                  </div>

                  {/* Step 2 - API Verification */}
                  <div className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepConfig('apiVerification').bgColor} ${getStepConfig('apiVerification').textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900`}>
                      <span className="material-symbols-outlined text-sm">{getStepConfig('apiVerification').icon}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 text-center leading-tight px-0.5">
                      {getStepConfig('apiVerification').label}
                    </p>
                  </div>

                  {/* Step 3 - Document Analysis */}
                  <div className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepConfig('documentAnalysis').bgColor} ${getStepConfig('documentAnalysis').textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900`}>
                      <span className="material-symbols-outlined text-sm">{getStepConfig('documentAnalysis').icon}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 text-center leading-tight px-0.5">
                      {getStepConfig('documentAnalysis').label}
                    </p>
                  </div>

                  {/* Step 4 - Call Center */}
                  <div className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepConfig('callCenter').bgColor} ${getStepConfig('callCenter').textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900`}>
                      <span className="material-symbols-outlined text-sm">{getStepConfig('callCenter').icon}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 text-center leading-tight px-0.5">
                      {getStepConfig('callCenter').label}
                    </p>
                  </div>

                  {/* Step 5 - Save to PMS */}
                  <div className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepConfig('saveToPMS').bgColor} ${getStepConfig('saveToPMS').textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900`}>
                      <span className="material-symbols-outlined text-sm">{getStepConfig('saveToPMS').icon}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 text-center leading-tight px-0.5">
                      {getStepConfig('saveToPMS').label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tab Navigation - Clean minimal style */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 sticky top-0 z-10">
        <nav aria-label="Tabs" className="flex -mb-px gap-1 overflow-x-auto">
          {Object.values(TAB_TYPES)
            .filter(tab => {
              // Hide Insurance Basic tab since it's merged into Patient Basic
              if (tab === TAB_TYPES.INSURANCE_INFO) {
                return false;
              }
              // Hide Treatment History tab for non-admin users (keep Appointments visible)
              if (!isAdmin && tab === TAB_TYPES.TREATMENT_HISTORY) {
                return false;
              }
              return true;
            })
            .map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
        </nav>
      </div>

      {/* Sub-Tab Navigation - Only visible when Insurance tab is active */}
      {activeTab === TAB_TYPES.INSURANCE && (
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-1.5">
          <nav aria-label="Insurance Sub Tabs" className="flex gap-1">
            {Object.values(INSURANCE_SUB_TAB_TYPES).map((subTab) => (
              <button
                key={subTab}
                onClick={() => setInsuranceSubTab(subTab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${insuranceSubTab === subTab
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
              >
                {INSURANCE_SUB_TAB_LABELS[subTab]}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Tab Content - Patient Basic Info */}
        {activeTab === TAB_TYPES.PATIENT_BASIC_INFO && (
          <TabContent>
            <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                    Patient Infomation
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ID: <span className="font-medium text-slate-700 dark:text-slate-300">{patient.id}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {(isAdmin || canEdit) && !isEditing && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-4">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedFirstName}
                      onChange={(e) => setEditedFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="First Name"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {patient.name.given[0] || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Middle Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedMiddleName}
                      onChange={(e) => setEditedMiddleName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Middle Name"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {patient.name.given[1] || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Last Name"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {patient.name.family}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    SSN#
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSSN}
                      onChange={(e) => setEditedSSN(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="XXX-XX-XXXX"
                      maxLength={11}
                    />
                  ) : (
                    <SensitiveDataField
                      patientId={patient.id}
                      fieldName="ssn"
                      maskedValue={(patient as any).ssn || '***-**-****'}
                      label="SSN"
                      isEncrypted={(patient as any).ssnEncrypted || false}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    (patient as any).birthDateEncrypted ? (
                      <input
                        type="text"
                        value={editedBirthDate}
                        onChange={(e) => setEditedBirthDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="MM/DD/YYYY"
                      />
                    ) : (
                      <input
                        type="date"
                        value={editedBirthDate}
                        onChange={(e) => setEditedBirthDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    )
                  ) : (
                    <SensitiveDataField
                      patientId={patient.id}
                      fieldName="birthDate"
                      maskedValue={patient.birthDate || '****-**-**'}
                      label="Date of Birth"
                      isEncrypted={(patient as any).birthDateEncrypted || false}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedAge}
                      onChange={(e) => setEditedAge(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Age"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {calculateAge(patient.birthDate)} years
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={editedGender}
                      onChange={(e) => setEditedGender(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary capitalize text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                      {patient.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedActive ? "active" : "inactive"}
                      onChange={(e) => setEditedActive(e.target.value === "active")}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${patient.active
                          ? "bg-status-green/20 text-status-green"
                          : "bg-status-red/20 text-status-red"
                          }`}
                      >
                        {patient.active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  Contact Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="(555) 555-5555"
                    />
                  ) : (
                    <SensitiveDataField
                      patientId={patient.id}
                      fieldName="phone"
                      maskedValue={getPhone()}
                      label="Phone"
                      isEncrypted={(patient.telecom.find(t => t.system === 'phone') as any)?.encrypted || false}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="email@example.com"
                    />
                  ) : (
                    <SensitiveDataField
                      patientId={patient.id}
                      fieldName="email"
                      maskedValue={getEmail()}
                      label="Email"
                      isEncrypted={(patient.telecom.find(t => t.system === 'email') as any)?.encrypted || false}
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="123 Main St, City, State ZIP"
                    />
                  ) : (
                    <SensitiveDataField
                      patientId={patient.id}
                      fieldName="address"
                      maskedValue="**** **** ******, ****, ** *****"
                      label="Address"
                      isEncrypted={(patient.address && patient.address.length > 0) || false}
                    />
                  )}
                </div>
              </div>
              {(isAdmin || canEdit) && isEditing && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={PRIMARY_BUTTON}
                  >
                    <span className="material-symbols-outlined">save</span>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Insurance Basic Info - Merged into Patient Basic */}

            {(isEditing && editedInsurance.length > 0) || (!isEditing && (patient as any).insurance?.length > 0) ? (
              (isEditing ? editedInsurance : (patient as any).insurance).map(
                (ins: Insurance, index: number) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        Insurance Information
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Provider
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.provider}
                            onChange={(e) => handleInsuranceChange(index, 'provider', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Provider Name"
                          />
                        ) : (
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {ins.provider}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Policy Number
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.policyNumber}
                            onChange={(e) => handleInsuranceChange(index, 'policyNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Policy Number"
                          />
                        ) : (
                          <InsuranceSensitiveDataField
                            patientId={patient.id}
                            insuranceId={(ins as any).id || ''}
                            fieldName="policyNumber"
                            maskedValue={ins.policyNumber || '************'}
                            label="Policy Number"
                            isEncrypted={(ins as any).policyNumberEncrypted || false}
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Group Number
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.groupNumber}
                            onChange={(e) => handleInsuranceChange(index, 'groupNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Group Number"
                          />
                        ) : (
                          <InsuranceSensitiveDataField
                            patientId={patient.id}
                            insuranceId={(ins as any).id || ''}
                            fieldName="groupNumber"
                            maskedValue={ins.groupNumber || '********'}
                            label="Group Number"
                            isEncrypted={(ins as any).groupNumberEncrypted || false}
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Subscriber ID
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.subscriberId}
                            onChange={(e) => handleInsuranceChange(index, 'subscriberId', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Subscriber ID"
                          />
                        ) : (
                          <InsuranceSensitiveDataField
                            patientId={patient.id}
                            insuranceId={(ins as any).id || ''}
                            fieldName="subscriberId"
                            maskedValue={ins.subscriberId || '**********'}
                            label="Subscriber ID"
                            isEncrypted={(ins as any).subscriberIdEncrypted || false}
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Subscriber Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.subscriberName}
                            onChange={(e) => handleInsuranceChange(index, 'subscriberName', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Subscriber Name"
                          />
                        ) : (
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {ins.subscriberName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Relationship
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={ins.relationship}
                            onChange={(e) => handleInsuranceChange(index, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Relationship"
                          />
                        ) : (
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {ins.relationship}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Effective Date
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={ins.effectiveDate}
                            onChange={(e) => handleInsuranceChange(index, 'effectiveDate', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        ) : (
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {ins.effectiveDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                          Expiration Date
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={ins.expirationDate}
                            onChange={(e) => handleInsuranceChange(index, 'expirationDate', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                        ) : (
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {ins.expirationDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            ) : isEditing ? (
              // Show Add Insurance button when editing and no insurance exists
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
                {(() => {
                  return null;
                })()}
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  No insurance information on file
                </p>
                <button
                  onClick={() => {
                    const newInsurance: Insurance = {
                      type: "Primary",
                      provider: "",
                      policyNumber: "",
                      groupNumber: "",
                      subscriberName: "",
                      subscriberId: "",
                      relationship: "Self",
                      effectiveDate: "",
                      expirationDate: "",
                      coverage: {
                        deductible: "",
                        deductibleMet: "",
                        maxBenefit: "",
                        preventiveCoverage: "",
                        basicCoverage: "",
                        majorCoverage: ""
                      }
                    };
                    setEditedInsurance([newInsurance]);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto font-medium shadow-md"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Add Insurance Information
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
                {(() => {
                  return null;
                })()}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No insurance information on file
                </p>
              </div>
            )}
          </TabContent>
        )}

        {/* Tab Content - Insurance Info */}
        {activeTab === TAB_TYPES.INSURANCE_INFO && (
          <TabContent>
            {(patient as any).insurance &&
              (patient as any).insurance.length > 0 ? (
              (patient as any).insurance.map(
                (ins: Insurance, index: number) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {ins.type}
                        </span>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                          {ins.provider}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          Policy Number
                        </p>
                        <InsuranceSensitiveDataField
                          patientId={patient.id}
                          insuranceId={(ins as any).id || ''}
                          fieldName="policyNumber"
                          maskedValue={ins.policyNumber || '************'}
                          label="Policy Number"
                          isEncrypted={(ins as any).policyNumberEncrypted || false}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          Group Number
                        </p>
                        <InsuranceSensitiveDataField
                          patientId={patient.id}
                          insuranceId={(ins as any).id || ''}
                          fieldName="groupNumber"
                          maskedValue={ins.groupNumber || '********'}
                          label="Group Number"
                          isEncrypted={(ins as any).groupNumberEncrypted || false}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          Subscriber ID
                        </p>
                        <InsuranceSensitiveDataField
                          patientId={patient.id}
                          insuranceId={(ins as any).id || ''}
                          fieldName="subscriberId"
                          maskedValue={ins.subscriberId || '**********'}
                          label="Subscriber ID"
                          isEncrypted={(ins as any).subscriberIdEncrypted || false}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Subscriber Name
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {ins.subscriberName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Relationship
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {ins.relationship}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Effective Date
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {ins.effectiveDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Expiration Date
                        </p>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {ins.expirationDate}
                        </p>
                      </div>
                      <div className="col-span-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Coverage Summary
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-slate-500">Deductible:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.deductible}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Met:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.deductibleMet}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Max Benefit:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.maxBenefit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Preventive:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.preventiveCoverage}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Basic:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.basicCoverage}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Major:</span>{" "}
                            <span className="font-medium">
                              {ins.coverage.majorCoverage}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No insurance information on file
                </p>
              </div>
            )}
          </TabContent>
        )}

        {/* Tab Content - AI Insurance Verification with Sub Tabs */}
        {activeTab === TAB_TYPES.INSURANCE && (
          <>
            {/* Verification Form Sub Tab */}
            {insuranceSubTab === INSURANCE_SUB_TAB_TYPES.VERIFICATION_FORM && (
              <TabContent>
                <VerificationForm patient={patient} />
              </TabContent>
            )}

            {/* Coverage Details Sub Tab */}
            {insuranceSubTab === INSURANCE_SUB_TAB_TYPES.COVERAGE_DETAILS && (
              <TabContent>
                <CoverageByCodeView procedures={patient.coverage?.procedures} patientId={patient.id} />
              </TabContent>
            )}


          </>
        )}

        {/* Tab Content - Appointments */}
        {activeTab === TAB_TYPES.APPOINTMENTS && (
          <TabContent className="space-y-4">
            <AppointmentManagement
              patientId={patient.id}
              appointments={patient.appointments || []}
              canEdit={canEdit}
              onSave={async () => {
                // Refresh patient data after appointment changes
                if (onSavePatient) {
                  // Trigger a refresh by calling the parent's save handler with the patient ID
                  // This will re-fetch the patient data from the server
                  window.location.reload();
                }
              }}
            />
          </TabContent>
        )}

        {/* Tab Content - Treatment History */}
        {activeTab === TAB_TYPES.TREATMENT_HISTORY && (
          <TabContent className="space-y-4">
            {(patient as any).treatments &&
              (patient as any).treatments.length > 0 ? (
              (patient as any).treatments.map(
                (treatment: Treatment, index: number) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {treatment.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {treatment.date}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        {treatment.cost}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No treatment history available
                </p>
              </div>
            )}
          </TabContent>
        )}

        {/* Tab Content - AI Call History */}
        {/* Always render SmartAITransactionHistory so window.openFaxModal is always available */}
        <div className={activeTab === TAB_TYPES.AI_CALL_HISTORY ? '' : 'hidden'}>
          <SmartAITransactionHistory patientId={patient.id} refreshTrigger={transactionRefreshTrigger} />
        </div>
      </div>

      {/* Save Button for New Patients */}
      {patient.id.startsWith('new-') && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                }
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle save - would save the new patient data
              }}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium"
            >
              Save Patient
            </button>
          </div>
        </div>
      )}

      {/* Smith AI Center Modal */}
      {showAICenter && (
        <SmithAICenter
          patient={patient}
          onClose={() => setShowAICenter(false)}
        />
      )}

      {/* Coverage Verification Results Modal */}
      <CoverageVerificationResults
        isOpen={isCoverageResultsOpen}
        onClose={() => setIsCoverageResultsOpen(false)}
        patientName={getFullName()}
        patient={patient}
        onTransactionCreated={() => setTransactionRefreshTrigger(prev => prev + 1)}
      />

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-4 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">
                    smart_toy
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Document Analysis AI
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload up to 3 documents for AI analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Upload Area */}
            <div className="mb-6">
              <label className="block w-full">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-slate-400">
                      upload_file
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        PDF, JPG, PNG (max 3 files)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploadedDocuments.length >= 3}
                  />
                </div>
              </label>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Uploaded Documents ({uploadedDocuments.length}/3)
                </p>
                {uploadedDocuments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
                        description
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Info Notice */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base">info</span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  For demo purposes, you can start the analysis process even without uploading documents.
                  The AI will simulate document processing and extraction.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDocumentUploadModal(false);
                  setUploadedDocuments([]);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDocumentAnalysis}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                Start AI Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Analysis Progress Modal */}
      {isAnalyzingDocuments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4 p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400 animate-pulse">
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  AI Document Analysis
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Processing and extracting data
                </p>
              </div>
            </div>

            {/* Progress Message */}
            <div className="mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 min-h-[40px]">
                {analysisMessage}
              </p>

              {/* Progress Bar */}
              <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${analysisProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {/* Progress Percentage */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Progress
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {analysisProgress}%
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span>OCR Processing</span>
              </div>
              {analysisProgress === 100 && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 ml-auto">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="font-semibold">Complete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-red-600 dark:text-red-400">
                  warning
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Patient
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-200 mb-2 font-semibold">
                All patient data will be permanently deleted, including:
              </p>
              <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 ml-4">
                <li>• Patient information (name, DOB, SSN, etc.)</li>
                <li>• Contact details (phone, email, address)</li>
                <li>• Insurance information</li>
                <li>• Appointments and treatments</li>
                <li>• Coverage details and procedures</li>
                <li>• Verification statuses</li>
                <li>• AI call history and transactions</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to delete patient <span className="font-semibold">{getFullName()}</span> (ID: {patient.id})?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default PatientDetail;
