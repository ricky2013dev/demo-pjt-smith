import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  dataSource: text("data_source"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  role: true,
  dataSource: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  givenName: text("given_name").notNull(),
  familyName: text("family_name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date"), // Encrypted - HIPAA sensitive
  ssn: text("ssn"), // Encrypted - HIPAA sensitive (Social Security Number)
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
  type: text("type").notNull(), // 'Primary' | 'Secondary'
  provider: text("provider").notNull(),
  policyNumber: text("policy_number"), // Encrypted - HIPAA sensitive
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
  documentAnalysis: text("document_analysis").notNull(),
  apiVerification: text("api_verification").notNull(),
  callCenter: text("call_center").notNull(),
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
