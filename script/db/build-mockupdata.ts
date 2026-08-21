/**
 * Regenerates the mockup database in `mockupdata/db/`.
 *
 * Each output file is named after a physical table in `shared/schema.ts` and
 * holds a plain array of rows. The backend's in-memory database
 * (`backend/mock-db.ts`) loads these files at startup and serves them through
 * the same query API the app previously used against PostgreSQL.
 *
 * Values are written in readable form: passwords are plaintext and HIPAA fields
 * (birth date, SSN, group number, subscriber id) are unmasked. The loader
 * hashes and encrypts them on the way in, so what the routes see at runtime is
 * identical to what PostgreSQL held.
 *
 * Run with:  npx tsx script/db/build-mockupdata.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCKUP_DIR = resolve(__dirname, "../../mockupdata");
const OUT_DIR = join(MOCKUP_DIR, "db");

type Row = Record<string, any>;

const pad = (value: number, width: number) => String(value).padStart(width, "0");
const write = (table: string, rows: Row[]) => {
  writeFileSync(join(OUT_DIR, `${table}.json`), `${JSON.stringify(rows, null, 2)}\n`, "utf-8");
  console.log(`${table.padEnd(28)} ${rows.length} rows`);
};

mkdirSync(OUT_DIR, { recursive: true });

/* ------------------------------------------------------------------ */
/* Accounts (clinics), practices, payers and login accounts            */
/* ------------------------------------------------------------------ */

// An account is the clinic a set of users signs in under. Each demo practice
// gets one, and its provider record points back at it.
const accounts: Row[] = [
  {
    id: "ACC-0001",
    name: "Bright Smile Dental Group",
    legalName: "Bright Smile Dental Group, PLLC",
    npiNumber: "1999999984",
    taxId: "74-3011882",
    phoneNumber: "(512) 555-0100",
    faxNumber: "(512) 555-0142",
    email: "office@brightsmiledental.com",
    website: "https://www.brightsmiledental.com",
    addressLine1: "1200 Congress Ave",
    addressLine2: "Suite 300",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    timezone: "America/Chicago",
    status: "active",
    createdAt: "2025-01-06T09:00:00.000Z",
    updatedAt: "2025-01-06T09:00:00.000Z",
  },
  {
    id: "ACC-0002",
    name: "Riverside Family Dentistry",
    legalName: "Riverside Family Dentistry, LLC",
    npiNumber: "1861345572",
    taxId: "36-4520918",
    phoneNumber: "(312) 555-0110",
    faxNumber: "(312) 555-0177",
    email: "front.desk@riversidefamilydental.com",
    website: "https://www.riversidefamilydental.com",
    addressLine1: "455 Riverside Dr",
    addressLine2: "",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    timezone: "America/Chicago",
    status: "active",
    createdAt: "2025-01-06T09:05:00.000Z",
    updatedAt: "2025-01-06T09:05:00.000Z",
  },
  {
    id: "ACC-0003",
    name: "Lakeview Orthodontics",
    legalName: "Lakeview Orthodontics, PC",
    npiNumber: "1730294857",
    taxId: "91-2277340",
    phoneNumber: "(206) 555-0120",
    faxNumber: "(206) 555-0198",
    email: "hello@lakeviewortho.com",
    website: "https://www.lakeviewortho.com",
    addressLine1: "88 Lakeview Blvd",
    addressLine2: "Floor 2",
    city: "Seattle",
    state: "WA",
    zipCode: "98109",
    timezone: "America/Los_Angeles",
    status: "active",
    createdAt: "2025-01-06T09:10:00.000Z",
    updatedAt: "2025-01-06T09:10:00.000Z",
  },
];

const providers: Row[] = [
  {
    id: "PRV-0001",
    accountId: "ACC-0001",
    name: "Bright Smile Dental Group",
    npiNumber: "1999999984",
    faxNumber: "(512) 555-0142",
    phoneNumber: "(512) 555-0100",
    address: "1200 Congress Ave, Suite 300, Austin, TX 78701",
    taxNumber: "74-3011882",
    createdAt: "2025-01-06T09:00:00.000Z",
  },
  {
    id: "PRV-0002",
    accountId: "ACC-0002",
    name: "Riverside Family Dentistry",
    npiNumber: "1861345572",
    faxNumber: "(312) 555-0177",
    phoneNumber: "(312) 555-0110",
    address: "455 Riverside Dr, Chicago, IL 60601",
    taxNumber: "36-4520918",
    createdAt: "2025-01-06T09:05:00.000Z",
  },
  {
    id: "PRV-0003",
    accountId: "ACC-0003",
    name: "Lakeview Orthodontics",
    npiNumber: "1730294857",
    faxNumber: "(206) 555-0198",
    phoneNumber: "(206) 555-0120",
    address: "88 Lakeview Blvd, Seattle, WA 98109",
    taxNumber: "91-2277340",
    createdAt: "2025-01-06T09:10:00.000Z",
  },
];

