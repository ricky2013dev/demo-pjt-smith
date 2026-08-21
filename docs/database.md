# Database

How the mockup data store works, and what lives in it.

[← Back to the README](../README.md)

---

## Mockup Database

The backend runs on an **in-memory mockup database** seeded from JSON at startup.
No database server is required and there is nothing to provision.

| Piece | Location |
| --- | --- |
| Seed data (one JSON file per table) | `mockupdata/db/` |
| Query engine | `backend/mock-db.ts` |
| Handle used by the app (`db`, `eq`, `inArray`, …) | `backend/db.ts` |
| Data generator | `script/db/build-mockupdata.ts` |
| Table definitions | `shared/schema.ts` |

`shared/schema.ts` is the single source of truth for table names, column names,
types and defaults. **It is not leftover database code** — `backend/mock-db.ts`
imports it at runtime and reflects over it to build the in-memory tables, so
deleting it would leave the mockup database with nothing to load.

### Editing the data

Edit any file in `mockupdata/db/` and restart the server; those files are the
source of truth. Rows may use either JS (`stediMode`) or SQL (`stedi_mode`)
column names, and omitted columns fall back to the schema default.

Writes made through the API are in-memory and reset on restart — set
`MOCK_DB_PERSIST=true` to flush changed tables back to their JSON file.

To rebuild the entire set from scratch:

```bash
npx tsx script/db/build-mockupdata.ts
```

### Sample data

239 rows across 21 tables: 3 clinic accounts, 3 practices, 15 payers, 3 users, 10 patients with
contacts, addresses, policies, appointments, treatments, coverage and procedures,
plus 8 verification transactions with call transcripts and the three PMS
interface tables.

HIPAA-sensitive fields (`patients.birthDate`, `patients.ssn`,
`insurances.groupNumber`, `insurances.subscriberId`) are written readable in the
JSON and AES-256-GCM encrypted during seeding, exactly as the create-patient
route would have stored them.

See [`mockupdata/db/README.md`](../mockupdata/db/README.md) for the per-table
breakdown.

### Interface tables

The AI system uses **3 interface tables** for verification workflows:

| Table | Purpose |
| --- | --- |
| `if_call_transaction_list` | AI call center transactions |
| `if_call_coverage_code_list` | Procedure codes and coverage verification data |
| `if_call_message_list` | Communication logs from AI–insurance rep conversations |

Sign in as an admin and go to `/admin/interface-tables` to view and manage them.

---

## Data Model

### Core tables

| Table | Purpose | Key fields |
| --- | --- | --- |
| **accounts** | Clinic a set of users signs in under, maintained from Account Management | id, name, legalName, npiNumber, taxId, phoneNumber, faxNumber, email, website, addressLine1, addressLine2, city, state, zipCode, timezone, status |
| **users** | Authentication and user management | id, email, username, password (bcrypt), role (`admin` = system, `manager`/`dental` = clinic), stediMode, accountId, providerId |
| **patients** | Patient demographics | id, userId, active, givenName, familyName, gender, birthDate *(encrypted)*, ssn *(encrypted)* |
| **patient_telecoms** | Phone / email | id, patientId, system, value |
| **patient_addresses** | Address | id, patientId, line1, line2, city, state, postalCode |
| **insurances** | Policy information | id, patientId, provider, payerId, employerName, groupNumber, subscriberName, subscriberId, relationship, effectiveDate, expirationDate, deductible, deductibleMet, maxBenefit, preventiveCoverage, basicCoverage, majorCoverage |
| **appointments** | Scheduling | id, patientId, date, time, type, status (scheduled/completed/cancelled), provider |
| **treatments** | Treatment history | id, patientId, name, date, cost |
| **coverage_details** | Coverage financials | id, patientId, annualMaximum, annualUsed, deductible, deductibleMet |
| **procedures** | Procedure coverage | id, coverageId, code, name, category (Preventive/Basic/Major/Orthodontic), coverage, estimatedCost, patientPays |
| **verification_statuses** | Workflow status | id, patientId, fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS — each `completed` / `in_progress` / `pending` |
| **transactions** | Verification transactions | id, requestId, patientId, type, method, startTime, endTime, duration, status, patientName, insuranceProvider, insuranceRep, runBy, verificationScore, fetchStatus, saveStatus, responseCode, endpoint, phoneNumber, errorMessage, eligibilityCheck, benefitsVerification, coverageDetails, deductibleInfo, transcript, rawResponse |
| **call_communications** | Call conversation detail | id, transactionId, timestamp, speaker (AI/InsuranceRep/System), message, type (question/answer/confirmation/hold/transfer/note) |
| **transaction_data_verified** | Items verified per transaction | id, transactionId, item |
| **ai_call_history** | AI call interaction history | id, patientId, topic, date, time, summary, duration, agent, status |
| **coverage_by_code** | Coverage verification by procedure code | id, patientId, userId, saiCode, refInsCode, category, fieldName, preStepValue, verified, verifiedBy, comments, timestamp, coverageData (JSON) |

### Relations

- **accounts** → one-to-many with users and providers. An account is the clinic;
  every `manager` and `dental` user signs in under exactly one, and `/api/account`
  reads and writes it. The system `admin` has no account.
- **users** → many-to-one with accounts and providers; one-to-many with patients
  and coverage_by_code.
- **patients** → one-to-many with telecoms, addresses, insurances, appointments,
  treatments, coverage_details, verification_statuses, ai_call_history,
  transactions and coverage_by_code.
- **coverage_details** → one-to-many with procedures.
- **transactions** → one-to-many with call_communications and transaction_data_verified.
