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

// Demo transactions used in mockup mode. Patient ids match mockupdata/patients.json
// (1001-1010) and the chains mirror each patient's verification status, so every patient in
// the list has history to show and each status filter has rows to match.
export const mockData: Transaction[] = [
  // ---- 1001 — Sarah Jane Johnson ----
  {
    id: "1",
    requestId: "REQ-20260818-0802-1001",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-18 08:02:07",
    endTime: "2026-08-18 08:04:48",
    duration: "2m 41s",
    status: "SUCCESS",
    patientId: "1001",
    patientName: "Sarah Jane Johnson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    endpoint: "https://pms.dental.local/api/patient/data",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Blue Cross Blue Shield | Group: GRP-98765",
    deductibleInfo: "Deductible: $1,500 | Met: $450",
    transcript: "FETCH completed for Sarah Jane Johnson. All requested fields verified.",
  },
  {
    id: "2",
    requestId: "REQ-20260818-0820-1001",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-18 08:20:14",
    endTime: "2026-08-18 08:21:55",
    duration: "1m 41s",
    status: "SUCCESS",
    patientId: "1001",
    patientName: "Sarah Jane Johnson",
    insuranceProvider: "Blue Cross Blue Shield",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 92,
    fetchStatus: "completed",
    saveStatus: "completed",
    responseCode: "200",
    endpoint: "https://api.blue.com/dental/benefits",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Blue Cross Blue Shield | Group: GRP-98765",
    deductibleInfo: "Deductible: $1,500 | Met: $450",
    transcript: "API completed for Sarah Jane Johnson. All requested fields verified.",
  },
  {
    id: "3",
    requestId: "REQ-20260818-1045-1001",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-18 10:45:21",
    endTime: "2026-08-18 11:33:02",
    duration: "48m 41s",
    status: "SUCCESS",
    patientId: "1001",
    patientName: "Sarah Jane Johnson",
    insuranceProvider: "Blue Cross Blue Shield",
    insuranceRep: "Terrence Bell",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    phoneNumber: "1-800-555-0103",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Blue Cross Blue Shield | Group: GRP-98765",
    deductibleInfo: "Deductible: $1,500 | Met: $450",
    transcript: "CALL completed for Sarah Jane Johnson. All requested fields verified.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for Sarah Jane Johnson.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Terrence Bell with Blue Cross Blue Shield. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is 123456789, group number GRP-98765.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Annual maximum is $2,000/year, deductible $1,500 with $450 met. Preventive 100%, basic 80%, major 50%.",
        type: "answer",
      },
      {
        timestamp: "10:47:04",
        speaker: "AI",
        message: "That matches what we have on file. Thank you for your time.",
        type: "confirmation",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call completed. All requested fields verified. Status: SUCCESS",
        type: "note",
      },
    ],
  },
  {
    id: "4",
    requestId: "REQ-20260818-1140-1001",
    type: "SAVE",
    method: "POST /pms/patient/save",
    startTime: "2026-08-18 11:40:28",
    endTime: "2026-08-18 11:41:09",
    duration: "1m 41s",
    status: "SUCCESS",
    patientId: "1001",
    patientName: "Sarah Jane Johnson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Verified Data", "Insurance Benefits", "Coverage Details", "Deductible Info"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    endpoint: "https://pms.dental.local/api/patient/save",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Blue Cross Blue Shield | Group: GRP-98765",
    deductibleInfo: "Deductible: $1,500 | Met: $450",
    transcript: "SAVE completed for Sarah Jane Johnson. All requested fields verified.",
  },
  // ---- 1002 — Michael Robert Anderson ----
  {
    id: "5",
    requestId: "REQ-20260819-0905-1002",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-19 09:05:35",
    endTime: "2026-08-19 09:09:16",
    duration: "4m 41s",
    status: "PARTIAL",
    patientId: "1002",
    patientName: "Michael Robert Anderson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 60,
    fetchStatus: "pending",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $1,500/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,000 | Met: not returned",
    transcript: "FETCH finished with partial data for Michael Robert Anderson. Missing fields queued for a follow-up run.",
  },
  {
    id: "6",
    requestId: "REQ-20260819-0930-1002",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-19 09:30:42",
    endTime: "2026-08-19 09:31:23",
    duration: "0m 12s",
    status: "FAILED",
    patientId: "1002",
    patientName: "Michael Robert Anderson",
    insuranceProvider: "Delta Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: [],
    verificationScore: 0,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "503",
    endpoint: "https://api.delta.com/dental/benefits",
    errorMessage: "Carrier endpoint returned 503 Service Unavailable after 3 retries.",
    eligibilityCheck: "Not verified",
    benefitsVerification: "Not verified",
    coverageDetails: "Not verified",
    deductibleInfo: "Not verified",
    transcript: "API failed for Michael Robert Anderson. See the error message for detail.",
  },
  {
    id: "7",
    requestId: "REQ-20260819-1315-1002",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-19 13:15:49",
    endTime: "2026-08-19 13:37:30",
    duration: "22m 41s",
    status: "PARTIAL",
    patientId: "1002",
    patientName: "Michael Robert Anderson",
    insuranceProvider: "Delta Dental",
    insuranceRep: "Samuel Ortiz",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 48,
    fetchStatus: "pending",
    saveStatus: "pending",
    phoneNumber: "1-800-555-0107",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $1,500/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,000 | Met: not returned",
    transcript: "CALL finished with partial data for Michael Robert Anderson. Missing fields queued for a follow-up run.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for Michael Robert Anderson.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Samuel Ortiz with Delta Dental. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is 987654321, group number GRP-54321.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Let me pull that up — please hold while I check the benefit detail.",
        type: "hold",
      },
      {
        timestamp: "10:47:04",
        speaker: "System",
        message: "Hold exceeded 14 minutes; carrier line disconnected before benefits were read back.",
        type: "note",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call ended early. Partial data captured. Status: PARTIAL",
        type: "note",
      },
    ],
  },
  // ---- 1003 — Emily Rose Martinez ----
  {
    id: "8",
    requestId: "REQ-20260819-1112-1003",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-19 11:12:56",
    endTime: "2026-08-19 11:13:37",
    duration: "0m 12s",
    status: "FAILED",
    patientId: "1003",
    patientName: "Emily Rose Martinez",
    insuranceProvider: "Cigna Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: [],
    verificationScore: 0,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "503",
    endpoint: "https://api.cigna.com/dental/benefits",
    errorMessage: "Carrier endpoint returned 503 Service Unavailable after 3 retries.",
    eligibilityCheck: "Not verified",
    benefitsVerification: "Not verified",
    coverageDetails: "Not verified",
    deductibleInfo: "Not verified",
    transcript: "API failed for Emily Rose Martinez. See the error message for detail.",
  },
  // ---- 1004 — David Lee Thompson ----
  {
    id: "9",
    requestId: "REQ-20260817-0755-1004",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-17 07:55:03",
    endTime: "2026-08-17 07:58:44",
    duration: "3m 41s",
    status: "SUCCESS",
    patientId: "1004",
    patientName: "David Lee Thompson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-17",
    benefitsVerification: "Preventive: N/A, Basic: N/A, Major: N/A",
    coverageDetails: "Annual Maximum: N/A | Plan: Not on file | Group: -",
    deductibleInfo: "Deductible: N/A | Met: $0",
    transcript: "FETCH completed for David Lee Thompson. All requested fields verified.",
  },
  {
    id: "10",
    requestId: "REQ-20260817-0830-1004",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-17 08:30:10",
    endTime: "2026-08-17 08:31:51",
    duration: "0m 12s",
    status: "FAILED",
    patientId: "1004",
    patientName: "David Lee Thompson",
    insuranceProvider: "Not on file",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: [],
    verificationScore: 0,
    fetchStatus: "completed",
    saveStatus: "pending",
    responseCode: "503",
    endpoint: "https://api.not.com/dental/benefits",
    errorMessage: "Carrier endpoint returned 503 Service Unavailable after 3 retries.",
    eligibilityCheck: "Not verified",
    benefitsVerification: "Not verified",
    coverageDetails: "Not verified",
    deductibleInfo: "Not verified",
    transcript: "API failed for David Lee Thompson. See the error message for detail.",
  },
  {
    id: "11",
    requestId: "REQ-20260817-1405-1004",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-17 14:05:17",
    endTime: "2026-08-17 14:36:58",
    duration: "31m 41s",
    status: "SUCCESS",
    patientId: "1004",
    patientName: "David Lee Thompson",
    insuranceProvider: "Not on file",
    insuranceRep: "Terrence Bell",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "pending",
    phoneNumber: "1-800-555-0111",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-17",
    benefitsVerification: "Preventive: N/A, Basic: N/A, Major: N/A",
    coverageDetails: "Annual Maximum: N/A | Plan: Not on file | Group: -",
    deductibleInfo: "Deductible: N/A | Met: $0",
    transcript: "CALL completed for David Lee Thompson. All requested fields verified.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for David Lee Thompson.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Terrence Bell with Not on file. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is -, group number -.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Annual maximum is N/A, deductible N/A with $0 met. Preventive N/A, basic N/A, major N/A.",
        type: "answer",
      },
      {
        timestamp: "10:47:04",
        speaker: "AI",
        message: "That matches what we have on file. Thank you for your time.",
        type: "confirmation",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call completed. All requested fields verified. Status: SUCCESS",
        type: "note",
      },
    ],
  },
  // ---- 1005 — Jennifer Ann Williams ----
  {
    id: "12",
    requestId: "REQ-20260820-0840-1005",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-20 08:40:24",
    endTime: "2026-08-20 08:45:05",
    duration: "5m 41s",
    status: "PARTIAL",
    patientId: "1005",
    patientName: "Jennifer Ann Williams",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 60,
    fetchStatus: "pending",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $1,800/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,200 | Met: not returned",
    transcript: "FETCH finished with partial data for Jennifer Ann Williams. Missing fields queued for a follow-up run.",
  },
  {
    id: "13",
    requestId: "REQ-20260820-0910-1005",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-20 09:10:31",
    endTime: "2026-08-20 09:12:12",
    duration: "2m 41s",
    status: "PARTIAL",
    patientId: "1005",
    patientName: "Jennifer Ann Williams",
    insuranceProvider: "Aetna Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 55,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "206",
    endpoint: "https://api.aetna.com/dental/benefits",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $1,800/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,200 | Met: not returned",
    transcript: "API finished with partial data for Jennifer Ann Williams. Missing fields queued for a follow-up run.",
  },
  {
    id: "14",
    requestId: "REQ-20260820-1002-1005",
    type: "FAX",
    method: "FAX /fax/document-analysis",
    startTime: "2026-08-20 10:02:38",
    endTime: "2026-08-20 10:08:19",
    duration: "6m 41s",
    status: "SUCCESS",
    patientId: "1005",
    patientName: "Jennifer Ann Williams",
    insuranceProvider: "Aetna Dental",
    insuranceRep: "Fax System",
    runBy: "InSpline AI System",
    dataVerified: ["Member ID", "Plan Name", "Effective Date", "Coverage", "Annual Maximum"],
    verificationScore: 85,
    fetchStatus: "pending",
    saveStatus: "pending",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,800/year | Plan: Aetna Dental | Group: GRP-33333",
    deductibleInfo: "Deductible: $1,200 | Met: $800",
    transcript: "FAX completed for Jennifer Ann Williams. All requested fields verified.",
  },
  // ---- 1006 — Christopher James Davis ----
  {
    id: "15",
    requestId: "REQ-20260818-1520-1006",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-18 15:20:45",
    endTime: "2026-08-18 15:21:26",
    duration: "1m 41s",
    status: "SUCCESS",
    patientId: "1006",
    patientName: "Christopher James Davis",
    insuranceProvider: "Guardian Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 92,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "200",
    endpoint: "https://api.guardian.com/dental/benefits",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Guardian Dental | Group: GRP-99999",
    deductibleInfo: "Deductible: $1,500 | Met: $1,500",
    transcript: "API completed for Christopher James Davis. All requested fields verified.",
  },
  {
    id: "16",
    requestId: "REQ-20260818-1600-1006",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-18 16:00:52",
    endTime: "2026-08-18 16:27:33",
    duration: "27m 41s",
    status: "SUCCESS",
    patientId: "1006",
    patientName: "Christopher James Davis",
    insuranceProvider: "Guardian Dental",
    insuranceRep: "Amanda Rodriguez",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 100,
    fetchStatus: "pending",
    saveStatus: "pending",
    phoneNumber: "1-800-555-0116",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-18",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $2,000/year | Plan: Guardian Dental | Group: GRP-99999",
    deductibleInfo: "Deductible: $1,500 | Met: $1,500",
    transcript: "CALL completed for Christopher James Davis. All requested fields verified.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for Christopher James Davis.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Amanda Rodriguez with Guardian Dental. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is 888999000, group number GRP-99999.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Annual maximum is $2,000/year, deductible $1,500 with $1,500 met. Preventive 100%, basic 80%, major 50%.",
        type: "answer",
      },
      {
        timestamp: "10:47:04",
        speaker: "AI",
        message: "That matches what we have on file. Thank you for your time.",
        type: "confirmation",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call completed. All requested fields verified. Status: SUCCESS",
        type: "note",
      },
    ],
  },
  // ---- 1007 — Amanda Grace Brown ----
  {
    id: "17",
    requestId: "REQ-20260820-0815-1007",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-20 08:15:59",
    endTime: "2026-08-20 08:17:40",
    duration: "2m 41s",
    status: "SUCCESS",
    patientId: "1007",
    patientName: "Amanda Grace Brown",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    endpoint: "https://pms.dental.local/api/patient/data",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Humana Dental | Group: GRP-66666",
    deductibleInfo: "Deductible: $1,000 | Met: $300",
    transcript: "FETCH completed for Amanda Grace Brown. All requested fields verified.",
  },
  {
    id: "18",
    requestId: "REQ-20260820-0845-1007",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-20 08:45:06",
    endTime: "2026-08-20 08:46:47",
    duration: "1m 41s",
    status: "SUCCESS",
    patientId: "1007",
    patientName: "Amanda Grace Brown",
    insuranceProvider: "Humana Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 92,
    fetchStatus: "completed",
    saveStatus: "completed",
    responseCode: "200",
    endpoint: "https://api.humana.com/dental/benefits",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Humana Dental | Group: GRP-66666",
    deductibleInfo: "Deductible: $1,000 | Met: $300",
    transcript: "API completed for Amanda Grace Brown. All requested fields verified.",
  },
  {
    id: "19",
    requestId: "REQ-20260820-1130-1007",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-20 11:30:13",
    endTime: "2026-08-20 11:49:54",
    duration: "19m 41s",
    status: "PARTIAL",
    patientId: "1007",
    patientName: "Amanda Grace Brown",
    insuranceProvider: "Humana Dental",
    insuranceRep: "Terrence Bell",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 48,
    fetchStatus: "completed",
    saveStatus: "completed",
    phoneNumber: "1-800-555-0119",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $1,500/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,000 | Met: not returned",
    transcript: "CALL finished with partial data for Amanda Grace Brown. Missing fields queued for a follow-up run.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for Amanda Grace Brown.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Terrence Bell with Humana Dental. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is 444555666, group number GRP-66666.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Let me pull that up — please hold while I check the benefit detail.",
        type: "hold",
      },
      {
        timestamp: "10:47:04",
        speaker: "System",
        message: "Hold exceeded 14 minutes; carrier line disconnected before benefits were read back.",
        type: "note",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call ended early. Partial data captured. Status: PARTIAL",
        type: "note",
      },
    ],
  },
  {
    id: "20",
    requestId: "REQ-20260820-1210-1007",
    type: "SAVE",
    method: "POST /pms/patient/save",
    startTime: "2026-08-20 12:10:20",
    endTime: "2026-08-20 12:12:01",
    duration: "2m 41s",
    status: "SUCCESS",
    patientId: "1007",
    patientName: "Amanda Grace Brown",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Verified Data", "Insurance Benefits", "Coverage Details", "Deductible Info"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    endpoint: "https://pms.dental.local/api/patient/save",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Humana Dental | Group: GRP-66666",
    deductibleInfo: "Deductible: $1,000 | Met: $300",
    transcript: "SAVE completed for Amanda Grace Brown. All requested fields verified.",
  },
  // ---- 1008 — Robert William Garcia ----
  {
    id: "21",
    requestId: "REQ-20260819-1020-1008",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-19 10:20:27",
    endTime: "2026-08-19 10:26:08",
    duration: "6m 41s",
    status: "PARTIAL",
    patientId: "1008",
    patientName: "Robert William Garcia",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 60,
    fetchStatus: "pending",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $2,000/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,500 | Met: not returned",
    transcript: "FETCH finished with partial data for Robert William Garcia. Missing fields queued for a follow-up run.",
  },
  {
    id: "22",
    requestId: "REQ-20260819-1105-1008",
    type: "FAX",
    method: "FAX /fax/document-analysis",
    startTime: "2026-08-19 11:05:34",
    endTime: "2026-08-19 11:06:15",
    duration: "0m 12s",
    status: "FAILED",
    patientId: "1008",
    patientName: "Robert William Garcia",
    insuranceProvider: "United Healthcare Dental",
    insuranceRep: "Fax System",
    runBy: "InSpline AI System",
    dataVerified: [],
    verificationScore: 0,
    fetchStatus: "pending",
    saveStatus: "pending",
    errorMessage: "Fax transmission failed: no answer at the carrier fax line after 5 attempts.",
    eligibilityCheck: "Not verified",
    benefitsVerification: "Not verified",
    coverageDetails: "Not verified",
    deductibleInfo: "Not verified",
    transcript: "FAX failed for Robert William Garcia. See the error message for detail.",
  },
  {
    id: "23",
    requestId: "REQ-20260819-1545-1008",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-19 15:45:41",
    endTime: "2026-08-19 15:47:22",
    duration: "2m 41s",
    status: "PARTIAL",
    patientId: "1008",
    patientName: "Robert William Garcia",
    insuranceProvider: "United Healthcare Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 55,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "206",
    endpoint: "https://api.united.com/dental/benefits",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: not returned",
    coverageDetails: "Annual Maximum: $2,000/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,500 | Met: not returned",
    transcript: "API finished with partial data for Robert William Garcia. Missing fields queued for a follow-up run.",
  },
  // ---- 1009 — Patricia Lynn Miller ----
  {
    id: "24",
    requestId: "REQ-20260816-0948-1009",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-16 09:48:48",
    endTime: "2026-08-16 09:49:29",
    duration: "0m 12s",
    status: "FAILED",
    patientId: "1009",
    patientName: "Patricia Lynn Miller",
    insuranceProvider: "Anthem Blue Cross",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: [],
    verificationScore: 0,
    fetchStatus: "pending",
    saveStatus: "pending",
    responseCode: "503",
    endpoint: "https://api.anthem.com/dental/benefits",
    errorMessage: "Carrier endpoint returned 503 Service Unavailable after 3 retries.",
    eligibilityCheck: "Not verified",
    benefitsVerification: "Not verified",
    coverageDetails: "Not verified",
    deductibleInfo: "Not verified",
    transcript: "API failed for Patricia Lynn Miller. See the error message for detail.",
  },
  {
    id: "25",
    requestId: "REQ-20260816-1322-1009",
    type: "FAX",
    method: "FAX /fax/document-analysis",
    startTime: "2026-08-16 13:22:55",
    endTime: "2026-08-16 13:30:36",
    duration: "8m 41s",
    status: "PARTIAL",
    patientId: "1009",
    patientName: "Patricia Lynn Miller",
    insuranceProvider: "Anthem Blue Cross",
    insuranceRep: "Fax System",
    runBy: "InSpline AI System",
    dataVerified: ["Member ID", "Plan Name", "Effective Date", "Coverage", "Annual Maximum"],
    verificationScore: 40,
    fetchStatus: "pending",
    saveStatus: "pending",
    errorMessage: "Carrier returned an incomplete benefit set; re-run required for the missing fields.",
    eligibilityCheck: "ACTIVE — eligibility confirmed, benefit detail incomplete",
    benefitsVerification: "Preventive: 100%, Basic: 85%, Major: not returned",
    coverageDetails: "Annual Maximum: $2,200/year | Remaining benefit not returned by carrier",
    deductibleInfo: "Deductible: $1,800 | Met: not returned",
    transcript: "FAX finished with partial data for Patricia Lynn Miller. Missing fields queued for a follow-up run.",
  },
  // ---- 1010 — James Alexander Wilson ----
  {
    id: "26",
    requestId: "REQ-20260820-0748-1010",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2026-08-20 07:48:02",
    endTime: "2026-08-20 07:50:43",
    duration: "2m 41s",
    status: "SUCCESS",
    patientId: "1010",
    patientName: "James Alexander Wilson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    dataVerified: ["Patient ID", "Patient Name", "DOB", "Contact Info", "Insurance On File"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Cigna Dental | Group: GRP-22222",
    deductibleInfo: "Deductible: $800 | Met: $400",
    transcript: "FETCH completed for James Alexander Wilson. All requested fields verified.",
  },
  {
    id: "27",
    requestId: "REQ-20260820-0905-1010",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2026-08-20 09:05:09",
    endTime: "2026-08-20 09:06:50",
    duration: "1m 41s",
    status: "SUCCESS",
    patientId: "1010",
    patientName: "James Alexander Wilson",
    insuranceProvider: "Cigna Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    dataVerified: ["Subscriber ID", "Group Number", "Plan Status", "Annual Maximum", "Deductible", "Preventive %", "Basic %", "Major %"],
    verificationScore: 92,
    fetchStatus: "completed",
    saveStatus: "pending",
    responseCode: "200",
    endpoint: "https://api.cigna.com/dental/benefits",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Cigna Dental | Group: GRP-22222",
    deductibleInfo: "Deductible: $800 | Met: $400",
    transcript: "API completed for James Alexander Wilson. All requested fields verified.",
  },
  {
    id: "28",
    requestId: "REQ-20260820-1045-1010",
    type: "CALL",
    method: "VOICE /ai-agent/verify",
    startTime: "2026-08-20 10:45:16",
    endTime: "2026-08-20 11:29:57",
    duration: "44m 41s",
    status: "SUCCESS",
    patientId: "1010",
    patientName: "James Alexander Wilson",
    insuranceProvider: "Cigna Dental",
    insuranceRep: "Priya Raman",
    runBy: "InSpline AI System",
    dataVerified: ["Eligibility", "Benefits", "Coverage Limits", "Deductibles", "Waiting Periods"],
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "pending",
    phoneNumber: "1-800-555-0128",
    eligibilityCheck: "ACTIVE — policy in good standing, verified 2026-08-20",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50%",
    coverageDetails: "Annual Maximum: $1,500/year | Plan: Cigna Dental | Group: GRP-22222",
    deductibleInfo: "Deductible: $800 | Met: $400",
    transcript: "CALL completed for James Alexander Wilson. All requested fields verified.",
    callHistory: [
      {
        timestamp: "10:45:22",
        speaker: "AI",
        message: "Good morning, this is the InSpline verification agent calling on behalf of Bright Smile Dental Group to verify benefits for James Alexander Wilson.",
        type: "question",
      },
      {
        timestamp: "10:45:39",
        speaker: "InsuranceRep",
        message: "This is Priya Raman with Cigna Dental. I can help with that — may I have the subscriber ID and date of birth?",
        type: "answer",
      },
      {
        timestamp: "10:45:56",
        speaker: "AI",
        message: "Subscriber ID is 333444555, group number GRP-22222.",
        type: "confirmation",
      },
      {
        timestamp: "10:46:13",
        speaker: "InsuranceRep",
        message: "Thank you, I have the member on file. What would you like to verify today?",
        type: "answer",
      },
      {
        timestamp: "10:46:30",
        speaker: "AI",
        message: "Annual maximum, remaining benefit, deductible status and the coverage tiers, please.",
        type: "question",
      },
      {
        timestamp: "10:46:47",
        speaker: "InsuranceRep",
        message: "Annual maximum is $1,500/year, deductible $800 with $400 met. Preventive 100%, basic 80%, major 50%.",
        type: "answer",
      },
      {
        timestamp: "10:47:04",
        speaker: "AI",
        message: "That matches what we have on file. Thank you for your time.",
        type: "confirmation",
      },
      {
        timestamp: "10:47:21",
        speaker: "System",
        message: "Call completed. All requested fields verified. Status: SUCCESS",
        type: "note",
      },
    ],
  },
];

