import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Account: the clinic a set of users belongs to.
 *
 * One account = one dental practice. Users sign in under an account, and the
 * clinic identity used on insurance transactions (name, NPI, tax ID, address)
 * is kept here so the practice can maintain it themselves.
 */
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  /** Clinic name shown across the app. */
  name: text("name").notNull(),
  /** Registered legal entity, when it differs from the clinic name. */
  legalName: text("legal_name"),
  npiNumber: text("npi_number"),
  /** Employer Identification Number (EIN / Tax ID). */
  taxId: text("tax_id"),
  phoneNumber: text("phone_number"),
  faxNumber: text("fax_number"),
  email: text("email"),
  website: text("website"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  timezone: text("timezone").default("America/Chicago"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Payment setup: how the clinic pays its InSpline subscription.
 *
 * One row per account. Card and bank numbers are never stored in full — the
 * processor holds those; we keep the brand and the last four digits so the
 * clinic can recognise the method on file.
 */
export const accountPaymentMethods = pgTable("account_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  /** 'card' | 'ach' — which set of fields below is in use. */
  methodType: text("method_type").notNull().default("card"),
  /** Subscription the clinic is billed for. */
  planName: text("plan_name"),
  /** 'monthly' | 'annual'. */
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  /** Charge the method on file automatically when an invoice is issued. */
  autoPayEnabled: boolean("auto_pay_enabled").notNull().default(true),
  /** Card on file — brand and last four only. */
  cardBrand: text("card_brand"),
  cardLast4: text("card_last4"),
  cardExpMonth: text("card_exp_month"),
  cardExpYear: text("card_exp_year"),
  cardholderName: text("cardholder_name"),
  /** Bank account on file (ACH) — last four only. */
  bankName: text("bank_name"),
  bankAccountLast4: text("bank_account_last4"),
  bankAccountType: text("bank_account_type"), // 'checking' | 'savings'
  bankAccountHolder: text("bank_account_holder"),
  /** Where invoices and receipts are sent. */
  billingContactName: text("billing_contact_name"),
  billingEmail: text("billing_email"),
  billingPhone: text("billing_phone"),
  billingAddressLine1: text("billing_address_line1"),
  billingAddressLine2: text("billing_address_line2"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZipCode: text("billing_zip_code"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Payment history: one row per invoice raised against the clinic account.
 */
export const accountPayments = pgTable("account_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  description: text("description").notNull(),
  /** Billing period the invoice covers. */
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  issuedDate: text("issued_date").notNull(),
  dueDate: text("due_date"),
  paidDate: text("paid_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  /** 'paid' | 'pending' | 'failed' | 'refunded'. */
  status: text("status").notNull(),
  /** How it was paid, e.g. "Visa ····4242" — matches the method on file. */
  paymentMethod: text("payment_method"),
  /** Processor reference, shown so the clinic can quote it to support. */
  referenceNumber: text("reference_number"),
  /** Why a charge failed, when it did. */
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountPaymentMethodSchema = createInsertSchema(accountPaymentMethods);
export const insertAccountPaymentSchema = createInsertSchema(accountPayments);

export type AccountPaymentMethod = typeof accountPaymentMethods.$inferSelect;
export type InsertAccountPaymentMethod = z.infer<typeof insertAccountPaymentMethodSchema>;
export type AccountPayment = typeof accountPayments.$inferSelect;
export type InsertAccountPayment = z.infer<typeof insertAccountPaymentSchema>;

export const insertAccountSchema = createInsertSchema(accounts);

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  /**
   * `admin` is the InSpline system administrator and belongs to no clinic;
   * `manager` and `dental` are the two clinic roles, and both must have an
   * `accountId`. Only a manager may edit the clinic's account details.
   */
  role: text("role").notNull().default("dental"),
  stediMode: text("stedi_mode").notNull().default("mockup"),
  /** Clinic the user signs in under. */
  accountId: varchar("account_id").references(() => accounts.id),
  providerId: varchar("provider_id").references(() => providers.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  role: true,
  stediMode: true,
  accountId: true,
  providerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * Single sign-on identities linked to a login.
 *
 * A clinic manager links a Google or Microsoft Teams account to a team member
 * so that member can sign in with that identity instead of a password. One row
 * per user and provider; `email` is the address the provider signs them in as,
 * which need not be their InSpline address.
 */
export const userSsoIdentities = pgTable("user_sso_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** 'google' | 'microsoft'. */
  provider: text("provider").notNull(),
  /** The address the provider asserts, stored lowercased. */
  email: text("email").notNull(),
  /** The manager who linked it, so the trail outlives their own login. */
  linkedBy: varchar("linked_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSsoIdentitySchema = createInsertSchema(userSsoIdentities);

export type UserSsoIdentity = typeof userSsoIdentities.$inferSelect;
export type InsertUserSsoIdentity = z.infer<typeof insertUserSsoIdentitySchema>;

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  givenName: text("given_name").notNull(),
  middleName: text("middle_name"),
  familyName: text("family_name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date"), // Encrypted - HIPAA sensitive
  ssn: text("ssn"), // Encrypted - HIPAA sensitive (Social Security Number)
  clinicPatientId: text("clinic_patient_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patient contact information
export const patientTelecoms = pgTable("patient_telecoms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  system: text("system").notNull(), // 'phone' | 'email'
  value: text("value").notNull(),
});

// Patient addresses
export const patientAddresses = pgTable("patient_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  line1: text("line1"), // Encrypted - HIPAA sensitive
  line2: text("line2"), // Encrypted - HIPAA sensitive
  city: text("city"), // Encrypted - HIPAA sensitive
  state: text("state"), // Encrypted - HIPAA sensitive
  postalCode: text("postal_code"), // Encrypted - HIPAA sensitive
});

// Insurance policies
export const insurances = pgTable("insurances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  payerId: text("payer_id"), // Stedi API payer ID for verification
  employerName: text("employer_name"),
  groupNumber: text("group_number"), // Encrypted - HIPAA sensitive
  subscriberName: text("subscriber_name"),
  subscriberId: text("subscriber_id"), // Encrypted - HIPAA sensitive
  relationship: text("relationship"),
  effectiveDate: text("effective_date"),
  expirationDate: text("expiration_date"),
  deductible: text("deductible"),
  deductibleMet: text("deductible_met"),
  maxBenefit: text("max_benefit"),
  preventiveCoverage: text("preventive_coverage"),
  basicCoverage: text("basic_coverage"),
  majorCoverage: text("major_coverage"),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(), // 'scheduled' | 'completed' | 'cancelled'
  provider: text("provider"),
});

// Treatments
export const treatments = pgTable("treatments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  date: text("date").notNull(),
  cost: text("cost"),
});

// Coverage details
export const coverageDetails = pgTable("coverage_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  annualMaximum: decimal("annual_maximum", { precision: 10, scale: 2 }),
  annualUsed: decimal("annual_used", { precision: 10, scale: 2 }),
  deductible: decimal("deductible", { precision: 10, scale: 2 }),
  deductibleMet: decimal("deductible_met", { precision: 10, scale: 2 }),
});

// Procedures
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coverageId: varchar("coverage_id").notNull().references(() => coverageDetails.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'Preventive' | 'Basic' | 'Major' | 'Orthodontic'
  coverage: text("coverage"),
  estimatedCost: text("estimated_cost"),
  patientPays: text("patient_pays"),
});

// Verification status
export const verificationStatuses = pgTable("verification_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  fetchPMS: text("fetch_pms").notNull(), // 'completed' | 'in_progress' | 'pending'
  documentAnalysis: text("document_analysis").notNull().default("pending"),
  apiVerification: text("api_verification").notNull(),
  callCenter: text("call_center").notNull().default("pending"),
  aiAnalysisAndCall: text("ai_analysis_and_call").notNull(),
  saveToPMS: text("save_to_pms").notNull(),
});

// AI call history
export const aiCallHistory = pgTable("ai_call_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  summary: text("summary"),
  duration: text("duration"),
  agent: text("agent"),
  status: text("status").notNull(), // 'completed' | 'in_progress'
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'FETCH' | 'API' | 'CALL' | 'FAX' | 'SAVE'
  method: text("method").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  duration: text("duration"),
  status: text("status").notNull(), // 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting'
  patientName: text("patient_name").notNull(),
  insuranceProvider: text("insurance_provider"),
  insuranceRep: text("insurance_rep"),
  runBy: text("run_by"),
  verificationScore: integer("verification_score"),
  fetchStatus: text("fetch_status"),
  saveStatus: text("save_status"),
  responseCode: text("response_code"),
  endpoint: text("endpoint"),
  phoneNumber: text("phone_number"),
  errorMessage: text("error_message"),
  eligibilityCheck: text("eligibility_check"),
  benefitsVerification: text("benefits_verification"),
  coverageDetails: text("coverage_details"),
  deductibleInfo: text("deductible_info"),
  transcript: text("transcript"),
  rawResponse: text("raw_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Call communications
export const callCommunications = pgTable("call_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(),
  speaker: text("speaker").notNull(), // 'AI' | 'InsuranceRep' | 'System'
  message: text("message").notNull(),
  type: text("type").notNull(), // 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note'
});

// Transaction data verified items
export const transactionDataVerified = pgTable("transaction_data_verified", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
});

// Coverage by code data
export const coverageByCode = pgTable("coverage_by_code", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  saiCode: text("sai_code"),
  refInsCode: text("ref_ins_code"),
  category: text("category"),
  fieldName: text("field_name"),
  preStepValue: text("pre_step_value"),
  verified: boolean("verified"),
  verifiedBy: text("verified_by"),
  comments: text("comments"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  coverageData: text("coverage_data"), // JSON string of complete coverage data
});

// Interface Tables - for external system integration
// Interface for CALL transactions
export const ifCallTransactionList = pgTable("if_call_transaction_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(), // Reference to original transaction (no FK - independent copy)
  requestId: varchar("request_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  insuranceProvider: text("insurance_provider"),
  policyNumber: text("policy_number"), // Encrypted - HIPAA sensitive
  groupNumber: text("group_number"), // Encrypted - HIPAA sensitive
  subscriberId: text("subscriber_id"), // Encrypted - HIPAA sensitive
  phoneNumber: text("phone_number"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  duration: text("duration"),
  status: text("status").notNull(), // 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting'
  insuranceRep: text("insurance_rep"),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interface for coverage code data
export const ifCallCoverageCodeList = pgTable("if_call_coverage_code_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ifCallTransactionId: varchar("if_call_transaction_id").notNull().references(() => ifCallTransactionList.id, { onDelete: "cascade" }),
  saiCode: text("sai_code"),
  refInsCode: text("ref_ins_code"),
  category: text("category"),
  fieldName: text("field_name"),
  preStepValue: text("pre_step_value"),
  verified: boolean("verified"),
  verifiedBy: text("verified_by"),
  coverageData: text("coverage_data"), // JSON string of complete coverage data
  createdAt: timestamp("created_at").defaultNow(),
});

// Payers list
export const payers = pgTable("payers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  payerId: text("payer_id").notNull().unique(),
  faxNumber: text("fax_number"),
  phoneNumber: text("phone_number"),
});

// Interface for call messages
export const ifCallMessageList = pgTable("if_call_message_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ifCallTransactionId: varchar("if_call_transaction_id").notNull().references(() => ifCallTransactionList.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull(),
  speaker: text("speaker").notNull(), // 'AI' | 'InsuranceRep' | 'System'
  message: text("message").notNull(),
  type: text("type").notNull(), // 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note'
  createdAt: timestamp("created_at").defaultNow(),
});

// Export insert schemas
export const insertPatientSchema = createInsertSchema(patients);
export const insertPatientTelecomSchema = createInsertSchema(patientTelecoms);
export const insertPatientAddressSchema = createInsertSchema(patientAddresses);
export const insertInsuranceSchema = createInsertSchema(insurances);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const insertTreatmentSchema = createInsertSchema(treatments);
export const insertCoverageDetailsSchema = createInsertSchema(coverageDetails);
export const insertProcedureSchema = createInsertSchema(procedures);
export const insertVerificationStatusSchema = createInsertSchema(verificationStatuses);
export const insertAiCallHistorySchema = createInsertSchema(aiCallHistory);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertCallCommunicationSchema = createInsertSchema(callCommunications);
export const insertCoverageByCodeSchema = createInsertSchema(coverageByCode);
export const insertIfCallTransactionListSchema = createInsertSchema(ifCallTransactionList);
export const insertIfCallCoverageCodeListSchema = createInsertSchema(ifCallCoverageCodeList);
export const insertIfCallMessageListSchema = createInsertSchema(ifCallMessageList);
export const insertPayerSchema = createInsertSchema(payers);

// Providers table
export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  /** Account (clinic) the provider record belongs to. */
  accountId: varchar("account_id").references(() => accounts.id),
  name: text("name").notNull(),
  npiNumber: text("npi_number").notNull().unique(),
  faxNumber: text("fax_number"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  taxNumber: text("tax_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providers);

// Export types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type PatientTelecom = typeof patientTelecoms.$inferSelect;
export type PatientAddress = typeof patientAddresses.$inferSelect;
export type Insurance = typeof insurances.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Treatment = typeof treatments.$inferSelect;
export type CoverageDetail = typeof coverageDetails.$inferSelect;
export type Procedure = typeof procedures.$inferSelect;
export type VerificationStatus = typeof verificationStatuses.$inferSelect;
export type AiCallHistory = typeof aiCallHistory.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type CallCommunication = typeof callCommunications.$inferSelect;
export type Payer = typeof payers.$inferSelect;
export type Provider = typeof providers.$inferSelect;

export type InsertCoverageDetail = z.infer<typeof insertCoverageDetailsSchema>;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type TransactionDataVerified = typeof transactionDataVerified.$inferSelect;
export type CoverageByCode = typeof coverageByCode.$inferSelect;
export type InsertCoverageByCode = z.infer<typeof insertCoverageByCodeSchema>;
export type IfCallTransactionList = typeof ifCallTransactionList.$inferSelect;
export type InsertIfCallTransactionList = z.infer<typeof insertIfCallTransactionListSchema>;
export type IfCallCoverageCodeList = typeof ifCallCoverageCodeList.$inferSelect;
export type InsertIfCallCoverageCodeList = z.infer<typeof insertIfCallCoverageCodeListSchema>;
export type IfCallMessageList = typeof ifCallMessageList.$inferSelect;
export type InsertIfCallMessageList = z.infer<typeof insertIfCallMessageListSchema>;
export type InsertPayer = z.infer<typeof insertPayerSchema>;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
