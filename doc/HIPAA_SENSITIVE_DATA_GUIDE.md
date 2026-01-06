# HIPAA-Compliant Sensitive Data Handling Guide

## Overview

This application implements HIPAA-compliant handling of sensitive patient data through encryption, masking, and controlled access. All sensitive fields are automatically masked by default and require explicit user action to reveal.

## Access Control & Authorization

### Role-Based Access Control (RBAC)
The system implements role-based access control to ensure proper data access:

- **Admin Users**: Full access to all patient data across all users
  - Can view, modify, and delete any patient record
  - Can access sensitive data decryption for all patients
  - Requires admin role verification via session (`userRole === 'admin'`)

- **Regular Users**: Limited to own patient data
  - Can only view and modify patients they created (`patient.userId === userId`)
  - Can only decrypt sensitive data for their own patients
  - Ownership validation enforced at API level

### Patient Data Access Validation

All patient data endpoints implement dual-layer validation:
1. **Authentication**: User must be logged in (`requireAuth` middleware)
2. **Authorization**: User must be either:
   - The owner of the patient record, OR
   - An admin user

Example implementation (`backend/routes.ts:1816`):
```typescript
// Check if user has permission (owner or admin)
if (patient.userId !== userId && userRole !== 'admin') {
  return res.status(403).json({ error: "Access denied" });
}
```

## Architecture

### Components

1. **SensitiveDataField Component** (`/client/src/components/SensitiveDataField.tsx`)
   - Displays masked sensitive data by default
   - Provides a "View" button to temporarily reveal decrypted data
   - Auto-hides revealed data after 10 seconds for security
   - Supports customizable auto-hide delay

2. **Sensitive Data Service** (`/client/src/services/sensitiveDataService.ts`)
   - Centralized service for decryption operations
   - Utility functions for masking data
   - Field type validation
   - Common interface for all sensitive data operations

3. **Server Decrypt Endpoints** (`/server/routes.ts`)
   - POST `/api/patients/:id/decrypt` - Patient sensitive fields
   - POST `/api/patients/:id/insurance/:insuranceId/decrypt` - Insurance sensitive fields
   - Validates user permissions
   - Returns decrypted values only to authorized users

## HIPAA-Sensitive Fields

The following fields are encrypted and considered sensitive under HIPAA:

### Patient Fields
- **Birth Date** - ✅ **Encrypted**, masked as `****-**-**`
- **Phone Numbers** - Not encrypted, masked as `(***) ***-****`
- **Email Addresses** - Not encrypted, masked as `****@****.***`
- **SSN** - ✅ **Encrypted**, masked as `***-**-****`
- **Address** - ✅ **Encrypted**, masked as `**** **** ******, ****, ** *****`

### Insurance Fields
- **Policy Number** - ✅ **Encrypted**, masked as `************`
- **Group Number** - ✅ **Encrypted**, masked as `********`
- **Subscriber ID** - ✅ **Encrypted**, masked as `**********`

### Interface Table Fields
When CALL transactions are created, sensitive data is copied to interface tables:
- **if_call_transaction_list** - Contains encrypted insurance data (policyNumber, groupNumber, subscriberId)
- **if_call_coverage_code_list** - Contains coverage code snapshots
- **if_call_message_list** - Contains call communication records

## Implemented Encryption Flow

### SSN Field Implementation

**Database Schema** (`shared/schema.ts:36`)
```typescript
export const patients = pgTable("patients", {
  // ... other fields
  ssn: text("ssn"), // Encrypted - HIPAA sensitive
});
```

**Encryption on Creation** (`backend/routes.ts:798`)
```typescript
const encryptedSSN = patient.ssn ? encrypt(patient.ssn) : null;
await storage.createPatient({
  ...patient,
  ssn: encryptedSSN
});
```

**Masking in API Response** (`backend/routes.ts:652-653`)
```typescript
ssn: patient.ssn ? '***-**-****' : null, // Masked (HIPAA)
ssnEncrypted: !!patient.ssn,
```

**Decryption Endpoint** (`backend/routes.ts:1496-1501`)
```typescript
case 'ssn':
  if (patient.ssn) {
    decryptedValue = decrypt(patient.ssn);
  }
  break;
```

### Insurance Fields Implementation

**Database Schema** (`shared/schema.ts:65-68`)
```typescript
export const insurances = pgTable("insurances", {
  // ... other fields
  policyNumber: text("policy_number"), // Encrypted - HIPAA sensitive
  groupNumber: text("group_number"), // Encrypted - HIPAA sensitive
  subscriberId: text("subscriber_id"), // Encrypted - HIPAA sensitive
});
```

