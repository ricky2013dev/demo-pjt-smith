import { db } from "./db";
import { transactions, callCommunications, transactionDataVerified, patients, patientTelecoms, patientAddresses, verificationStatuses, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Sample transaction data for patient P000001 (test01lee)
const sampleTransactions = [
  {
    requestId: 'REQ-2025-11-28-0800',
    patientId: 'P000001',
    patientName: 'test01lee',
    type: 'FETCH' as const,
    method: 'GET /pms/patient/data',
    startTime: '2025-11-28 08:00:00',
    endTime: '2025-11-28 08:02:15',
    duration: '2m 15s',
    status: 'SUCCESS' as const,
    insuranceProvider: '-',
    insuranceRep: '-',
    runBy: 'Smith AI System',
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'pending',
    endpoint: 'https://pms.dental.local/api/patient/data',
    eligibilityCheck: 'Patient record retrieved from PMS',
    benefitsVerification: 'Data synchronized with local database',
    coverageDetails: 'Patient active in system',
    deductibleInfo: 'Initial data fetch completed',
    transcript: 'Fetch PMS data completed successfully. Patient information retrieved and validated.'
  },
  {
    requestId: 'REQ-2025-11-28-0930',
    patientId: 'P000001',
    patientName: 'test01lee',
    type: 'API' as const,
    method: 'POST /api/benefits/query',
    startTime: '2025-11-28 09:30:15',
    endTime: '2025-11-28 09:31:25',
    duration: '1m 10s',
    status: 'SUCCESS' as const,
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'API System',
    runBy: 'Smith AI System',
    verificationScore: 80,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    responseCode: '200',
    endpoint: 'https://api.cigna.com/dental/benefits',
    eligibilityCheck: 'ACTIVE - Policy effective through 12/31/2026. Policy status: active and in good standing. Verification date: 01/21/2025',
    benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50% | Waiting Periods: Preventive - None, Basic - None, Major - 12 months',
    coverageDetails: 'Annual Maximum: $2,000 | Used: $450 | Remaining: $1,550 | Plan Type: PPO Premium',
    deductibleInfo: 'Individual Deductible: $50 | Family Deductible: $150 | Deductible Met: $50',
    rawResponse: '{"verification_id":"VER-2025-001234","timestamp":"2025-01-21T10:30:45Z","patient":{"name":"test01lee","dob":"1978-07-22","member_id":"BCBS123456789"},"insurance":{"carrier":"Cigna Dental","group_number":"GRP987654","policy_status":"active","effective_date":"2024-01-01","plan_type":"PPO Premium"},"eligibility":{"active":true,"coverage_status":"verified","verification_date":"2025-01-21"},"benefits":{"annual_maximum":2000,"annual_used":450,"annual_remaining":1550,"deductible":50,"deductible_met":50,"preventive_coverage":"100%","basic_coverage":"80%","major_coverage":"50%","waiting_periods":{"preventive":"none","basic":"none","major":"12 months"}}}'
  },
  {
    requestId: 'REQ-2025-11-28-0915',
    patientId: 'P000001',
    patientName: 'test01lee',
    type: 'FAX' as const,
    method: 'FAX /fax/document-analysis',
    startTime: '2025-11-28 09:15:30',
    endTime: '2025-11-28 09:20:55',
    duration: '5m 25s',
    status: 'SUCCESS' as const,
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'Fax System',
    runBy: 'Smith AI System',
    verificationScore: 30,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    eligibilityCheck: 'ACTIVE - Policy effective through 12/31/2025',
    benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50%',
    coverageDetails: 'Annual Maximum: $2,000 | Used: $0 | Remaining: $2,000',
    deductibleInfo: 'Individual Deductible: $50 | Met: $0',
    transcript: 'Fax document analysis completed successfully. Insurance information extracted and verified from fax document.'
  },
  {
    requestId: 'REQ-2025-11-28-1045',
    patientId: 'P000001',
    patientName: 'test01lee',
    type: 'CALL' as const,
    method: 'VOICE /ai-agent/verify',
    startTime: '2025-11-28 10:45:22',
    endTime: '2025-11-28 11:33:22',
    duration: '48m 0s',
    status: 'SUCCESS' as const,
    insuranceProvider: 'Cigna Dental',
    insuranceRep: 'Amanda Rodriguez',
    runBy: 'Smith AI System',
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'pending',
    phoneNumber: '1-800-555-0188',
    transcript: 'Complete verification successful for patient test01lee. All benefits verified.',
    benefitsVerification: 'Preventive: 100%, Basic: 80%, Major: 50%',
    coverageDetails: 'Annual Maximum: $2,000 | Used: $0 | Remaining: $2,000',
    deductibleInfo: 'Individual Deductible: $50 | Met: $0'
  },
  {
    requestId: 'REQ-2025-11-28-1135',
    patientId: 'P000001',
    patientName: 'test01lee',
    type: 'SAVE' as const,
    method: 'POST /pms/patient/save',
    startTime: '2025-11-28 11:35:00',
    endTime: '2025-11-28 11:36:30',
    duration: '1m 30s',
    status: 'SUCCESS' as const,
    insuranceProvider: '-',
    insuranceRep: '-',
    runBy: 'Smith AI System',
    verificationScore: 100,
    fetchStatus: 'completed',
    saveStatus: 'completed',
    endpoint: 'https://pms.dental.local/api/patient/save',
    eligibilityCheck: 'All verification data saved to PMS',
    benefitsVerification: 'Insurance benefits synchronized with PMS',
    coverageDetails: 'Coverage details updated in patient record',
    deductibleInfo: 'Deductible information recorded in system',
    transcript: 'Save to PMS completed successfully. All verified information has been synchronized with the patient management system.'
  }
];

export async function seedTransactions() {
  try {

    // Create patient P000001 if it doesn't exist
    const [existingPatient] = await db.select().from(patients).where(eq(patients.id, 'P000001'));

    if (!existingPatient) {

      // Get the first user to associate with this patient
      const [user] = await db.select().from(users).limit(1);
      const userId = user?.id || 'default-user-id';

      await db.insert(patients).values({
        id: 'P000001',
        userId,
        active: true,
        givenName: 'test01lee',
        familyName: '',
        gender: 'male',
        birthDate: null,
        ssn: null
      });

      await db.insert(patientTelecoms).values([
        { patientId: 'P000001', system: 'phone', value: '(555) 555-1234' },
        { patientId: 'P000001', system: 'email', value: 'test01lee@example.com' }
      ]);

      await db.insert(patientAddresses).values({
        patientId: 'P000001',
        line1: '123 Main St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102'
      });

      await db.insert(verificationStatuses).values({
        patientId: 'P000001',
        fetchPMS: 'completed',
        documentAnalysis: 'pending',
        apiVerification: 'completed',
        callCenter: 'completed',
        saveToPMS: 'pending'
      });

    } else {
    }

    // Delete existing transactions (optional - remove this if you want to keep existing data)
    await db.delete(transactions).where(eq(transactions.patientId, 'P000001'));

    // Insert sample transactions
    for (const txn of sampleTransactions) {
      const [insertedTxn] = await db.insert(transactions).values(txn).returning();

      // Insert data verified items for transactions
      if (txn.type === 'FETCH') {
        const dataVerifiedItems = ['Patient ID', 'Patient Name', 'DOB', 'Contact Info', 'Medical History'];
        for (const item of dataVerifiedItems) {
          await db.insert(transactionDataVerified).values({
            transactionId: insertedTxn.id,
            item
          });
        }
      } else if (txn.type === 'API') {
        const dataVerifiedItems = [
          'Patient Name', 'Patient SSN', 'Patient Date of Birth', 'Relationship to Subscriber',
          'Subscriber Name', 'Subscriber SSN', 'Subscriber Date of Birth', 'Subscriber ID Number',
          'Insurance Company', 'Insurer Type - Primary', 'Insurer Type - Secondary', 'Insurance Address',
          'Insurance Phone', 'Employer', 'Group Number', 'Effective Date', 'Renewal Month',
          'Yearly Maximum', 'Deductible Per Individual', 'Deductible Per Family',
          'Deductible Applies To - Preventative', 'Deductible Applies To - Basic',
          'Deductible Applies To - Major', 'Preventative Covered At (%)', 'Preventative Waiting Period',
          'Preventative Effective Date', 'Bitewing Frequency'
        ];
        for (const item of dataVerifiedItems) {
          await db.insert(transactionDataVerified).values({
            transactionId: insertedTxn.id,
            item
          });
        }
      } else if (txn.type === 'FAX') {
        const dataVerifiedItems = ['Member ID', 'Patient Name', 'Plan Name', 'Effective Date', 'Coverage', 'Deductible', 'Annual Maximum'];
        for (const item of dataVerifiedItems) {
          await db.insert(transactionDataVerified).values({
            transactionId: insertedTxn.id,
            item
          });
        }
      } else if (txn.type === 'CALL') {
        const dataVerifiedItems = ['Eligibility', 'Benefits', 'Coverage Limits', 'Deductibles'];
        for (const item of dataVerifiedItems) {
          await db.insert(transactionDataVerified).values({
            transactionId: insertedTxn.id,
            item
          });
        }

        // Add call communications for the CALL transaction
        const callComms = [
          {
            transactionId: insertedTxn.id,
            timestamp: '10:45:22',
            speaker: 'AI' as const,
            message: 'Good morning, this is Smith Dental verification system. I am calling to verify dental insurance benefits for patient test01lee.',
            type: 'question' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:45:35',
            speaker: 'InsuranceRep' as const,
            message: 'Good morning, this is Amanda from Cigna Dental. I can help you with that. May I have the member ID or policy number?',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:45:50',
            speaker: 'AI' as const,
            message: 'Thank you. The member ID is CIG-4567890 and the patient date of birth is March 15, 1990.',
            type: 'confirmation' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:46:10',
            speaker: 'InsuranceRep' as const,
            message: 'I have test01lee in our system. Policy is active and in good standing. What information do you need to verify?',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:46:25',
            speaker: 'AI' as const,
            message: 'We need a comprehensive benefits verification. Can you confirm the policy effective dates and annual maximum?',
            type: 'question' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:46:45',
            speaker: 'InsuranceRep' as const,
            message: 'Policy effective dates are January 1, 2025 through December 31, 2026. Annual maximum is $2,000 per calendar year.',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:47:05',
            speaker: 'AI' as const,
            message: 'How much of the annual maximum has been used?',
            type: 'question' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:47:20',
            speaker: 'InsuranceRep' as const,
            message: 'None has been used. The full $2,000 is still available.',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:47:35',
            speaker: 'AI' as const,
            message: 'What is the individual deductible?',
            type: 'question' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:47:50',
            speaker: 'InsuranceRep' as const,
            message: 'Individual deductible is $50 per calendar year and has not been met.',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:48:10',
            speaker: 'AI' as const,
            message: 'Can you provide coverage percentages for preventive, basic, and major services?',
            type: 'question' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:48:35',
            speaker: 'InsuranceRep' as const,
            message: 'Preventive is covered at 100% with no deductible. Basic is 80% after deductible. Major is 50% after deductible.',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:49:00',
            speaker: 'AI' as const,
            message: 'Thank you. Let me confirm: Policy active through 12/31/2026, annual max $2,000 (unused), deductible $50 (not met), Preventive 100%, Basic 80%, Major 50%. Is that correct?',
            type: 'confirmation' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:49:20',
            speaker: 'InsuranceRep' as const,
            message: 'Yes, that is absolutely correct. Is there anything else you need?',
            type: 'answer' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:49:35',
            speaker: 'AI' as const,
            message: 'No, that covers everything we needed. Thank you for your assistance.',
            type: 'confirmation' as const
          },
          {
            transactionId: insertedTxn.id,
            timestamp: '10:49:45',
            speaker: 'System' as const,
            message: 'Call completed successfully. All required information verified. Status: SUCCESS',
            type: 'note' as const
          }
        ];

        for (const comm of callComms) {
          await db.insert(callCommunications).values(comm);
        }
      } else if (txn.type === 'SAVE') {
        const dataVerifiedItems = ['Verified Data', 'Insurance Benefits', 'Coverage Details', 'Deductible Info', 'Eligibility Status'];
        for (const item of dataVerifiedItems) {
          await db.insert(transactionDataVerified).values({
            transactionId: insertedTxn.id,
            item
          });
        }
      }
    }

  } catch (error) {
    throw error;
  }
}

// Run seeding if this file is executed directly
seedTransactions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
