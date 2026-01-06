import {
  type User,
  type InsertUser,
  type Patient,
  type InsertPatient,
  type PatientTelecom,
  type PatientAddress,
  type Insurance,
  type Appointment,
  type Treatment,
  type VerificationStatus,
  users,
  patients,
  patientTelecoms,
  patientAddresses,
  insurances,
  appointments,
  treatments,
  verificationStatuses,
  coverageDetails,
  procedures,
  transactions,
  callCommunications,
  transactionDataVerified,
  coverageByCode,
  ifCallTransactionList,
  ifCallCoverageCodeList,
  ifCallMessageList,
  aiCallHistory,
  type CoverageDetail,
  type Procedure,
  type Transaction,
  type CallCommunication,
  type TransactionDataVerified,
  type InsertCoverageDetail,
  type InsertProcedure,
  type CoverageByCode,
  type InsertCoverageByCode
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;

  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatientsByUserId(userId: string): Promise<Patient[]>;
  getPatientById(patientId: string): Promise<Patient | undefined>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;

  // Patient contact methods
  createPatientTelecom(telecom: Omit<PatientTelecom, 'id'>): Promise<PatientTelecom>;
  getPatientTelecoms(patientId: string): Promise<PatientTelecom[]>;

  // Patient address methods
  createPatientAddress(address: Omit<PatientAddress, 'id'>): Promise<PatientAddress>;
  getPatientAddresses(patientId: string): Promise<PatientAddress[]>;

  // Insurance methods
  createInsurance(insurance: Omit<Insurance, 'id'>): Promise<Insurance>;
  getPatientInsurances(patientId: string): Promise<Insurance[]>;
  updateInsurance(id: string, updates: Partial<Insurance>): Promise<Insurance | undefined>;

  // Appointment methods
  createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment>;
  getPatientAppointments(patientId: string): Promise<Appointment[]>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Treatment methods
  createTreatment(treatment: Omit<Treatment, 'id'>): Promise<Treatment>;
  getPatientTreatments(patientId: string): Promise<Treatment[]>;

  // Verification status methods
  createVerificationStatus(status: Omit<VerificationStatus, 'id'>): Promise<VerificationStatus>;
  getPatientVerificationStatus(patientId: string): Promise<VerificationStatus | undefined>;
  updateVerificationStatus(id: string, updates: Partial<VerificationStatus>): Promise<VerificationStatus | undefined>;

  // Coverage details methods
  createCoverageDetail(coverage: InsertCoverageDetail): Promise<CoverageDetail>;
  getCoverageDetailByPatientId(patientId: string): Promise<CoverageDetail | undefined>;

  // Procedures methods
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  getProceduresByCoverageId(coverageId: string): Promise<Procedure[]>;

  // Transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getCallCommunicationsByTransactionId(transactionId: string): Promise<CallCommunication[]>;
  getTransactionDataVerifiedByTransactionId(transactionId: string): Promise<TransactionDataVerified[]>;

  // Coverage by code methods
  saveCoverageByCode(patientId: string, userId: string, coverageData: any[]): Promise<void>;
  getCoverageByCodeForPatient(patientId: string, userId: string): Promise<CoverageByCode[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return user;
  }

  // Patient methods
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async getPatientsByUserId(userId: string): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.userId, userId));
  }

  async getPatientById(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const [patient] = await db.update(patients).set(updates).where(eq(patients.id, id)).returning();
    return patient;
  }

  async deletePatient(id: string): Promise<boolean> {
    // Delete in order from most dependent to least dependent
    // This ensures we don't hit foreign key constraint errors

    // 1. Delete interface table records (no FK constraints to patient)
    // First delete child records, then parent records
    const ifTransactions = await db.select().from(ifCallTransactionList).where(eq(ifCallTransactionList.patientId, id));
    for (const ifTxn of ifTransactions) {
      await db.delete(ifCallMessageList).where(eq(ifCallMessageList.ifCallTransactionId, ifTxn.id));
      await db.delete(ifCallCoverageCodeList).where(eq(ifCallCoverageCodeList.ifCallTransactionId, ifTxn.id));
    }
    await db.delete(ifCallTransactionList).where(eq(ifCallTransactionList.patientId, id));

    // 2. Delete transaction-related child records
    const patientTransactions = await db.select().from(transactions).where(eq(transactions.patientId, id));
    for (const txn of patientTransactions) {
      await db.delete(callCommunications).where(eq(callCommunications.transactionId, txn.id));
      await db.delete(transactionDataVerified).where(eq(transactionDataVerified.transactionId, txn.id));
    }

    // 3. Delete coverage-related child records
    const patientCoverageDetails = await db.select().from(coverageDetails).where(eq(coverageDetails.patientId, id));
    for (const coverage of patientCoverageDetails) {
      await db.delete(procedures).where(eq(procedures.coverageId, coverage.id));
    }

    // 4. Delete remaining patient-related records (these have FK to patient)
    await db.delete(coverageByCode).where(eq(coverageByCode.patientId, id));
    await db.delete(aiCallHistory).where(eq(aiCallHistory.patientId, id));
    await db.delete(transactions).where(eq(transactions.patientId, id));
    await db.delete(coverageDetails).where(eq(coverageDetails.patientId, id));
    await db.delete(verificationStatuses).where(eq(verificationStatuses.patientId, id));
    await db.delete(treatments).where(eq(treatments.patientId, id));
    await db.delete(appointments).where(eq(appointments.patientId, id));
    await db.delete(insurances).where(eq(insurances.patientId, id));
    await db.delete(patientAddresses).where(eq(patientAddresses.patientId, id));
    await db.delete(patientTelecoms).where(eq(patientTelecoms.patientId, id));

    // 5. Finally delete the patient record
    const result = await db.delete(patients).where(eq(patients.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Patient contact methods
  async createPatientTelecom(telecom: Omit<PatientTelecom, 'id'>): Promise<PatientTelecom> {
    const [newTelecom] = await db.insert(patientTelecoms).values(telecom).returning();
    return newTelecom;
  }

  async getPatientTelecoms(patientId: string): Promise<PatientTelecom[]> {
    return await db.select().from(patientTelecoms).where(eq(patientTelecoms.patientId, patientId));
  }

  // Patient address methods
  async createPatientAddress(address: Omit<PatientAddress, 'id'>): Promise<PatientAddress> {
    const [newAddress] = await db.insert(patientAddresses).values(address).returning();
    return newAddress;
  }

  async getPatientAddresses(patientId: string): Promise<PatientAddress[]> {
    return await db.select().from(patientAddresses).where(eq(patientAddresses.patientId, patientId));
  }

  // Insurance methods
  async createInsurance(insurance: Omit<Insurance, 'id'>): Promise<Insurance> {
    const [newInsurance] = await db.insert(insurances).values(insurance).returning();
    return newInsurance;
  }

  async getPatientInsurances(patientId: string): Promise<Insurance[]> {
    return await db.select().from(insurances).where(eq(insurances.patientId, patientId));
  }

  async updateInsurance(id: string, updates: Partial<Insurance>): Promise<Insurance | undefined> {
    const [insurance] = await db.update(insurances).set(updates).where(eq(insurances.id, id)).returning();
    return insurance;
  }

  // Appointment methods
  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [appointment] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    return appointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  // Treatment methods
  async createTreatment(treatment: Omit<Treatment, 'id'>): Promise<Treatment> {
    const [newTreatment] = await db.insert(treatments).values(treatment).returning();
    return newTreatment;
  }

  async getPatientTreatments(patientId: string): Promise<Treatment[]> {
    return await db.select().from(treatments).where(eq(treatments.patientId, patientId));
  }

  // Verification status methods
  async createVerificationStatus(status: Omit<VerificationStatus, 'id'>): Promise<VerificationStatus> {
    const [newStatus] = await db.insert(verificationStatuses).values(status).returning();
    return newStatus;
  }

  async getPatientVerificationStatus(patientId: string): Promise<VerificationStatus | undefined> {
    const [status] = await db.select().from(verificationStatuses).where(eq(verificationStatuses.patientId, patientId));
    return status;
  }

  async updateVerificationStatus(id: string, updates: Partial<VerificationStatus>): Promise<VerificationStatus | undefined> {
    const [status] = await db.update(verificationStatuses).set(updates).where(eq(verificationStatuses.id, id)).returning();
    return status;
  }

  // Coverage details methods
  async createCoverageDetail(coverage: InsertCoverageDetail): Promise<CoverageDetail> {
    const [newCoverage] = await db.insert(coverageDetails).values(coverage).returning();
    return newCoverage;
  }

  async getCoverageDetailByPatientId(patientId: string): Promise<CoverageDetail | undefined> {
    const [coverage] = await db.select().from(coverageDetails).where(eq(coverageDetails.patientId, patientId));
    return coverage;
  }

  // Procedures methods
  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    const [newProcedure] = await db.insert(procedures).values(procedure).returning();
    return newProcedure;
  }

  async getProceduresByCoverageId(coverageId: string): Promise<Procedure[]> {
    return await db.select().from(procedures).where(eq(procedures.coverageId, coverageId));
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    const result = await db.select().from(transactions);
    return result;
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getCallCommunicationsByTransactionId(transactionId: string): Promise<CallCommunication[]> {
    return await db.select().from(callCommunications).where(eq(callCommunications.transactionId, transactionId)).orderBy(callCommunications.timestamp);
  }

  async getTransactionDataVerifiedByTransactionId(transactionId: string): Promise<TransactionDataVerified[]> {
    return await db.select().from(transactionDataVerified).where(eq(transactionDataVerified.transactionId, transactionId));
  }

  // Coverage by code methods
  async saveCoverageByCode(patientId: string, userId: string, coverageData: any[]): Promise<void> {
    // First, delete existing records for this patient and user
    await db.delete(coverageByCode).where(eq(coverageByCode.patientId, patientId));

    // Then insert new records
    if (coverageData && coverageData.length > 0) {
      const records = coverageData.map((item) => ({
        patientId,
        userId,
        saiCode: item.saiCode || null,
        refInsCode: item.refInsCode || null,
        category: item.category || null,
        fieldName: item.fieldName || null,
        preStepValue: item.preStepValue || null,
        verified: item.verified || false,
        verifiedBy: item.verifiedBy || null,
        comments: item.comments || null,
        coverageData: JSON.stringify(item)
      }));

      await db.insert(coverageByCode).values(records);
    }
  }

  async getCoverageByCodeForPatient(patientId: string, userId: string): Promise<CoverageByCode[]> {
    return await db.select().from(coverageByCode).where(eq(coverageByCode.patientId, patientId));
  }
}

export const storage = new DatabaseStorage();