**Encryption on Creation** (`backend/routes.ts:848-851`)
```typescript
policyNumber: i.policyNumber ? encrypt(i.policyNumber) : null,
groupNumber: i.groupNumber ? encrypt(i.groupNumber) : null,
subscriberId: i.subscriberId ? encrypt(i.subscriberId) : null,
```

**Masking in API Response** (`backend/routes.ts:621-627`)
```typescript
policyNumber: ins.policyNumber ? '************' : null, // Masked (HIPAA)
policyNumberEncrypted: !!ins.policyNumber,
groupNumber: ins.groupNumber ? '********' : null, // Masked (HIPAA)
groupNumberEncrypted: !!ins.groupNumber,
subscriberId: ins.subscriberId ? '**********' : null, // Masked (HIPAA)
subscriberIdEncrypted: !!ins.subscriberId,
```

**Decryption Endpoint** (`backend/routes.ts:1569-1586`)
```typescript
// POST /api/patients/:id/insurance/:insuranceId/decrypt
const allowedFields = ['policyNumber', 'groupNumber', 'subscriberId'];

switch (field) {
  case 'policyNumber':
    if (insurance.policyNumber) {
      decryptedValue = decrypt(insurance.policyNumber);
    }
    break;
  case 'groupNumber':
    if (insurance.groupNumber) {
      decryptedValue = decrypt(insurance.groupNumber);
    }
    break;
  case 'subscriberId':
    if (insurance.subscriberId) {
      decryptedValue = decrypt(insurance.subscriberId);
    }
    break;
}
```

### Interface Table Integration

When an API transaction succeeds and creates a CALL transaction with 'Waiting' status, the system automatically:

**1. Populates if_call_transaction_list** (`backend/routes.ts:2209-2225`)
```typescript
const [ifCallTxn] = await db.insert(ifCallTransactionList).values({
  transactionId: newCallTransaction.id,
  requestId: newCallTransaction.requestId,
  patientId: newCallTransaction.patientId,
  patientName: newCallTransaction.patientName,
  insuranceProvider: newCallTransaction.insuranceProvider,
  policyNumber: primaryInsurance?.policyNumber || null, // Already encrypted
  groupNumber: primaryInsurance?.groupNumber || null, // Already encrypted
  subscriberId: primaryInsurance?.subscriberId || null, // Already encrypted
  // ... other fields
}).returning();
```

**2. Copies coverage_by_code** to if_call_coverage_code_list

**3. Copies callCommunications** to if_call_message_list

## Usage Guide

### 1. Using SensitiveDataField Component

**For Patient Fields:**
```typescript
import SensitiveDataField from '@/components/SensitiveDataField';

// SSN Field
<SensitiveDataField
  patientId={patient.id}
  fieldName="ssn"
  maskedValue="***-**-****"
  label="SSN"
  isEncrypted={patient.ssnEncrypted}
  autoHideDelay={10000}
/>

// Birth Date
<SensitiveDataField
  patientId={patient.id}
  fieldName="birthDate"
  maskedValue="****-**-**"
  label="Date of Birth"
  isEncrypted={patient.birthDateEncrypted}
/>

// Address
<SensitiveDataField
  patientId={patient.id}
  fieldName="address"
  maskedValue="**** **** ******, ****, ** *****"
  label="Address"
  isEncrypted={(patient.address && patient.address.length > 0) || false}
/>
```

**For Insurance Fields:**
```typescript
// Policy Number
<SensitiveDataField
  patientId={patient.id}
  insuranceId={insurance.id}
  fieldName="policyNumber"
  maskedValue="************"
  label="Policy Number"
  isEncrypted={insurance.policyNumberEncrypted}
/>

// Group Number
<SensitiveDataField
  patientId={patient.id}
  insuranceId={insurance.id}
  fieldName="groupNumber"
  maskedValue="********"
  label="Group Number"
  isEncrypted={insurance.groupNumberEncrypted}
/>

// Subscriber ID
<SensitiveDataField
  patientId={patient.id}
  insuranceId={insurance.id}
  fieldName="subscriberId"
  maskedValue="**********"
  label="Subscriber ID"
  isEncrypted={insurance.subscriberIdEncrypted}
/>
```