const payers: Row[] = [
  { payerId: "60054", name: "Aetna Dental", phoneNumber: "(800) 555-0154", faxNumber: "(800) 555-0155" },
  { payerId: "AMERI", name: "Ameritas Dental", phoneNumber: "(800) 555-0161", faxNumber: "(800) 555-0162" },
  { payerId: "84056", name: "Blue Cross Blue Shield of Texas (Dental)", phoneNumber: "(800) 555-0171", faxNumber: "(800) 555-0172" },
  { payerId: "00040", name: "Blue Cross Blue Shield", phoneNumber: "(800) 555-0175", faxNumber: "(800) 555-0176" },
  { payerId: "00060", name: "Anthem Blue Cross", phoneNumber: "(800) 555-0178", faxNumber: "(800) 555-0179" },
  { payerId: "PNMDV", name: "Cigna Dental", phoneNumber: "(800) 555-0181", faxNumber: "(800) 555-0182" },
  { payerId: "52158", name: "Delta Dental Insurance Co", phoneNumber: "(800) 555-0191", faxNumber: "(800) 555-0192" },
  { payerId: "94276", name: "Delta Dental", phoneNumber: "(800) 555-0193", faxNumber: "(800) 555-0194" },
  { payerId: "39046", name: "Guardian Dental", phoneNumber: "(800) 555-0201", faxNumber: "(800) 555-0202" },
  { payerId: "93693", name: "Humana Dental", phoneNumber: "(800) 555-0211", faxNumber: "(800) 555-0212" },
  { payerId: "11180", name: "MetLife Dental", phoneNumber: "(800) 555-0221", faxNumber: "(800) 555-0222" },
  { payerId: "66035", name: "Principal Financial Group (Dental)", phoneNumber: "(800) 555-0231", faxNumber: "(800) 555-0232" },
  { payerId: "65083", name: "United Concordia", phoneNumber: "(800) 555-0241", faxNumber: "(800) 555-0242" },
  { payerId: "52133", name: "UnitedHealthcare Dental", phoneNumber: "(800) 555-0251", faxNumber: "(800) 555-0252" },
  { payerId: "87726", name: "United Healthcare Dental", phoneNumber: "(800) 555-0253", faxNumber: "(800) 555-0254" },
].map((payer, index) => ({ id: `PAY-${pad(index + 1, 4)}`, ...payer }));

const payerIdByName = new Map(payers.map((payer) => [payer.name, payer.payerId]));

// Three logins: the InSpline system admin (no clinic), plus a manager and a
// dental user at the first clinic account. `admin` is a system role and never
// belongs to an account; `manager` and `dental` are the two clinic roles.
// Passwords are plaintext here on purpose; mock-db bcrypt-hashes them on load.
const users: Row[] = [
  {
    id: "USR-0001",
    email: "admin01@inspline.com",
    username: "admin01",
    password: "Admin@123",
    role: "admin",
    stediMode: "mockup",
    accountId: null,
    providerId: null,
  },
  {
    id: "USR-0002",
    email: "dental01@inspline.com",
    username: "dental01",
    password: "Dental@123",
    role: "dental",
    stediMode: "mockup",
    accountId: accounts[0].id,
    providerId: providers[0].id,
  },
  {
    id: "USR-0003",
    email: "manager01@inspline.com",
    username: "manager01",
    password: "Manager@123",
    role: "manager",
    stediMode: "mockup",
    accountId: accounts[0].id,
    providerId: providers[0].id,
  },
];

const dentalUserIds = users.filter((user) => user.role === "dental").map((user) => user.id);

// Provider accounts a clinic manager has linked to a team member, so that
// member can sign in with Google or Microsoft Teams instead of a password.
// One row per user and provider; the manager who linked it is recorded.
const userSsoIdentities: Row[] = [
  {
    id: "SSO-0001",
    userId: "USR-0002",
    provider: "google",
    email: "dental01.brightsmile@gmail.com",
    linkedBy: "USR-0003",
    createdAt: new Date("2026-01-12T15:20:00Z"),
  },
];

