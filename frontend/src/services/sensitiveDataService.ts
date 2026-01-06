/**
 * Service for handling HIPAA-compliant sensitive patient data
 * Provides encryption, decryption, and masking utilities
 */

export interface DecryptDataParams {
  patientId: string;
  fieldName: string;
}

export interface DecryptDataResponse {
  success: boolean;
  field: string;
  value: string;
}

/**
 * Decrypt a sensitive patient data field
 * @param patientId - The patient's ID
 * @param fieldName - The field name to decrypt (e.g., 'birthDate', 'ssn', 'phone')
 * @returns The decrypted value
 */
export async function decryptSensitiveData(
  patientId: string,
  fieldName: string
): Promise<string> {
  try {
    const response = await fetch(`/api/patients/${patientId}/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field: fieldName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to decrypt data');
    }

    const data: DecryptDataResponse = await response.json();
    return data.value;
  } catch (error) {
    throw error;
  }
}

/**
 * Mask sensitive data for display
 * @param value - The value to mask
 * @param type - The type of data (determines masking pattern)
 * @returns The masked value
 */
export function maskSensitiveData(value: string, type: 'ssn' | 'phone' | 'email' | 'date' | 'default'): string {
  if (!value) return 'N/A';

  switch (type) {
    case 'ssn':
      return '***-**-****';
    case 'phone':
      return '(***) ***-****';
    case 'email':
      return '****@****.***';
    case 'date':
      return '****-**-**';
    default:
      return '********';
  }
}

/**
 * Check if a field should be treated as sensitive under HIPAA
 * @param fieldName - The field name to check
 * @returns True if the field is sensitive
 */
export function isSensitiveField(fieldName: string): boolean {
  const sensitiveFields = [
    'birthDate',
    'ssn',
    'phone',
    'email',
    'address',
    'medicalRecordNumber',
    'insuranceNumber',
    'policyNumber'
  ];

  return sensitiveFields.some(field =>
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
}

/**
 * HIPAA-compliant field types that require encryption
 */
export const SENSITIVE_FIELD_TYPES = {
  BIRTH_DATE: 'birthDate',
  SSN: 'ssn',
  PHONE: 'phone',
  EMAIL: 'email',
  ADDRESS: 'address',
  MEDICAL_RECORD_NUMBER: 'medicalRecordNumber',
  INSURANCE_NUMBER: 'insuranceNumber',
  POLICY_NUMBER: 'policyNumber'
} as const;

export type SensitiveFieldType = typeof SENSITIVE_FIELD_TYPES[keyof typeof SENSITIVE_FIELD_TYPES];

/**
 * Decrypt a sensitive insurance field
 * @param patientId - The patient's ID
 * @param insuranceId - The insurance record ID
 * @param fieldName - The field name to decrypt (e.g., 'policyNumber', 'groupNumber')
 * @returns The decrypted value
 */
export async function decryptInsuranceField(
  patientId: string,
  insuranceId: string,
  fieldName: string
): Promise<string> {
  try {
    const response = await fetch(`/api/patients/${patientId}/insurance/${insuranceId}/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field: fieldName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to decrypt insurance data');
    }

    const data: DecryptDataResponse = await response.json();
    return data.value;
  } catch (error) {
    throw error;
  }
}
