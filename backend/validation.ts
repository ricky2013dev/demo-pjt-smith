/**
 * HIPAA-Compliant Input Validation Module
 *
 * Validates and sanitizes all patient data inputs to prevent:
 * - SQL Injection
 * - XSS attacks
 * - Invalid PHI formats
 * - Data integrity issues
 */

import { z } from 'zod';

// Sanitize string input to prevent XSS
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate date format (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Validate SSN format (XXX-XX-XXXX or XXXXXXXXX)
const ssnRegex = /^(\d{3}-\d{2}-\d{4}|\d{9})$/;

// Validate phone format (various US formats)
const phoneRegex = /^[\d\s\-\(\)\.+]+$/;

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate postal code (US ZIP codes)
const postalCodeRegex = /^\d{5}(-\d{4})?$/;

// Patient name schema
const patientNameSchema = z.object({
  given: z.array(z.string().max(100)).optional(),
  family: z.string().max(100).optional(),
}).optional();

// Telecom schema (phone, email)
const telecomSchema = z.object({
  system: z.enum(['phone', 'email', 'fax']),
  value: z.string().max(255),
});

// Address schema - supports both line1/line2 format and line array format
const addressSchema = z.object({
  line: z.array(z.string().max(255)).optional(),
  line1: z.string().max(255).optional().nullable(),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
});

// Insurance schema
const insuranceSchema = z.object({
  type: z.enum(['Primary', 'Secondary']).optional(),
  provider: z.string().max(255).optional().nullable(),
  payerId: z.string().max(50).optional().nullable(),
  policyNumber: z.string().max(100).optional().nullable(),
  groupNumber: z.string().max(100).optional().nullable(),
  subscriberName: z.string().max(255).optional().nullable(),
  subscriberId: z.string().max(100).optional().nullable(),
  relationship: z.string().max(50).optional().nullable(),
  effectiveDate: z.string().max(20).optional().nullable(),
  expirationDate: z.string().max(20).optional().nullable(),
  coverage: z.object({
    deductible: z.string().max(50).optional().nullable(),
    deductibleMet: z.string().max(50).optional().nullable(),
    maxBenefit: z.string().max(50).optional().nullable(),
    preventiveCoverage: z.string().max(50).optional().nullable(),
    basicCoverage: z.string().max(50).optional().nullable(),
    majorCoverage: z.string().max(50).optional().nullable(),
  }).optional(),
});

// Complete patient input schema
export const createPatientSchema = z.object({
  patient: z.object({
    active: z.boolean().optional().default(true),
    name: patientNameSchema,
    givenName: z.string().max(200).optional(),
    familyName: z.string().max(100).optional(),
    gender: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(['male', 'female', 'other', 'unknown']).optional()
    ),
    birthDate: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().max(20).optional().refine(
        (val) => !val || dateRegex.test(val),
        { message: 'Birth date must be in YYYY-MM-DD format' }
      )
    ),
    ssn: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().max(20).optional().refine(
        (val) => !val || ssnRegex.test(val.replace(/\s/g, '')),
        { message: 'SSN must be in XXX-XX-XXXX or XXXXXXXXX format' }
      )
    ),
  }),
  telecoms: z.array(telecomSchema).optional(),
  addresses: z.array(addressSchema).optional(),
  insurances: z.array(insuranceSchema).optional(),
  appointments: z.array(z.object({
    date: z.string().max(20).optional(),
    time: z.string().max(20).optional(),
    type: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    provider: z.string().max(255).optional(),
  })).optional(),
  treatments: z.array(z.object({
    code: z.string().max(50).optional(),
    name: z.string().max(255).optional(),
    category: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    date: z.string().max(20).optional(),
    tooth: z.string().max(20).optional(),
    provider: z.string().max(255).optional(),
    cost: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
  })).optional(),
  verificationStatus: z.object({
    status: z.string().max(50).optional(),
    method: z.string().max(50).optional(),
    lastUpdated: z.string().max(50).optional(),
    fetchPMS: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    apiVerification: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    aiAnalysisAndCall: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    saveToPMS: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
  }).optional(),
});

// Patient update schema
export const updatePatientSchema = z.object({
  active: z.boolean().optional(),
  name: patientNameSchema,
  gender: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['male', 'female', 'other', 'unknown']).optional()
  ),
  birthDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(20).optional().refine(
      (val) => !val || val === '****-**-**' || dateRegex.test(val),
      { message: 'Birth date must be in YYYY-MM-DD format' }
    )
  ),
  ssn: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(20).optional().refine(
      (val) => !val || val === '***-**-****' || val === 'XXX-XX-XXXX' || ssnRegex.test(val.replace(/\s/g, '')),
      { message: 'SSN must be in XXX-XX-XXXX or XXXXXXXXX format' }
    )
  ),
  insurance: z.array(insuranceSchema).optional(),
  telecoms: z.array(telecomSchema).optional(),
  addresses: z.array(addressSchema).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

// Registration schema with password requirements
export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255)
    .refine(
      (val) => /[A-Z]/.test(val),
      { message: 'Password must contain at least one uppercase letter' }
    )
    .refine(
      (val) => /[a-z]/.test(val),
      { message: 'Password must contain at least one lowercase letter' }
    )
    .refine(
      (val) => /\d/.test(val),
      { message: 'Password must contain at least one number' }
    ),
  name: z.string().max(255).optional(),
  role: z.enum(['dental', 'insurance', 'admin']).optional(),
});

/**
 * Validate patient creation input
 */
export function validateCreatePatient(data: unknown) {
  return createPatientSchema.safeParse(data);
}

/**
 * Validate patient update input
 */
export function validateUpdatePatient(data: unknown) {
  return updatePatientSchema.safeParse(data);
}

/**
 * Validate login input
 */
export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data);
}

/**
 * Validate registration input
 */
export function validateRegister(data: unknown) {
  return registerSchema.safeParse(data);
}

/**
 * Sanitize patient data object
 */
export function sanitizePatientData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'object' ? sanitizePatientData(item) : item
      ) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePatientData(sanitized[key]);
    }
  }

  return sanitized;
}