**Props:**
- `patientId`: The patient's ID (required)
- `insuranceId`: The insurance record ID (required for insurance fields)
- `fieldName`: The field name to decrypt
- `maskedValue`: The masked value to display
- `label`: The field label for accessibility
- `isEncrypted`: Whether the field is encrypted (default: false)
- `autoHideDelay`: Time in ms before auto-hiding revealed data (default: 10000)

### 2. Using Sensitive Data Service

```typescript
import {
  decryptPatientField,
  decryptInsuranceField,
  maskSensitiveData,
  isSensitiveField,
  SENSITIVE_FIELD_TYPES
} from '@/services/sensitiveDataService';

// Decrypt patient field
try {
  const ssn = await decryptPatientField(patientId, 'ssn');
  console.log('Decrypted SSN:', ssn);
} catch (error) {
  console.error('Failed to decrypt:', error);
}

// Decrypt insurance field
try {
  const policyNumber = await decryptInsuranceField(patientId, insuranceId, 'policyNumber');
  console.log('Decrypted Policy:', policyNumber);
} catch (error) {
  console.error('Failed to decrypt:', error);
}

// Mask a value
const masked = maskSensitiveData('555-123-4567', 'phone');
// Returns: '(***) ***-****'
```

### 3. Server-Side Encryption

**For Patient Data:**
```typescript
import { encrypt, decrypt } from './crypto';

// Encrypt before saving
const encryptedSSN = ssn ? encrypt(ssn) : null;
const encryptedBirthDate = birthDate ? encrypt(birthDate) : null;

await storage.createPatient({
  ...patientData,
  ssn: encryptedSSN,
  birthDate: encryptedBirthDate
});

// Mask in API response
res.json({
  patient: {
    ...patient,
    ssn: patient.ssn ? '***-**-****' : null,
    ssnEncrypted: !!patient.ssn,
    birthDate: patient.birthDate ? '****-**-**' : null,
    birthDateEncrypted: !!patient.birthDate
  }
});
```

**For Insurance Data:**
```typescript
import { encrypt } from './crypto';

// Encrypt before saving
await storage.createInsurance({
  patientId: patient.id,
  type: 'Primary',
  provider: insurance.provider,
  policyNumber: insurance.policyNumber ? encrypt(insurance.policyNumber) : null,
  groupNumber: insurance.groupNumber ? encrypt(insurance.groupNumber) : null,
  subscriberId: insurance.subscriberId ? encrypt(insurance.subscriberId) : null,
  // ... other fields
});

// Mask in API response
res.json({
  insurance: {
    ...insurance,
    policyNumber: insurance.policyNumber ? '************' : null,
    policyNumberEncrypted: !!insurance.policyNumber,
    groupNumber: insurance.groupNumber ? '********' : null,
    groupNumberEncrypted: !!insurance.groupNumber,
    subscriberId: insurance.subscriberId ? '**********' : null,
    subscriberIdEncrypted: !!insurance.subscriberId
  }
});
```

**Handling Masked Values on Update:**
```typescript
// Check if value is masked before re-encrypting
await storage.updateInsurance(insuranceId, {
  policyNumber: insuranceData.policyNumber === '************'
    ? existingInsurance.policyNumber // Keep existing encrypted value
    : (insuranceData.policyNumber ? encrypt(insuranceData.policyNumber) : null),
  groupNumber: insuranceData.groupNumber === '********'
    ? existingInsurance.groupNumber // Keep existing encrypted value
    : (insuranceData.groupNumber ? encrypt(insuranceData.groupNumber) : null),
  subscriberId: insuranceData.subscriberId === '**********'
    ? existingInsurance.subscriberId // Keep existing encrypted value
    : (insuranceData.subscriberId ? encrypt(insuranceData.subscriberId) : null),
});
```

### 4. Adding New Sensitive Fields

To add a new sensitive field:

1. **Update the database schema**
   ```typescript
   // In shared/schema.ts
   export const tableName = pgTable("table_name", {
     // ... other fields
     newField: text("new_field"), // Encrypted - HIPAA sensitive
   });
   ```

2. **Add encryption on server**
   ```typescript
   // In routes.ts - POST endpoint
   const encryptedValue = value ? encrypt(value) : null;
   await storage.create({
     ...data,
     newField: encryptedValue
   });
   ```

3. **Add masking in GET endpoints**
   ```typescript
   // In routes.ts - GET endpoint
   res.json({
     record: {
       ...record,
       newField: record.newField ? '**********' : null,
       newFieldEncrypted: !!record.newField
     }
   });
   ```

