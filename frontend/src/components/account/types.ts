/** Clinic account record, as returned by `/api/account`. */
export interface Account {
  id: string;
  name: string;
  legalName: string | null;
  npiNumber: string | null;
  taxId: string | null;
  phoneNumber: string | null;
  faxNumber: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * A Google or Microsoft Teams account linked to a login, so the member can
 * sign in with it instead of a password.
 */
export interface SsoIdentity {
  provider: 'google' | 'microsoft' | string;
  /** The address the provider signs them in as. */
  email: string;
  createdAt: string | null;
}

/** A user signed in under the account, as returned by `/api/account/users`. */
export interface AccountUser {
  id: string;
  email: string;
  username: string;
  role: string;
  stediMode: string;
  accountId: string | null;
  providerId: string | null;
  /** Provider accounts a manager has linked to this login. */
  ssoIdentities?: SsoIdentity[];
}

/** What a manager may change about a team member. */
export interface TeamMemberFormValues {
  username: string;
  email: string;
  role: string;
}

/**
 * How the clinic pays its InSpline subscription, as returned by
 * `/api/account/payment-method`. Card and bank numbers are never held in full —
 * only the brand and the last four digits reach the browser.
 */
export interface AccountPaymentMethod {
  id: string;
  accountId: string;
  methodType: 'card' | 'ach' | string;
  planName: string | null;
  billingCycle: 'monthly' | 'annual' | string;
  autoPayEnabled: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: string | null;
  cardExpYear: string | null;
  cardholderName: string | null;
  bankName: string | null;
  bankAccountLast4: string | null;
  bankAccountType: string | null;
  bankAccountHolder: string | null;
  billingContactName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZipCode: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/** One invoice raised against the clinic, as returned by `/api/account/payments`. */
export interface AccountPayment {
  id: string;
  accountId: string;
  invoiceNumber: string;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  issuedDate: string;
  dueDate: string | null;
  paidDate: string | null;
  amount: string;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  failureReason: string | null;
  createdAt: string | null;
}
