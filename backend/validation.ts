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
  provider: z.string().max(255).optional().nullable(),
  payerId: z.string().max(50).optional().nullable(),
  employerName: z.string().max(255).optional().nullable(),
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
    middleName: z.string().max(200).optional(),
    familyName: z.string().max(100).optional(),
    clinicPatientId: z.string().max(100).optional(),
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
    documentAnalysis: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    apiVerification: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    callCenter: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    aiAnalysisAndCall: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    saveToPMS: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
  }).optional(),
});

// Patient update schema
export const updatePatientSchema = z.object({
  active: z.boolean().optional(),
  name: patientNameSchema,
  middleName: z.string().max(200).optional(),
  clinicPatientId: z.string().max(100).optional(),
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

/**
 * User roles.
 *
 * `admin` is the InSpline system administrator: it manages users and system
 * data from the admin portal and belongs to no clinic. `manager` and `dental`
 * are the clinic roles and always sit under an account; only a manager may
 * edit the clinic's own details.
 */
export const USER_ROLES = ['admin', 'manager', 'dental'] as const;
export type UserRole = typeof USER_ROLES[number];

/** The roles that belong to a clinic account. */
export const CLINIC_ROLES: UserRole[] = ['manager', 'dental'];

export const isClinicRole = (role: unknown): role is 'manager' | 'dental' =>
  CLINIC_ROLES.includes(role as UserRole);

// Account (clinic) update schema
//
// Every field is optional so the form can send a partial update; empty strings
// are kept (they clear an optional field) but trimmed by the sanitizer.
const optionalText = (max: number) => z.string().max(max).optional();

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Clinic name is required').max(255).optional(),
  legalName: optionalText(255),
  npiNumber: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/\s/g, '') : val),
    z.string().max(20).optional().refine(
      (val) => !val || /^\d{10}$/.test(val),
      { message: 'NPI must be 10 digits' }
    )
  ),
  taxId: z.string().max(20).optional().refine(
    (val) => !val || /^\d{2}-?\d{7}$/.test(val.trim()),
    { message: 'Tax ID must be in XX-XXXXXXX format' }
  ),
  phoneNumber: z.string().max(30).optional().refine(
    (val) => !val || phoneRegex.test(val),
    { message: 'Phone number contains invalid characters' }
  ),
  faxNumber: z.string().max(30).optional().refine(
    (val) => !val || phoneRegex.test(val),
    { message: 'Fax number contains invalid characters' }
  ),
  email: z.string().max(255).optional().refine(
    (val) => !val || z.string().email().safeParse(val).success,
    { message: 'Email address is not valid' }
  ),
  website: optionalText(255),
  addressLine1: optionalText(255),
  addressLine2: optionalText(255),
  city: optionalText(100),
  state: optionalText(50),
  zipCode: z.string().max(15).optional().refine(
    (val) => !val || /^\d{5}(-\d{4})?$/.test(val.trim()),
    { message: 'ZIP code must be 12345 or 12345-6789' }
  ),
  timezone: optionalText(64),
});

// Account payment setup schema
//
// How the clinic pays its subscription. Full card / bank numbers are never
// accepted here — the processor holds those, and only the brand and the last
// four digits are kept so the clinic can recognise the method on file.
const last4 = (label: string) =>
  z.string().max(4, `${label} must be the last 4 digits only`).optional().refine(
    (val) => !val || /^\d{4}$/.test(val),
    { message: `${label} must be the last 4 digits` }
  );