/* ------------------------------------------------------------------ */
/* Patients and everything hanging off them                            */
/* ------------------------------------------------------------------ */

type SourcePatient = {
  id: string;
  active: boolean;
  name: { given: string[]; family: string };
  gender: string;
  birthDate: string;
  ssn: string;
  verificationStatus?: Record<string, string>;
  telecom?: { system: string; value: string }[];
  address?: { line?: string[]; city?: string; state?: string; postalCode?: string }[];
  insurance?: Row[];
  appointments?: Row[];
  treatments?: Row[];
  coverage?: Row;
  aiCallHistory?: Row[];
};

const sourcePatients: SourcePatient[] = JSON.parse(readFileSync(join(MOCKUP_DIR, "patients.json"), "utf-8"));

const patients: Row[] = [];
const patientTelecoms: Row[] = [];
const patientAddresses: Row[] = [];
const insurances: Row[] = [];
const appointments: Row[] = [];
const treatments: Row[] = [];
const coverageDetails: Row[] = [];
const procedures: Row[] = [];
const verificationStatuses: Row[] = [];
const aiCallHistory: Row[] = [];

let telecomSeq = 0;
let addressSeq = 0;
let insuranceSeq = 0;
let appointmentSeq = 0;
let treatmentSeq = 0;
let coverageSeq = 0;
let procedureSeq = 0;
let aiCallSeq = 0;

sourcePatients.forEach((source, index) => {
  const patientId = `P${pad(index + 1, 7)}`;
  const [givenName, ...middleParts] = source.name.given;

  patients.push({
    id: patientId,
    userId: dentalUserIds[index % dentalUserIds.length],
    active: source.active,
    givenName,
    middleName: middleParts.join(" ") || null,
    familyName: source.name.family,
    gender: source.gender,
    birthDate: source.birthDate,
    ssn: source.ssn,
    clinicPatientId: `CLN-${source.id}`,
    createdAt: `2025-02-${pad(index + 1, 2)}T15:00:00.000Z`,
    updatedAt: `2025-11-${pad(index + 1, 2)}T15:00:00.000Z`,
  });

  for (const telecom of source.telecom ?? []) {
    patientTelecoms.push({ id: `TEL-${pad(++telecomSeq, 4)}`, patientId, system: telecom.system, value: telecom.value });
  }

  for (const address of source.address ?? []) {
    patientAddresses.push({
      id: `ADR-${pad(++addressSeq, 4)}`,
      patientId,
      line1: address.line?.[0] ?? null,
      line2: address.line?.[1] ?? null,
      city: address.city ?? null,
      state: address.state ?? null,
      postalCode: address.postalCode ?? null,
    });
  }

  for (const insurance of source.insurance ?? []) {
    insurances.push({
      id: `INS-${pad(++insuranceSeq, 4)}`,
      patientId,
      provider: insurance.provider,
      payerId: payerIdByName.get(insurance.provider) ?? null,
      employerName: insurance.employerName || null,
      groupNumber: insurance.groupNumber ?? null,
      subscriberName: insurance.subscriberName ?? null,
      subscriberId: insurance.subscriberId ?? null,
      relationship: insurance.relationship ?? null,
      effectiveDate: insurance.effectiveDate ?? null,
      expirationDate: insurance.expirationDate ?? null,
      deductible: insurance.coverage?.deductible ?? null,
      deductibleMet: insurance.coverage?.deductibleMet ?? null,
      maxBenefit: insurance.coverage?.maxBenefit ?? null,
      preventiveCoverage: insurance.coverage?.preventiveCoverage ?? null,
      basicCoverage: insurance.coverage?.basicCoverage ?? null,
      majorCoverage: insurance.coverage?.majorCoverage ?? null,
    });
  }

  for (const appointment of source.appointments ?? []) {
    appointments.push({
      id: `APT-${pad(++appointmentSeq, 4)}`,
      patientId,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      provider: appointment.provider ?? null,
    });
  }

  for (const treatment of source.treatments ?? []) {
    treatments.push({
      id: `TRT-${pad(++treatmentSeq, 4)}`,
      patientId,
      name: treatment.name,
      date: treatment.date,
      cost: treatment.cost ?? null,
    });
  }

  if (source.coverage) {
    const coverageId = `COV-${pad(++coverageSeq, 4)}`;
    coverageDetails.push({
      id: coverageId,
      patientId,
      annualMaximum: String(source.coverage.annual_maximum ?? 0),
      annualUsed: String(source.coverage.annual_used ?? 0),
      deductible: String(source.coverage.deductible ?? 0),
      deductibleMet: String(source.coverage.deductible_met ?? 0),
    });

    for (const procedure of source.coverage.procedures ?? []) {
      procedures.push({
        id: `PRC-${pad(++procedureSeq, 4)}`,
        coverageId,
        code: procedure.code,
        name: procedure.name,
        category: procedure.category,
        coverage: procedure.coverage ?? null,
        estimatedCost: procedure.estimated_cost ?? null,
        patientPays: procedure.patient_pays ?? null,
      });
    }
  }

  const status = source.verificationStatus ?? {};
  const fetchPMS = status.fetchPMS ?? "pending";
  verificationStatuses.push({
    id: `VST-${pad(index + 1, 4)}`,
    patientId,
    fetchPMS,
    documentAnalysis: fetchPMS === "completed" ? "completed" : "pending",
    apiVerification: status.aiAnalysisAndCall ?? "pending",
    callCenter: status.aiAnalysisAndCall === "completed" ? "completed" : "pending",
    aiAnalysisAndCall: status.aiAnalysisAndCall ?? "pending",
    saveToPMS: status.saveToPMS ?? "pending",
  });

  for (const call of source.aiCallHistory ?? []) {
    aiCallHistory.push({
      id: `AIC-${pad(++aiCallSeq, 4)}`,
      patientId,
      topic: call.topic,
      date: call.date,
      time: call.time,
      summary: call.summary ?? null,
      duration: call.duration ?? null,
      agent: call.agent ?? null,
      status: call.status,
    });
  }
});

