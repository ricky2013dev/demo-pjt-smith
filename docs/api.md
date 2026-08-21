# Verification Workflow & API

The five verification steps, the endpoints that drive them, and who may call what.

[← Back to the README](../README.md)

---

## Verification Workflow

1. **Fetch PMS** — retrieve patient data from the Practice Management System.
2. **Document Analysis** — OCR scan of insurance cards and documents.
3. **API Verification** — automated eligibility checking via insurance APIs (Stedi/Availity).
4. **Call Center** — AI-powered phone verification with insurance providers.
5. **Save to PMS** — write verified information back to the PMS.

Each step is tracked in `verification_statuses`; detailed transactions are logged
in `transactions`.

### Transaction types

| Type | Meaning |
| --- | --- |
| `FETCH` | Retrieve data from PMS |
| `API` | Insurance eligibility API call |
| `CALL` | AI call center verification |
| `FAX` | Fax-based verification (legacy) |
| `SAVE` | Save verified data back to PMS |

---

## API

Swagger UI is served at `/docs` while the dev server is running — interactive
testing plus complete endpoint documentation.

### Key endpoints

**Authentication**

- `POST /api/auth/login` — user login
- `POST /api/auth/logout` — user logout
- `GET /api/auth/verify` — verify current session

**Account (clinic)**

- `GET /api/account` — the signed-in user's clinic account
- `PUT /api/account` — update clinic name, NPI, tax ID, contact details and address (manager role)
- `GET /api/account/users` — the users that belong to the account
- `GET /api/accounts` — every account (system admin only)

**Patients**

- `GET /api/patients` — list patients (own, or all for admins)
- `POST /api/patients` — create a patient
- `GET /api/patients/:id` — patient detail
- `DELETE /api/patients/:id` — delete (owner or admin only)
- `POST /api/patients/:id/decrypt` — decrypt a sensitive patient field
- `POST /api/patients/:id/insurance/:insuranceId/decrypt` — decrypt a sensitive insurance field

**Audit**

- `POST /api/audit/phi-view` — record a sensitive value revealed on screen without a server decrypt

**Admin (admin role required)**

- `GET /api/users` — list all users
- `POST /api/users` — create a user
- `GET /api/admin/users/:userId/patients` — all patients for a specific user
- `GET /api/admin/interface-tables` — interface table data

---

## Roles & Admin Panel

| Role | Belongs to a clinic | Access |
| --- | --- | --- |
| `admin` | no | InSpline system administrator. Users, system data and PMS interface history, from the admin portal only |
| `manager` | yes | Everything a dental user can do, plus editing the clinic's own account details |
| `dental` | yes | The clinic's patients and verification workflows |

The two portals are separate: `admin` signs in through the admin entry point and
is turned away from the B2B portal, and the clinic roles are turned away from the
admin portal.

**Clinic Settings** (`/b2b-agent/account`) — pinned at the foot of the side nav.
*Clinic Profile* holds the account record (editable by a manager, read-only for
dental) and *Team Members* lists the logins on it. Adding or removing users stays
with the system administrator.

**User Management** (`/admin/users`) — view all users, create users with assigned
roles, manage user data sources.

**Patient Management** (`/admin/patients`) — unified table of all patients across
all users, filter by user, full patient detail (ID, name, gender, contact,
insurance, status), admin delete of any patient.

**Interface Tables** (`/admin/interface-tables`) — call transaction interface
tables, coverage code data, call message logs.
