# HIPAA & Sensitive Data

How sensitive patient data is encrypted, masked and released — the controls, the
code patterns, and the compliance mapping.

[← Back to the README](../README.md)

---

Sensitive patient data is handled through encryption, masking and controlled
access. Every sensitive field is masked by default and requires an explicit user
action to reveal.

> **Note on the mockup database.** Every control below still applies when running
> on the in-memory mockup database: sensitive fields are AES-256-GCM encrypted
> while seeding, stored encrypted in memory, masked on read, and released only
> through the audited decrypt endpoints. The sample data is fabricated and
> contains no real PHI. With `MOCK_DB_PERSIST=true`, changed tables are written
> back to JSON with the sensitive fields still encrypted.

## Access control

Every patient data endpoint applies dual-layer validation:

1. **Authentication** — the user must be logged in (`requireAuth` middleware).
2. **Authorization** — the user must own the record **or** be an admin.

```typescript
// backend/routes.ts — owner or admin
if (patient.userId !== userId && userRole !== 'admin') {
  return res.status(403).json({ error: "Access denied" });
}
```

- **Admins** can view, modify and delete any patient record, and decrypt
  sensitive data for all patients (`userRole === 'admin'`).
- **Regular users** are limited to patients they created
  (`patient.userId === userId`), enforced at the API level.

## Sensitive fields

| Field | Encrypted | Mask |
| --- | --- | --- |
| Patient birth date | ✅ | `****-**-**` |
| Patient SSN | ✅ | `***-**-****` |
| Patient address | ✅ | `**** **** ******, ****, ** *****` |
| Patient phone | — | `(***) ***-****` |
| Patient email | — | `****@****.***` |
| Insurance policy number | ✅ | `************` |
| Insurance group number | ✅ | `********` |
| Insurance subscriber ID | ✅ | `**********` |

Encryption covers `patients.birthDate`, `patients.ssn`, all
`patient_addresses` columns (line1, line2, city, state, postal_code),
`insurances.policyNumber` / `groupNumber` / `subscriberId`, and the encrypted
copies of those insurance fields inside `if_call_transaction_list`.

When a CALL transaction is created with `Waiting` status, the system copies the
already-encrypted insurance fields into `if_call_transaction_list`, plus
`coverage_by_code` into `if_call_coverage_code_list` and `callCommunications`
into `if_call_message_list`. Interface tables keep their own encrypted copies so
external integrations stay isolated from the operational tables.

## Components

| Piece | Location | Role |
| --- | --- | --- |
| `SensitiveDataField` | `frontend/src/components/sensitive-data/SensitiveDataField.tsx` | Renders the mask, offers a **View** button, auto-hides after 10s |
| `InsuranceSensitiveDataField` | `frontend/src/components/sensitive-data/InsuranceSensitiveDataField.tsx` | Same, for insurance-scoped fields |
| Sensitive data service | `frontend/src/services/sensitiveDataService.ts` | `decryptSensitiveData`, `decryptInsuranceField`, `maskSensitiveData`, `isSensitiveField` |
| Decrypt endpoints | `backend/routes.ts` | `POST /api/patients/:id/decrypt`, `POST /api/patients/:id/insurance/:insuranceId/decrypt` |
| Crypto helpers | `backend/crypto.ts` | `encrypt` / `decrypt` (AES-256-GCM) |

## Displaying a sensitive field

```tsx
import { SensitiveDataField } from '@/components/sensitive-data';
import { maskSensitiveData } from '@/services/sensitiveDataService';

<SensitiveDataField
  patientId={patient.id}
  fieldName="birthDate"
  maskedValue={maskSensitiveData(patient.birthDate, 'date')}
  label="Date of Birth"
  isEncrypted={Boolean(patient.birthDate) || patient.birthDateEncrypted}
  fallbackValue={patient.birthDate}
/>
```

**Props**

| Prop | Meaning |
| --- | --- |
| `patientId` | Patient ID (required) |
| `insuranceId` | Insurance record ID (insurance fields only) |
| `fieldName` | Field to decrypt |
| `maskedValue` | Masked value shown by default |
| `label` | Field label, for accessibility |
| `isEncrypted` | Whether to offer the reveal control (default `false`) |
| `fallbackValue` | Plain value revealed when the decrypt endpoint has no record for the patient — the mockup dataset is served from JSON rather than the database. Ignored when the value is itself masked, so real data mode stays server-authoritative. |
| `autoHideDelay` | Milliseconds before auto-hiding (default `10000`) |

## Using the service directly

```typescript
import {
  decryptSensitiveData,
  decryptInsuranceField,
  maskSensitiveData,
} from '@/services/sensitiveDataService';

const ssn = await decryptSensitiveData(patientId, 'ssn');
const policyNumber = await decryptInsuranceField(patientId, insuranceId, 'policyNumber');

maskSensitiveData('555-123-4567', 'phone'); // '(***) ***-****'
maskSensitiveData('1990-01-15', 'date');    // '****-**-**'
```

## Server-side pattern

Encrypt on write, mask on read, decrypt only through the audited endpoint:

```typescript
import { encrypt, decrypt } from './crypto';

// Write
await storage.createPatient({
  ...patientData,
  ssn: ssn ? encrypt(ssn) : null,
  birthDate: birthDate ? encrypt(birthDate) : null,
});

// Read
res.json({
  patient: {
    ...patient,
    ssn: patient.ssn ? '***-**-****' : null,
    ssnEncrypted: !!patient.ssn,
    birthDate: patient.birthDate ? '****-**-**' : null,
    birthDateEncrypted: !!patient.birthDate,
  },
});
```