// A couple of extra AI calls so the history view is not near-empty.
aiCallHistory.push(
  {
    id: `AIC-${pad(++aiCallSeq, 4)}`,
    patientId: "P0000001",
    topic: "AI Verification Call - Annual Benefits Refresh",
    date: "2025-11-28",
    time: "09:32 AM",
    summary: "Confirmed 2026 plan year benefits with Blue Cross Blue Shield. Annual maximum unchanged at $2,000, deductible $1,500 with $450 applied.",
    duration: "6m 12s",
    agent: "InSpline AI - Benefits Agent",
    status: "completed",
  },
  {
    id: `AIC-${pad(++aiCallSeq, 4)}`,
    patientId: "P0000003",
    topic: "AI Verification Call - Orthodontic Lifetime Maximum",
    date: "2025-12-02",
    time: "02:05 PM",
    summary: "Cigna Dental confirmed a $1,500 orthodontic lifetime maximum with a 12 month waiting period on major services.",
    duration: "8m 47s",
    agent: "InSpline AI - Authorization Agent",
    status: "completed",
  },
);

/* ------------------------------------------------------------------ */
/* Verification transactions                                           */
/* ------------------------------------------------------------------ */

const transactions: Row[] = [
  {
    id: "TXN-0001",
    requestId: "REQ-2025-11-28-0800",
    patientId: "P0000001",
    type: "FETCH",
    method: "GET /pms/patient/data",
    startTime: "2025-11-28 08:00:00",
    endTime: "2025-11-28 08:02:15",
    duration: "2m 15s",
    status: "SUCCESS",
    patientName: "Sarah Johnson",
    insuranceProvider: "-",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "pending",
    endpoint: "https://pms.dental.local/api/patient/data",
    eligibilityCheck: "Patient record retrieved from PMS",
    benefitsVerification: "Data synchronized with local database",
    coverageDetails: "Patient active in system",
    deductibleInfo: "Initial data fetch completed",
    transcript: "Fetch PMS data completed successfully. Patient information retrieved and validated.",
    createdAt: "2025-11-28T08:02:15.000Z",
  },
  {
    id: "TXN-0002",
    requestId: "REQ-2025-11-28-0930",
    patientId: "P0000001",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2025-11-28 09:30:15",
    endTime: "2025-11-28 09:31:25",
    duration: "1m 10s",
    status: "SUCCESS",
    patientName: "Sarah Johnson",
    insuranceProvider: "Blue Cross Blue Shield",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    verificationScore: 92,
    fetchStatus: "completed",
    saveStatus: "completed",
    responseCode: "200",
    endpoint: "https://api.bcbs.com/dental/benefits",
    eligibilityCheck: "ACTIVE - Policy effective through 12/31/2026. Policy status: active and in good standing.",
    benefitsVerification: "Preventive: 100%, Basic: 80%, Major: 50% | Waiting Periods: Preventive - None, Basic - None, Major - 12 months",
    coverageDetails: "Annual Maximum: $2,000 | Used: $1,470 | Remaining: $530 | Plan Type: PPO Premium",
    deductibleInfo: "Individual Deductible: $1,500 | Deductible Met: $450",
    rawResponse:
      '{"verification_id":"VER-2025-001234","timestamp":"2025-11-28T09:31:25Z","patient":{"name":"Sarah Johnson","member_id":"123456789"},"insurance":{"carrier":"Blue Cross Blue Shield","group_number":"GRP-98765","policy_status":"active","plan_type":"PPO Premium"},"benefits":{"annual_maximum":2000,"annual_used":1470,"deductible":1500,"deductible_met":450,"preventive_coverage":"100%","basic_coverage":"80%","major_coverage":"50%"}}',
    createdAt: "2025-11-28T09:31:25.000Z",
  },
  {
    id: "TXN-0003",
    requestId: "REQ-2025-11-28-1015",
    patientId: "P0000001",
    type: "SAVE",
    method: "POST /pms/patient/coverage",
    startTime: "2025-11-28 10:15:00",
    endTime: "2025-11-28 10:15:42",
    duration: "42s",
    status: "SUCCESS",
    patientName: "Sarah Johnson",
    insuranceProvider: "Blue Cross Blue Shield",
    insuranceRep: "-",
    runBy: "InSpline AI System",
    verificationScore: 100,
    fetchStatus: "completed",
    saveStatus: "completed",
    responseCode: "201",
    endpoint: "https://pms.dental.local/api/patient/coverage",
    eligibilityCheck: "Verified coverage written back to PMS",
    benefitsVerification: "38 coverage fields saved",
    coverageDetails: "Annual maximum, deductible and category percentages updated",
    deductibleInfo: "Deductible met $450 of $1,500",
    transcript: "Save to PMS completed. All verified benefit fields committed.",
    createdAt: "2025-11-28T10:15:42.000Z",
  },
  {
    id: "TXN-0004",
    requestId: "REQ-2025-11-29-1100",
    patientId: "P0000002",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2025-11-29 11:00:05",
    endTime: "2025-11-29 11:01:02",
    duration: "57s",
    status: "PARTIAL",
    patientName: "Michael Anderson",
    insuranceProvider: "Delta Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    verificationScore: 64,
    fetchStatus: "completed",
    saveStatus: "pending",
    responseCode: "206",
    endpoint: "https://api.deltadental.com/benefits",
    eligibilityCheck: "ACTIVE - Coordination of benefits required (secondary policy on file with MetLife Dental)",
    benefitsVerification: "Preventive: 100%, Basic: 90% | Major coverage not returned by payer",
    coverageDetails: "Annual Maximum: $2,500 | Used: $1,850 | Remaining: $650",
    deductibleInfo: "Individual Deductible: $2,500 | Deductible Met: $1,000",
    errorMessage: "Major services percentage missing from 271 response - call center follow-up required",
    createdAt: "2025-11-29T11:01:02.000Z",
  },
  {
    id: "TXN-0005",
    requestId: "REQ-2025-11-29-1130",
    patientId: "P0000002",
    type: "CALL",
    method: "CALL /call-center/verify",
    startTime: "2025-11-29 11:30:00",
    endTime: "2025-11-29 11:42:31",
    duration: "12m 31s",
    status: "SUCCESS",
    patientName: "Michael Anderson",
    insuranceProvider: "Delta Dental",
    insuranceRep: "Karen M.",
    runBy: "InSpline AI - Benefits Agent",
    verificationScore: 96,
    fetchStatus: "completed",
    saveStatus: "pending",
    phoneNumber: "(800) 555-0193",
    eligibilityCheck: "ACTIVE - Confirmed verbally by representative",
    benefitsVerification: "Major services confirmed at 50% with a 12 month waiting period satisfied 03/2025",
    coverageDetails: "Annual Maximum: $2,500 | Used: $1,850 | Remaining: $650",
    deductibleInfo: "Individual Deductible: $2,500 | Deductible Met: $1,000",
    transcript: "AI agent reached Delta Dental representative Karen M. and confirmed major services coverage and waiting period status.",
    createdAt: "2025-11-29T11:42:31.000Z",
  },
  {
    id: "TXN-0006",
    requestId: "REQ-2025-12-01-0915",
    patientId: "P0000003",
    type: "FAX",
    method: "FAX /fax/document-analysis",
    startTime: "2025-12-01 09:15:30",
    endTime: "2025-12-01 09:19:04",
    duration: "3m 34s",
    status: "SUCCESS",
    patientName: "Emily Martinez",
    insuranceProvider: "Cigna Dental",
    insuranceRep: "-",
    runBy: "InSpline AI - Document Agent",
    verificationScore: 78,
    fetchStatus: "completed",
    saveStatus: "pending",
    endpoint: "https://fax.inspline.local/inbound/8841",
    eligibilityCheck: "Insurance card OCR completed with 3 fields extracted",
    benefitsVerification: "Subscriber ID and group number matched existing policy",
    coverageDetails: "Breakdown sheet parsed: Preventive 100%, Basic 80%, Major 50%",
    deductibleInfo: "Deductible $75 | Met $75",
    transcript: "Inbound fax received and analyzed. Extracted fields queued for verification.",
    createdAt: "2025-12-01T09:19:04.000Z",
  },
  {
    id: "TXN-0007",
    requestId: "REQ-2025-12-02-1400",
    patientId: "P0000003",
    type: "CALL",
    method: "CALL /call-center/verify",
    startTime: "2025-12-02 14:00:00",
    endTime: null,
    duration: null,
    status: "Waiting",
    patientName: "Emily Martinez",
    insuranceProvider: "Cigna Dental",
    insuranceRep: null,
    runBy: "InSpline AI - Authorization Agent",
    verificationScore: null,
    fetchStatus: "completed",
    saveStatus: "pending",
    phoneNumber: "(800) 555-0181",
    eligibilityCheck: "Queued for call center verification",
    createdAt: "2025-12-02T14:00:00.000Z",
  },
  {
    id: "TXN-0008",
    requestId: "REQ-2025-12-03-0805",
    patientId: "P0000005",
    type: "API",
    method: "POST /api/benefits/query",
    startTime: "2025-12-03 08:05:11",
    endTime: "2025-12-03 08:05:29",
    duration: "18s",
    status: "FAILED",
    patientName: "Jennifer Williams",
    insuranceProvider: "Aetna Dental",
    insuranceRep: "API System",
    runBy: "InSpline AI System",
    verificationScore: 0,
    fetchStatus: "completed",
    saveStatus: "pending",
    responseCode: "422",
    endpoint: "https://api.aetna.com/dental/benefits",
    errorMessage: "AAA error 72 - Invalid or missing subscriber identification number",
    createdAt: "2025-12-03T08:05:29.000Z",
  },
];