4. **Update decrypt endpoint**
   ```typescript
   // In routes.ts - POST /api/.../decrypt
   const allowedFields = [...existingFields, 'newField'];

   case 'newField':
     if (record.newField) {
       decryptedValue = decrypt(record.newField);
     }
     break;
   ```

5. **Add to sensitive field types**
   ```typescript
   // In sensitiveDataService.ts
   export const SENSITIVE_FIELD_TYPES = {
     // ... existing types
     NEW_FIELD: 'newField',
   } as const;
   ```

6. **Use in UI**
   ```typescript
   <SensitiveDataField
     patientId={patient.id}
     fieldName="newField"
     maskedValue="**********"
     label="New Field"
     isEncrypted={record.newFieldEncrypted || false}
   />
   ```

## Security Features

### 1. Auto-Hide
Revealed sensitive data automatically hides after 10 seconds to prevent unauthorized viewing.

### 2. User Authentication
All decrypt requests require authentication. The server verifies:
- User is logged in
- User has access to the specific patient record
- User has access to the specific insurance record (for insurance fields)

### 3. Audit Trail
All decryption requests are logged server-side for HIPAA compliance auditing.

### 4. Encryption at Rest
Sensitive fields are encrypted in the database using AES-256-GCM encryption with a 256-bit key.

**Encrypted Fields:**
- Patient: birthDate, ssn, address (line1, line2, city, state, postalCode)
- Insurance: policyNumber, groupNumber, subscriberId
- Interface: policyNumber, groupNumber, subscriberId (in if_call_transaction_list)

### 5. Encryption in Transit
All API requests use HTTPS to prevent man-in-the-middle attacks.

### 6. Independent Interface Tables
Interface tables maintain encrypted copies of sensitive data for external system integration, ensuring:
- Data isolation from operational tables
- Consistent encryption across systems
- Audit trail of data transfers

## Best Practices

1. **Always mask by default**: Never send unencrypted sensitive data in API responses
2. **Use SensitiveDataField**: Always use the component for consistent UX
3. **Limit decrypt access**: Only decrypt when user explicitly requests
4. **Log all access**: Maintain audit logs for HIPAA compliance
5. **Minimize exposure time**: Use auto-hide feature to limit data visibility
6. **Validate permissions**: Always verify user has access before decrypting
7. **Use common service**: Use `sensitiveDataService` for all decrypt operations
8. **Check for masked values**: When updating, check if value is masked to avoid re-encrypting the mask
9. **Encrypt early**: Always encrypt at the earliest point (form submission/API input)
10. **Decrypt late**: Only decrypt when absolutely necessary and for display purposes only

## Testing

### Test Patient Field Decryption
```typescript
// In browser console or test file

// Test SSN decryption
const response = await fetch('/api/patients/P0000001/decrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ field: 'ssn' })
});
const data = await response.json();
console.log('Decrypted SSN:', data.value);

// Test Address decryption
const addressResponse = await fetch('/api/patients/P0000001/decrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ field: 'address' })
});
const addressData = await addressResponse.json();
console.log('Decrypted Address:', addressData.value);
```

### Test Insurance Field Decryption
```typescript
const response = await fetch('/api/patients/P0000001/insurance/ins-123/decrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ field: 'policyNumber' })
});
const data = await response.json();
console.log('Decrypted Policy:', data.value);
```

### Test Masking
```typescript
import { maskSensitiveData } from '@/services/sensitiveDataService';

console.log(maskSensitiveData('1990-01-15', 'date')); // ****-**-**
console.log(maskSensitiveData('555-123-4567', 'phone')); // (***) ***-****
console.log(maskSensitiveData('test@example.com', 'email')); // ****@****.***
console.log(maskSensitiveData('123-45-6789', 'ssn')); // ***-**-****
console.log(maskSensitiveData('POL123456', 'policyNumber')); // ************
```

## Compliance Notes

This implementation follows HIPAA Security Rule requirements:

### Administrative Safeguards
- **Access Control**: User authentication and authorization required for all decrypt operations
- **Workforce Training**: Documentation provides clear guidelines for handling sensitive data

### Physical Safeguards
- **Workstation Security**: Auto-hide feature prevents unauthorized viewing
- **Device Controls**: Encryption prevents data exposure on stolen devices

