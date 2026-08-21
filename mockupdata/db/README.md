# Mockup database

The backend no longer talks to PostgreSQL. It loads these JSON files into an
in-memory database at startup and serves them through the same query API the
routes always used, so every `/api/*` endpoint behaves as if a real database
were behind it.

- Engine: `backend/mock-db.ts` (query builder + seeding)
- Handle used by the app: `backend/db.ts` → `db`, `eq`, `inArray`, …
- Generator: `npx tsx script/db/build-mockupdata.ts`

## Files

One file per physical table in `shared/schema.ts`; each holds a plain array of
rows. Column names may be written in either JS (`stediMode`) or SQL
(`stedi_mode`) form, and omitted columns fall back to the schema default.

| File | Rows | Notes |
| --- | --- | --- |
| `accounts.json` | 3 | Clinic accounts — the tenant users sign in under |
| `account_payment_methods.json` | 3 | Payment setup per clinic — brand / last 4 only |
| `account_payments.json` | 17 | Invoice history billed to the clinics |
| `providers.json` | 3 | Dental practices (NPI, tax id), one per account |
| `payers.json` | 15 | Insurance payers with payer ids |
| `users.json` | 3 | Logins — system admin (no clinic), manager and dental on `ACC-0001` |
| `user_sso_identities.json` | 1 | Google / Microsoft Teams accounts a manager linked to a login |
| `patients.json` | 10 | `P0000001`–`P0000010`, owned by the dental users |
| `patient_telecoms.json` | 19 | Phone / email per patient |
| `patient_addresses.json` | 10 | Mailing addresses |
| `insurances.json` | 10 | Policies linked to a payer id |
| `appointments.json` | 22 | Scheduled / completed visits |
| `treatments.json` | 22 | Treatment history |
| `coverage_details.json` | 10 | Annual maximum, deductible |
| `procedures.json` | 31 | CDT procedures per coverage record |
| `verification_statuses.json` | 10 | Six-step verification pipeline state |
| `ai_call_history.json` | 7 | AI verification call summaries |
| `transactions.json` | 8 | FETCH / API / CALL / FAX / SAVE runs, mixed statuses |
| `call_communications.json` | 13 | Turn-by-turn call transcripts |
| `transaction_data_verified.json` | 12 | Items confirmed by a transaction |
| `coverage_by_code.json` | 14 | Coverage-by-code verification grid |
| `if_call_transaction_list.json` | 2 | PMS interface hand-off |
| `if_call_coverage_code_list.json` | 4 | PMS interface hand-off |
| `if_call_message_list.json` | 11 | PMS interface hand-off |

## Sample logins

Passwords are stored here in plaintext for convenience; the loader bcrypt-hashes
them on the way in, so `/api/auth/login` still compares hashes.

One login per role: the system administrator, plus a manager and a dental user
at the first clinic account.

| Email | Password | Role | Clinic | Patients |
| --- | --- | --- | --- | --- |
| `admin01@inspline.com` | `Admin@123` | admin (system) | — | — |
| `manager01@inspline.com` | `Manager@123` | manager | Bright Smile Dental Group (`ACC-0001`) | — |
| `dental01@inspline.com` | `Dental@123` | dental | Bright Smile Dental Group (`ACC-0001`) | all 10 (P0000001–P0000010) |

Only `admin` may sign in through the admin entry point, and it is the only role
without an `accountId`; `manager` and `dental` land on the clinic workspace.
Patients belong to the dental users, so an admin's own `/api/patients` list is
empty — admins read any user's patients through
`/api/admin/users/:userId/patients`.

## HIPAA fields

`patients.birthDate`, `patients.ssn`, `insurances.groupNumber`,
`insurances.subscriberId` and the matching `if_call_transaction_list` columns are
written here in readable form and AES-256-GCM encrypted during seeding, exactly
as the create-patient route would have stored them. Reading them back through
`/api/patients` returns masked values, and `/api/patients/:id/decrypt` returns
the plaintext — same as before.

## Editing

Edit the JSON directly and restart the server; these files are the source of
truth. `script/db/build-mockupdata.ts` regenerates all of them from
`mockupdata/patients.json` plus the definitions inside the script, so
run it only when you want to rebuild the whole set.

Writes made through the API are in-memory and disappear on restart. Set
`MOCK_DB_PERSIST=true` to have changed tables flushed back to these files.