const callCommunications: Row[] = [
  { id: "CMM-0001", transactionId: "TXN-0005", timestamp: "2025-11-29 11:30:12", speaker: "System", message: "Outbound call placed to Delta Dental provider line (800) 555-0193.", type: "note" },
  { id: "CMM-0002", transactionId: "TXN-0005", timestamp: "2025-11-29 11:31:40", speaker: "System", message: "Navigated IVR menu: option 2 (dental provider), option 1 (benefits and eligibility).", type: "note" },
  { id: "CMM-0003", transactionId: "TXN-0005", timestamp: "2025-11-29 11:34:02", speaker: "InsuranceRep", message: "Thank you for calling Delta Dental, this is Karen. May I have your provider NPI?", type: "question" },
  { id: "CMM-0004", transactionId: "TXN-0005", timestamp: "2025-11-29 11:34:18", speaker: "AI", message: "NPI 1861345572 for Riverside Family Dentistry, tax ID 36-4520918.", type: "answer" },
  { id: "CMM-0005", transactionId: "TXN-0005", timestamp: "2025-11-29 11:35:47", speaker: "InsuranceRep", message: "Thank you. Which member are we verifying today?", type: "question" },
  { id: "CMM-0006", transactionId: "TXN-0005", timestamp: "2025-11-29 11:36:05", speaker: "AI", message: "Michael Anderson, subscriber ID 987654321, group GRP-45678, date of birth on file.", type: "answer" },
  { id: "CMM-0007", transactionId: "TXN-0005", timestamp: "2025-11-29 11:37:22", speaker: "InsuranceRep", message: "One moment while I pull that up.", type: "hold" },
  { id: "CMM-0008", transactionId: "TXN-0005", timestamp: "2025-11-29 11:39:10", speaker: "InsuranceRep", message: "Coverage is active. Major services are covered at 50%, the 12 month waiting period was satisfied in March 2025.", type: "answer" },
  { id: "CMM-0009", transactionId: "TXN-0005", timestamp: "2025-11-29 11:40:02", speaker: "AI", message: "Confirming: major at 50%, waiting period satisfied 03/2025, annual maximum $2,500 with $1,850 used. Is that correct?", type: "confirmation" },
  { id: "CMM-0010", transactionId: "TXN-0005", timestamp: "2025-11-29 11:41:15", speaker: "InsuranceRep", message: "That is correct. Reference number for this call is DD-2025-889231.", type: "confirmation" },
  { id: "CMM-0011", transactionId: "TXN-0005", timestamp: "2025-11-29 11:42:31", speaker: "System", message: "Call ended. Reference DD-2025-889231 stored with the transaction.", type: "note" },
  { id: "CMM-0012", transactionId: "TXN-0002", timestamp: "2025-11-28 09:30:20", speaker: "System", message: "270 eligibility request submitted to Blue Cross Blue Shield.", type: "note" },
  { id: "CMM-0013", transactionId: "TXN-0002", timestamp: "2025-11-28 09:31:25", speaker: "System", message: "271 response received: active coverage, 38 benefit segments parsed.", type: "note" },
];