type StatusFilter = 'ALL' | Transaction['status'];

/** Status filter chips: label, icon and the colours used when selected. */
const STATUS_FILTERS: Array<{
  key: Transaction['status'];
  label: string;
  icon: string;
  activeClass: string;
  idleClass: string;
}> = [
  {
    key: 'SUCCESS',
    label: 'Success',
    icon: 'check_circle',
    activeClass: 'bg-green-600 text-white',
    idleClass: 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
  },
  {
    key: 'PARTIAL',
    label: 'Partial',
    icon: 'error',
    activeClass: 'bg-yellow-500 text-white',
    idleClass: 'text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
  },
  {
    key: 'FAILED',
    label: 'Failed',
    icon: 'cancel',
    activeClass: 'bg-red-600 text-white',
    idleClass: 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [activeDetailTab, setActiveDetailTab] = useState<{ [key: string]: string }>({});
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
    // Return mockData, filtering by patient if needed
    return mockData.filter((txn) => !patientId || txn.patientId === patientId);
  };

  // Fetch transactions from API or use mock data
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Check if real data mode is enabled (stediMode is not 'mockup')
      const isRealDataMode = currentUser?.stediMode && currentUser.stediMode !== 'mockup';

      if (!isRealDataMode) {
        // Mockup mode - use mock data
        setTransactions(getMockTransactions());
        setLoading(false);
        return;
      }

      // Real data mode - fetch from database

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
      setActiveDetailTab({ ...activeDetailTab, [id]: 'action' });
    }
  };

  const setDetailTab = (transactionId: string, tab: string) => {
    setActiveDetailTab({ ...activeDetailTab, [transactionId]: tab });
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

  // Filter data based on the selected status
  const filteredData = transactions.filter(
    transaction => statusFilter === 'ALL' || transaction.status === statusFilter
  );

  // Count shown on each chip: how many rows that status would keep.
  const countByStatus = (status: Transaction['status'] | 'ALL') =>
    transactions.filter(t => status === 'ALL' || t.status === status).length;

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
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Status
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${statusFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            ALL
            <span className={`px-1 rounded-full text-[9px] ${statusFilter === 'ALL' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {countByStatus('ALL')}
            </span>
          </button>
          {STATUS_FILTERS.map(option => {
            const isSelected = statusFilter === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setStatusFilter(isSelected ? 'ALL' : option.key)}
                aria-pressed={isSelected}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${isSelected ? option.activeClass : option.idleClass
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{option.icon}</span>
                {option.label}
                <span className={`px-1 rounded-full text-[9px] ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {countByStatus(option.key)}
                </span>
              </button>
            );
          })}

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="ml-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>filter_alt_off</span>
              Clear
            </button>
          )}

          {/* Refresh + result count */}
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
            <div className="col-span-2">Insurance(Payer)</div>
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
                    <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg transition-transform duration-200 ${expandedId === transaction.id ? 'rotate-180' : ''
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
                      <span className={`font-semibold text-sm ${transaction.verificationScore >= 90 ? 'text-green-600 dark:text-green-400' :
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
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${(activeDetailTab[transaction.id] || 'action') === 'action'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                      >
                        Transaction Info
                      </button>
                      <button
                        onClick={() => setDetailTab(transaction.id, 'summary')}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${(activeDetailTab[transaction.id] || 'action') === 'summary'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                      >
                        Transaction Summary
                      </button>
                      {transaction.callHistory && transaction.callHistory.length > 0 ? (
                        <button
                          onClick={() => setDetailTab(transaction.id, 'callHistory')}
                          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${(activeDetailTab[transaction.id] || 'action') === 'callHistory'
                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          Call History Detail
                        </button>
                      ) : (
                        <button
                          onClick={() => setDetailTab(transaction.id, 'detail')}
                          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${(activeDetailTab[transaction.id] || 'action') === 'detail'
                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          Transaction Detail
                        </button>
                      )}
                      {/* <button
                        onClick={() => handleRequestFaxDocument()}
                        className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ml-auto"
                        title="Request insurance fax document"
                      >
                        <span className="material-symbols-outlined text-sm align-text-bottom mr-1">description</span>
                        Run Fax Document Analysis
                      </button> */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step1Status === 'completed'
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
                    <div className="font-medium text-slate-900 dark:text-white">Analysis</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Coverage Details</div>
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
