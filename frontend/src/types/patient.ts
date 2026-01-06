export interface Patient {
  id: string;
  active: boolean;
  name: PatientName;
  gender: string;
  birthDate: string;
  ssn?: string; // HIPAA-sensitive, encrypted in database
  telecom: Telecom[];
  address: Address[];
  insurance?: Insurance[];
  appointments?: Appointment[];
  treatments?: Treatment[];
  coverage?: CoverageDetails;
  verificationStatus?: VerificationStatus;
}

export interface VerificationStatus {
  fetchPMS: 'completed' | 'in_progress' | 'pending';
  documentAnalysis: 'completed' | 'in_progress' | 'pending';
  apiVerification: 'completed' | 'in_progress' | 'pending';
  callCenter: 'completed' | 'in_progress' | 'pending';
  saveToPMS: 'completed' | 'in_progress' | 'pending';
}

export interface PatientName {
  given: string[];
  family: string;
}

export interface Telecom {
  system: 'phone' | 'email';
  value: string;
}

export interface Address {
  line: string[];
  city: string;
  state: string;
  postalCode: string;
}

export interface Insurance {
  type: 'Primary' | 'Secondary';
  provider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberName: string;
  subscriberId: string;
  relationship: string;
  effectiveDate: string;
  expirationDate: string;
  coverage: {
    deductible: string;
    deductibleMet: string;
    maxBenefit: string;
    preventiveCoverage: string;
    basicCoverage: string;
    majorCoverage: string;
  };
}

export interface Appointment {
  id?: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  provider: string;
}

export interface Treatment {
  name: string;
  date: string;
  cost: string;
}

export interface Procedure {
  code: string;
  name: string;
  category: 'Preventive' | 'Basic' | 'Major' | 'Orthodontic';
  coverage: string;
  estimated_cost: string;
  patient_pays: string;
}

export interface CoverageDetails {
  annual_maximum: number;
  annual_used: number;
  deductible: number;
  deductible_met: number;
  procedures: Procedure[];
}

export interface VerificationFormData {
  // Patient Information
  patientName: string;
  patientSSN: string;
  patientDOB: string;
  relationshipToSubscriber: string;

  // Subscriber Information
  subscriberName: string;
  subscriberSSN: string;
  subscriberDOB: string;
  subscriberID: string;

  // Insurance Information
  insuranceCompany: string;
  insurerType: 'Primary' | 'Secondary';
  insuranceAddress: string;
  insurancePhone: string;
  employer: string;
  groupNumber: string;
  effectiveDate: string;
  renewalMonth: string;
  yearlyMax: string;
  deductiblePerIndividual: string;
  deductiblePerFamily: string;
  deductibleAppliesTo: {
    preventative: boolean;
    basic: boolean;
    major: boolean;
  };

  // Preventative Coverage
  preventativeCoveredAt: string;
  preventativeWaitingPeriod: boolean;
  preventativeEffectiveDate: string;
  bitewingFrequency: string;
  prophylaxisExamFrequency: string;
  lastFMS: string;
  eligibleForFMSNow: boolean;
  eligibleForFMSEvery: string;
  fluorideVarnishFrequency: string;
  fluorideAgeLimitExists: boolean;
  fluorideAgeLimit: string;
  sealantCoverage: boolean;
  sealantTeethCovered: {
    molars: boolean;
    premolars: boolean;
  };
  sealantAgeLimitExists: boolean;
  sealantAgeLimit: string;
  sealantReplacement: string;

  // Basic Coverage
  basicCoveredAt: string;
  basicWaitingPeriod: boolean;
  basicEffectiveDate: string;
  basicIncludes: string;

  // Major Coverage
  majorCoveredAt: string;
  majorWaitingPeriod: boolean;
  majorEffectiveDate: string;
  majorIncludes: string;

  // Periodontal Coverage
  srpHistory: boolean;
  srpHistoryDate: string;
  srpCovered: boolean;
  srpFrequency: string;
  srpAllQuadrantsSameVisit: boolean;
  srpWaitingPeriod: string;
  adultProphylaxisWithSRP: boolean;
  adultProphylaxisWaitingPeriod: string;
  periodontalMaintenanceCovered: boolean;
  periodontalMaintenanceFrequency: string;

  // Implant Coverage
  endostealImplantsCovered: boolean;
  endostealImplantsCoveredAt: string;
  boneReplacementGraftsCovered: boolean;
  boneReplacementGraftsCoveredAt: string;
  guidedTissueRegenerationCovered: boolean;
  guidedTissueRegenerationCoveredAt: string;
  implantAbutmentsCovered: boolean;
  implantAbutmentsCoveredAt: string;
  implantCrownsCovered: boolean;
  implantCrownsCoveredAt: string;
  implantPreDeterminationRequired: boolean;

  // Orthodontic Coverage
  orthodonticsCovered: boolean;
  orthodonticsCoveredAt: string;
  orthodonticsAgeLimitExists: boolean;
  orthodonticsAgeLimit: string;
  orthodonticsLifetimeMaxExists: boolean;
  orthodonticsLifetimeMax: string;

  // Miscellaneous
  nightguardsCovered: boolean;
  nightguardsCoveredAt: string;
  nitrousOxideCovered: boolean;
  nitrousOxideCoveredAt: string;
  crownsAndBridgesReplacement: string;
  denturesReplacement: string;
  missingToothClauseCovered: boolean;

  // Additional Notes
  additionalNotes: string;
}

export type FilterType =
  | 'Active'
  | 'Inactive'
  | 'Eligibility'
  | 'Verification';

// Tab type constants
export const TAB_TYPES = {
  AI_CALL_HISTORY: 'AI_CALL_HISTORY',
  PATIENT_BASIC_INFO: 'PATIENT_BASIC_INFO',
  INSURANCE_INFO: 'INSURANCE_INFO',
  INSURANCE: 'INSURANCE',
  APPOINTMENTS: 'APPOINTMENTS',
  TREATMENT_HISTORY: 'TREATMENT_HISTORY',
} as const;

export type TabType = typeof TAB_TYPES[keyof typeof TAB_TYPES];

// Tab labels for display
export const TAB_LABELS: Record<TabType, string> = {
  [TAB_TYPES.PATIENT_BASIC_INFO]: 'Patient Basic Info',
  [TAB_TYPES.INSURANCE_INFO]: 'Insurance - Basic',
  [TAB_TYPES.INSURANCE]: 'Insurance - Coverage',
  [TAB_TYPES.AI_CALL_HISTORY]: 'Smart AI Transaction History',
  [TAB_TYPES.APPOINTMENTS]: 'Appointments',
  [TAB_TYPES.TREATMENT_HISTORY]: 'Treatment History',
};

// Insurance sub-tab type constants
export const INSURANCE_SUB_TAB_TYPES = {
  VERIFICATION_FORM: 'VERIFICATION_FORM',
  COVERAGE_DETAILS: 'COVERAGE_DETAILS',
} as const;

export type InsuranceSubTabType = typeof INSURANCE_SUB_TAB_TYPES[keyof typeof INSURANCE_SUB_TAB_TYPES];

// Insurance sub-tab labels for display
export const INSURANCE_SUB_TAB_LABELS: Record<InsuranceSubTabType, string> = {
  
  [INSURANCE_SUB_TAB_TYPES.COVERAGE_DETAILS]: 'Coverage By Code View',
  [INSURANCE_SUB_TAB_TYPES.VERIFICATION_FORM]: 'Coverage By Form View',
};