const transactionDataVerified: Row[] = [
  { id: "TDV-0001", transactionId: "TXN-0002", item: "Policy status: Active" },
  { id: "TDV-0002", transactionId: "TXN-0002", item: "Annual maximum: $2,000" },
  { id: "TDV-0003", transactionId: "TXN-0002", item: "Annual used: $1,470" },
  { id: "TDV-0004", transactionId: "TXN-0002", item: "Deductible: $1,500 (met $450)" },
  { id: "TDV-0005", transactionId: "TXN-0002", item: "Preventive coverage: 100%" },
  { id: "TDV-0006", transactionId: "TXN-0002", item: "Basic coverage: 80%" },
  { id: "TDV-0007", transactionId: "TXN-0002", item: "Major coverage: 50%" },
  { id: "TDV-0008", transactionId: "TXN-0005", item: "Major coverage: 50%" },
  { id: "TDV-0009", transactionId: "TXN-0005", item: "Major waiting period satisfied: 03/2025" },
  { id: "TDV-0010", transactionId: "TXN-0005", item: "Call reference: DD-2025-889231" },
  { id: "TDV-0011", transactionId: "TXN-0006", item: "Subscriber ID matched insurance card" },
  { id: "TDV-0012", transactionId: "TXN-0006", item: "Group number matched insurance card" },
];