### Technical Safeguards
- **Access Control**: Role-based authentication and session management
- **Audit Controls**: Server-side logging of all data access and decryption requests
- **Integrity Controls**: Encryption prevents unauthorized modification
- **Transmission Security**: HTTPS for all communications
- **Automatic Logoff**: Auto-hide feature provides timeout for sensitive data viewing

### Encryption Standards
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode)
- **Key Management**: Environment variable storage, separate from encrypted data
- **Key Rotation**: Should be implemented as part of regular security maintenance

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interface (Client)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SensitiveDataField Component                             │  │
│  │  • Displays masked value by default                      │  │
│  │  • "View" button triggers decryption                     │  │
│  │  • Auto-hides after 10 seconds                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Sensitive Data Service                         │
│  • decryptPatientField(patientId, field)                       │
│  • decryptInsuranceField(patientId, insuranceId, field)        │
│  • maskSensitiveData(value, type)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Server)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /api/patients/:id/decrypt                           │  │
│  │  • Verify authentication                                 │  │
│  │  • Verify ownership                                      │  │
│  │  • Decrypt field                                         │  │
│  │  • Log access (audit)                                    │  │
│  │  • Return decrypted value                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /api/patients/:id/insurance/:insuranceId/decrypt    │  │
│  │  • Verify authentication                                 │  │
│  │  • Verify ownership                                      │  │
│  │  • Decrypt insurance field                               │  │
│  │  • Log access (audit)                                    │  │
│  │  • Return decrypted value                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ patients table                                           │  │
│  │  • birth_date: encrypted                                 │  │
│  │  • ssn: encrypted                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ patient_addresses table                                  │  │
│  │  • line1: encrypted                                      │  │
│  │  • line2: encrypted                                      │  │
│  │  • city: encrypted                                       │  │
│  │  • state: encrypted                                      │  │
│  │  • postal_code: encrypted                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ insurances table                                         │  │
│  │  • policy_number: encrypted                              │  │
│  │  • group_number: encrypted                               │  │
│  │  • subscriber_id: encrypted                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ if_call_transaction_list (Interface)                     │  │
│  │  • policy_number: encrypted (copied from insurances)     │  │
│  │  • group_number: encrypted (copied from insurances)      │  │
│  │  • subscriber_id: encrypted (copied from insurances)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Checklist

✅ **Completed:**
- [x] SSN field encryption in patients table
- [x] SSN masking in API responses
- [x] SSN decryption endpoint
- [x] Address field encryption in patientAddresses table
- [x] Address masking in UI with View button
- [x] Address decryption endpoint
- [x] Insurance policyNumber encryption
- [x] Insurance groupNumber encryption
- [x] Insurance subscriberId encryption
- [x] Insurance field masking in API responses
- [x] Insurance decryption endpoint
- [x] Interface table encryption (if_call_transaction_list)
- [x] Auto-hide feature for revealed data
- [x] User authentication and authorization
- [x] Encryption at rest (AES-256-GCM)
- [x] HTTPS encryption in transit

⏳ **Future Enhancements:**
- [ ] Implement comprehensive audit logging dashboard
- [ ] Add role-based access control (RBAC) for different user types
- [ ] Implement data retention policies
- [ ] Add encryption key rotation mechanism
- [ ] Add batch decrypt capability for administrative users
- [ ] Implement data masking for reports and exports
- [ ] Add biometric authentication for sensitive data access
- [ ] Implement session timeout policies
- [ ] Add data breach notification system

## Troubleshooting

### Common Issues

**1. Decryption fails with "Failed to decrypt data"**
- Check that ENCRYPTION_KEY is set in environment variables
- Verify the encrypted value was created with the same key
- Ensure the value is properly base64 encoded

**2. Masked value appears instead of decrypted value**
- Check that the field has `isEncrypted` flag set to true
- Verify user has authentication and access to the patient
- Check browser console for API errors

**3. Auto-hide doesn't work**
- Verify `autoHideDelay` is set (default: 10000ms)
- Check that component is properly mounted
- Ensure no JavaScript errors in console

**4. Insurance fields show as unencrypted**
- Verify encryption was applied during creation/update
- Check for masked value checks in update logic
- Ensure old data is migrated to encrypted format

## Support and Maintenance

For questions or issues:
1. Check this documentation first
2. Review the source code comments
3. Check audit logs for access patterns
4. Contact the development team

**Regular Maintenance:**
- Review audit logs monthly
- Test decryption endpoints quarterly
- Update encryption keys annually
- Review HIPAA compliance semi-annually