export const updatePaymentSetupSchema = z.object({
  methodType: z.enum(['card', 'ach'], { errorMap: () => ({ message: 'Choose a card or a bank account' }) }).optional(),
  planName: optionalText(120),
  billingCycle: z.enum(['monthly', 'annual'], { errorMap: () => ({ message: 'Billing cycle must be monthly or annual' }) }).optional(),
  autoPayEnabled: z.boolean().optional(),

  cardBrand: optionalText(40),
  cardLast4: last4('Card number'),
  cardExpMonth: z.string().max(2).optional().refine(
    (val) => !val || /^(0[1-9]|1[0-2])$/.test(val),
    { message: 'Expiry month must be 01–12' }
  ),
  cardExpYear: z.string().max(4).optional().refine(
    (val) => !val || /^\d{4}$/.test(val),
    { message: 'Expiry year must be 4 digits' }
  ),
  cardholderName: optionalText(255),

  bankName: optionalText(255),
  bankAccountLast4: last4('Account number'),
  bankAccountType: z.string().max(20).optional().refine(
    (val) => !val || ['checking', 'savings'].includes(val),
    { message: 'Account type must be checking or savings' }
  ),
  bankAccountHolder: optionalText(255),

  billingContactName: optionalText(255),
  billingEmail: z.string().max(255).optional().refine(
    (val) => !val || z.string().email().safeParse(val).success,
    { message: 'Billing email address is not valid' }
  ),
  billingPhone: z.string().max(30).optional().refine(
    (val) => !val || phoneRegex.test(val),
    { message: 'Billing phone number contains invalid characters' }
  ),
  billingAddressLine1: optionalText(255),
  billingAddressLine2: optionalText(255),
  billingCity: optionalText(100),
  billingState: optionalText(50),
  billingZipCode: z.string().max(15).optional().refine(
    (val) => !val || /^\d{5}(-\d{4})?$/.test(val.trim()),
    { message: 'ZIP code must be 12345 or 12345-6789' }
  ),
}).superRefine((data, ctx) => {
  // The chosen method has to be complete enough to bill against.
  if (data.methodType === 'card' && data.cardLast4 === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardLast4'], message: 'Card number is required' });
  }
  if (data.methodType === 'ach' && data.bankAccountLast4 === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankAccountLast4'], message: 'Account number is required' });
  }
});

// Team member schema
//
// What a clinic manager may change about a login on their own account. The
// data mode is deliberately absent: it decides whether eligibility calls reach
// the real payer network, so it stays with the InSpline administrator.
export const updateTeamMemberSchema = z.object({
  username: z.string().min(2, 'Name must be at least 2 characters').max(50).optional().refine(
    (val) => val === undefined || /^[A-Za-z0-9._-]+$/.test(val),
    { message: 'Name may use letters, numbers, dots, dashes and underscores' }
  ),
  email: z.string().max(255).optional().refine(
    (val) => val === undefined || z.string().email().safeParse(val).success,
    { message: 'Email address is not valid' }
  ),
  role: z.enum(['manager', 'dental'], {
    errorMap: () => ({ message: 'Role must be manager or dental' }),
  }).optional(),
});

// Single sign-on link schema
//
// The identity a manager links to a team member so they can sign in with it.
export const SSO_PROVIDERS = ['google', 'microsoft'] as const;
export type SsoProvider = typeof SSO_PROVIDERS[number];

export const linkSsoIdentitySchema = z.object({
  provider: z.enum(SSO_PROVIDERS, {
    errorMap: () => ({ message: 'Sign-in provider must be google or microsoft' }),
  }),
  email: z.string().max(255).refine(
    (val) => z.string().email().safeParse(val).success,
    { message: 'Email address is not valid' }
  ),
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
  role: z.enum(USER_ROLES).optional(),
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
 * Validate account (clinic) update input
 */
export function validateUpdateAccount(data: unknown) {
  return updateAccountSchema.safeParse(data);
}

/**
 * Validate account payment setup input
 */
export function validateUpdatePaymentSetup(data: unknown) {
  return updatePaymentSetupSchema.safeParse(data);
}

/**
 * Validate a clinic manager's edit of a team member
 */
export function validateUpdateTeamMember(data: unknown) {
  return updateTeamMemberSchema.safeParse(data);
}

/**
 * Validate a single sign-on identity link
 */
export function validateLinkSsoIdentity(data: unknown) {
  return linkSsoIdentitySchema.safeParse(data);
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