/* ------------------------------------------------------------------ */
/* Coverage-by-code verification grid                                  */
/* ------------------------------------------------------------------ */

type CoverageSeed = [saiCode: string, refInsCode: string, category: string, fieldName: string, preStepValue: string, verified: boolean, verifiedBy: string | null];

const coverageSeeds: CoverageSeed[] = [
  ["SAI-PLAN-001", "D0000", "Plan", "Policy Status", "Active", true, "API"],
  ["SAI-PLAN-002", "D0000", "Plan", "Annual Maximum", "$2,000", true, "API"],
  ["SAI-PLAN-003", "D0000", "Plan", "Annual Used", "$1,470", true, "API"],
  ["SAI-PLAN-004", "D0000", "Plan", "Individual Deductible", "$1,500", true, "API"],
  ["SAI-PLAN-005", "D0000", "Plan", "Deductible Met", "$450", true, "API"],
  ["SAI-PREV-001", "D0120", "Preventive", "Periodic Oral Evaluation", "100%", true, "API"],
  ["SAI-PREV-002", "D1110", "Preventive", "Prophylaxis - Adult", "100%", true, "API"],
  ["SAI-PREV-003", "D0274", "Preventive", "Bitewings - Four Films", "100% / every 6 months", true, "Call Center"],
  ["SAI-BASIC-001", "D2391", "Basic", "Resin Composite - One Surface", "80%", true, "API"],
  ["SAI-BASIC-002", "D7140", "Basic", "Extraction - Erupted Tooth", "80%", false, null],
  ["SAI-MAJOR-001", "D2740", "Major", "Crown - Porcelain/Ceramic", "50%", true, "Call Center"],
  ["SAI-MAJOR-002", "D3310", "Major", "Root Canal - Anterior", "50%", false, null],
  ["SAI-MAJOR-003", "D6010", "Major", "Implant Body - Endosteal", "Not covered", true, "Call Center"],
  ["SAI-ORTHO-001", "D8080", "Orthodontic", "Comprehensive Ortho - Adolescent", "50% up to $1,500 lifetime", false, null],
];