**On update, never re-encrypt a mask.** Compare against the mask first and keep
the existing ciphertext when it matches:

```typescript
await storage.updateInsurance(insuranceId, {
  groupNumber: insuranceData.groupNumber === '********'
    ? existingInsurance.groupNumber            // keep existing ciphertext
    : (insuranceData.groupNumber ? encrypt(insuranceData.groupNumber) : null),
});
```

## Adding a new sensitive field

1. Declare it in `shared/schema.ts` with an `// Encrypted - HIPAA sensitive` comment.
2. `encrypt()` it in the POST/PUT route before writing.
3. Mask it in every GET response and set the matching `<field>Encrypted` flag.
4. Add it to `allowedFields` and the `switch` in the decrypt endpoint.
5. Add it to `SENSITIVE_FIELD_TYPES` in `sensitiveDataService.ts`.
6. Render it through `SensitiveDataField` in the UI.

## Security features

- **Auto-hide** — revealed data hides after 10 seconds.
- **Authentication** — every decrypt request verifies login, patient access, and
  insurance-record access for insurance fields.
- **Audit trail** — every reveal is logged server-side, whether or not it
  needed the server. See [Audit trail](#audit-trail) below.
- **Encryption at rest** — AES-256-GCM with a 256-bit key. The seeder encrypts
  these fields as the JSON loads, so what the routes read is always ciphertext.
- **Encryption in transit** — HTTPS for all API requests.
- **Isolated interface tables** — encrypted copies for external integration, with
  an audit trail of data transfers.

## Audit trail

Every time a masked value is unmasked on screen, a line lands in
`logs/audit/audit-<date>.log` (override the directory with `AUDIT_LOG_DIR`).
Entries are JSON, one per line, daily-rotated, and carry the user, session, IP,
user agent, patient, and field — never the value itself.

| Reveal | Logged by | Event |
| --- | --- | --- |
| Patient field (`birthDate`, `ssn`, `phone`, `email`, `address`) | `POST /api/patients/:id/decrypt` | `PHI_DECRYPT` |
| Insurance field (`groupNumber`, `subscriberId`) | `POST /api/patients/:id/insurance/:insuranceId/decrypt` | `PHI_DECRYPT`, with `details.insuranceId` |
| A value the client already held and unmasked itself | `POST /api/audit/phi-view` | `PHI_ACCESS` with `action: "reveal"` and `details.source` |
| A decrypt refused by the ownership check | the decrypt endpoints | `SECURITY_VIOLATION` |

The third row is what keeps the trail complete. `SensitiveDataField` unmasks
without a round trip in two cases — a mockup patient falling back to its local
value, and a `localOnly` field that has no database column at all — and reports
the reveal so a human reading PHI always leaves a record. The report never
blocks or fails the reveal; a failed report goes to the browser console.

```jsonc
// PHI read without a server decrypt
{"timestamp":"…","eventType":"PHI_ACCESS","patientId":"1001","field":"subscriberSsn",
 "action":"reveal","details":{"source":"local"},"userEmail":"dental01@inspline.com",
 "sessionId":"…","ipAddress":"127.0.0.1","success":true}
```

## Practices to follow

1. Mask by default; never send unencrypted sensitive data in an API response.
2. Render sensitive fields through `SensitiveDataField` for consistent UX.
3. Decrypt only on explicit user action, and only for display.
4. Encrypt at the earliest point (form submission / API input).
5. Verify permissions before decrypting; log every access.
6. Check for masked values on update so a mask never gets re-encrypted.
7. Keep exposure short — rely on auto-hide.

## Compliance mapping (HIPAA Security Rule)

| Safeguard | Implementation |
| --- | --- |
| Administrative — access control | Authentication and authorization on every decrypt operation |
| Physical — workstation security | Auto-hide prevents unauthorized viewing; encryption limits exposure on stolen devices |
| Technical — access control | Role-based authentication and session management |
| Technical — audit controls | Server-side logging of all data access, decryption and on-screen reveals |
| Technical — integrity | Encryption prevents unauthorized modification |
| Technical — transmission security | HTTPS for all communications |
| Technical — automatic logoff | Auto-hide timeout on revealed data |

**Encryption standards** — AES-256-GCM; keys held in environment variables,
separate from the encrypted data. Key rotation should be part of regular security
maintenance.

## Data flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interface (Client)                     │
│  SensitiveDataField                                             │
│   • Displays masked value by default                            │
│   • "View" button triggers decryption                           │
│   • Auto-hides after 10 seconds                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  sensitiveDataService                           │
│   • decryptSensitiveData(patientId, field)                      │
│   • decryptInsuranceField(patientId, insuranceId, field)        │
│   • maskSensitiveData(value, type)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                        │
│  POST /api/patients/:id/decrypt                                 │
│  POST /api/patients/:id/insurance/:insuranceId/decrypt          │
│   • Verify authentication                                       │
│   • Verify ownership (or admin)                                 │
│   • Decrypt field                                               │
│   • Log access (audit)                                          │
│   • Return decrypted value                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          Database (in-memory mockup, seeded from JSON)          │
│  patients            → birth_date, ssn                encrypted │
│  patient_addresses   → line1, line2, city, state, zip encrypted │
│  insurances          → policy_number, group_number,             │
│                        subscriber_id                  encrypted │
│  if_call_transaction_list → encrypted copies of the above       │
└─────────────────────────────────────────────────────────────────┘
```

## Planned enhancements

- Audit logging dashboard
- Data retention policies
- Encryption key rotation
- Batch decrypt for administrative users
- Data masking for reports and exports
- Session timeout policies
- Data breach notification