const coverageByCode: Row[] = coverageSeeds.map(([saiCode, refInsCode, category, fieldName, preStepValue, verified, verifiedBy], index) => ({
  id: `CBC-${pad(index + 1, 4)}`,
  patientId: "P0000001",
  userId: "USR-0002",
  saiCode,
  refInsCode,
  category,
  fieldName,
  preStepValue,
  verified,
  verifiedBy,
  comments: verified ? null : "Pending call center confirmation",
  timestamp: "2025-11-28T09:31:25.000Z",
  coverageData: JSON.stringify({ saiCode, refInsCode, category, fieldName, preStepValue, verified, verifiedBy }),
}));

/* ------------------------------------------------------------------ */
/* PMS interface hand-off tables                                       */
/* ------------------------------------------------------------------ */

const ifCallTransactionList: Row[] = [
  {
    id: "IFT-0001",
    transactionId: "TXN-0007",
    requestId: "REQ-2025-12-02-1400",
    patientId: "P0000003",
    patientName: "Emily Martinez",
    insuranceProvider: "Cigna Dental",
    policyNumber: "POL-5567123",
    groupNumber: "GRP-11223",
    subscriberId: "456789123",
    phoneNumber: "(800) 555-0181",
    startTime: "2025-12-02 14:00:00",
    endTime: null,
    duration: null,
    status: "Waiting",
    insuranceRep: null,
    transcript: null,
    createdAt: "2025-12-02T14:00:00.000Z",
  },
  {
    id: "IFT-0002",
    transactionId: "TXN-0005",
    requestId: "REQ-2025-11-29-1130",
    patientId: "P0000002",
    patientName: "Michael Anderson",
    insuranceProvider: "Delta Dental",
    policyNumber: "POL-3390881",
    groupNumber: "GRP-45678",
    subscriberId: "987654321",
    phoneNumber: "(800) 555-0193",
    startTime: "2025-11-29 11:30:00",
    endTime: "2025-11-29 11:42:31",
    duration: "12m 31s",
    status: "SUCCESS",
    insuranceRep: "Karen M.",
    transcript: "AI agent reached Delta Dental representative Karen M. and confirmed major services coverage and waiting period status.",
    createdAt: "2025-11-29T11:42:31.000Z",
  },
];

const ifCallCoverageCodeList: Row[] = [
  ["SAI-PLAN-001", "D0000", "Plan", "Policy Status", "Active", true, "API"],
  ["SAI-MAJOR-001", "D2740", "Major", "Crown - Porcelain/Ceramic", "50%", true, "Call Center"],
  ["SAI-MAJOR-002", "D3310", "Major", "Root Canal - Anterior", "50%", false, null],
  ["SAI-ORTHO-001", "D8080", "Orthodontic", "Comprehensive Ortho - Adolescent", "50% up to $1,500 lifetime", false, null],
].map((seed, index) => {
  const [saiCode, refInsCode, category, fieldName, preStepValue, verified, verifiedBy] = seed as CoverageSeed;
  return {
    id: `IFC-${pad(index + 1, 4)}`,
    ifCallTransactionId: "IFT-0001",
    saiCode,
    refInsCode,
    category,
    fieldName,
    preStepValue,
    verified,
    verifiedBy,
    coverageData: JSON.stringify({ saiCode, refInsCode, category, fieldName, preStepValue }),
    createdAt: "2025-12-02T14:00:00.000Z",
  };
});

const ifCallMessageList: Row[] = callCommunications
  .filter((message) => message.transactionId === "TXN-0005")
  .map((message, index) => ({
    id: `IFM-${pad(index + 1, 4)}`,
    ifCallTransactionId: "IFT-0002",
    timestamp: message.timestamp,
    speaker: message.speaker,
    message: message.message,
    type: message.type,
    createdAt: "2025-11-29T11:42:31.000Z",
  }));

/* ------------------------------------------------------------------ */

write("accounts", accounts);
write("providers", providers);
write("payers", payers);
write("users", users);
write("user_sso_identities", userSsoIdentities);
write("patients", patients);
write("patient_telecoms", patientTelecoms);
write("patient_addresses", patientAddresses);
write("insurances", insurances);
write("appointments", appointments);
write("treatments", treatments);
write("coverage_details", coverageDetails);
write("procedures", procedures);
write("verification_statuses", verificationStatuses);
write("ai_call_history", aiCallHistory);
write("transactions", transactions);
write("call_communications", callCommunications);
write("transaction_data_verified", transactionDataVerified);
write("coverage_by_code", coverageByCode);
write("if_call_transaction_list", ifCallTransactionList);
write("if_call_coverage_code_list", ifCallCoverageCodeList);
write("if_call_message_list", ifCallMessageList);

console.log(`\nMockup database written to ${OUT_DIR}`);
