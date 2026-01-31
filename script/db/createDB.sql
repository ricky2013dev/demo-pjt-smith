-- ============================================================
-- Project Smith - Database Schema
-- Dental Insurance Verification System
--
-- Run this file manually against your PostgreSQL database
-- to create the complete schema.
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f db/createDB.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Standalone tables (no foreign key dependencies)
-- ============================================================

-- Providers: Healthcare provider master list
CREATE TABLE IF NOT EXISTS providers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  npi_number TEXT NOT NULL UNIQUE,
  fax_number TEXT,
  phone_number TEXT,
  address TEXT,
  tax_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payers: Insurance payer/company master list
CREATE TABLE IF NOT EXISTS payers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payer_id TEXT NOT NULL UNIQUE,
  fax_number TEXT,
  phone_number TEXT
);

-- ============================================================
-- Users (depends on providers)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  stedi_mode TEXT NOT NULL DEFAULT 'mockup',
  provider_id VARCHAR REFERENCES providers(id)
);

-- ============================================================
-- Patients (depends on users)
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  given_name TEXT NOT NULL,
  middle_name TEXT,
  family_name TEXT NOT NULL,
  gender TEXT,
  birth_date TEXT,          -- Encrypted (HIPAA sensitive)
  ssn TEXT,                 -- Encrypted (HIPAA sensitive)
  clinic_patient_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Patient-related tables (depend on patients)
-- ============================================================

-- Patient contact information (phone/email)
CREATE TABLE IF NOT EXISTS patient_telecoms (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  system TEXT NOT NULL,     -- 'phone' | 'email'
  value TEXT NOT NULL
);

-- Patient addresses
CREATE TABLE IF NOT EXISTS patient_addresses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  line1 TEXT,               -- Encrypted (HIPAA sensitive)
  line2 TEXT,               -- Encrypted (HIPAA sensitive)
  city TEXT,                -- Encrypted (HIPAA sensitive)
  state TEXT,               -- Encrypted (HIPAA sensitive)
  postal_code TEXT          -- Encrypted (HIPAA sensitive)
);

-- Insurance policies
CREATE TABLE IF NOT EXISTS insurances (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  payer_id TEXT,            -- Stedi API payer ID
  employer_name TEXT,
  group_number TEXT,        -- Encrypted (HIPAA sensitive)
  subscriber_name TEXT,
  subscriber_id TEXT,       -- Encrypted (HIPAA sensitive)
  relationship TEXT,
  effective_date TEXT,
  expiration_date TEXT,
  deductible TEXT,
  deductible_met TEXT,
  max_benefit TEXT,
  preventive_coverage TEXT,
  basic_coverage TEXT,
  major_coverage TEXT
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,     -- 'scheduled' | 'completed' | 'cancelled'
  provider TEXT
);

-- Treatments
CREATE TABLE IF NOT EXISTS treatments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  cost TEXT
);

-- Coverage details (financial)
CREATE TABLE IF NOT EXISTS coverage_details (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  annual_maximum DECIMAL(10, 2),
  annual_used DECIMAL(10, 2),
  deductible DECIMAL(10, 2),
  deductible_met DECIMAL(10, 2)
);

-- Procedures (dental procedure coverage info)
CREATE TABLE IF NOT EXISTS procedures (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_id VARCHAR NOT NULL REFERENCES coverage_details(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,   -- 'Preventive' | 'Basic' | 'Major' | 'Orthodontic'
  coverage TEXT,
  estimated_cost TEXT,
  patient_pays TEXT
);

-- Verification workflow status
CREATE TABLE IF NOT EXISTS verification_statuses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fetch_pms TEXT NOT NULL,              -- 'completed' | 'in_progress' | 'pending'
  document_analysis TEXT NOT NULL DEFAULT 'pending',
  api_verification TEXT NOT NULL,
  call_center TEXT NOT NULL DEFAULT 'pending',
  ai_analysis_and_call TEXT NOT NULL,
  save_to_pms TEXT NOT NULL
);

-- AI call history
CREATE TABLE IF NOT EXISTS ai_call_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  summary TEXT,
  duration TEXT,
  agent TEXT,
  status TEXT NOT NULL      -- 'completed' | 'in_progress'
);

-- ============================================================
-- Transaction tables (depend on patients)
-- ============================================================

-- All verification transactions
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL,
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'FETCH' | 'API' | 'CALL' | 'FAX' | 'SAVE'
  method TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration TEXT,
  status TEXT NOT NULL,             -- 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting'
  patient_name TEXT NOT NULL,
  insurance_provider TEXT,
  insurance_rep TEXT,
  run_by TEXT,
  verification_score INTEGER,
  fetch_status TEXT,
  save_status TEXT,
  response_code TEXT,
  endpoint TEXT,
  phone_number TEXT,
  error_message TEXT,
  eligibility_check TEXT,
  benefits_verification TEXT,
  coverage_details TEXT,
  deductible_info TEXT,
  transcript TEXT,
  raw_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Call communications (conversation transcripts)
CREATE TABLE IF NOT EXISTS call_communications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  speaker TEXT NOT NULL,            -- 'AI' | 'InsuranceRep' | 'System'
  message TEXT NOT NULL,
  type TEXT NOT NULL                -- 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note'
);

-- Transaction data verified items
CREATE TABLE IF NOT EXISTS transaction_data_verified (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item TEXT NOT NULL
);

-- ============================================================
-- Coverage by code (depends on patients, users)
-- ============================================================

CREATE TABLE IF NOT EXISTS coverage_by_code (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sai_code TEXT,
  ref_ins_code TEXT,
  category TEXT,
  field_name TEXT,
  pre_step_value TEXT,
  verified BOOLEAN,
  verified_by TEXT,
  comments TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  coverage_data TEXT        -- JSON string of complete coverage data
);

-- ============================================================
-- Interface tables (for external system integration)
-- ============================================================

-- Interface for CALL transactions (independent copy, no FK to transactions)
CREATE TABLE IF NOT EXISTS if_call_transaction_list (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR NOT NULL,
  request_id VARCHAR NOT NULL,
  patient_id VARCHAR NOT NULL,
  patient_name TEXT NOT NULL,
  insurance_provider TEXT,
  policy_number TEXT,       -- Encrypted (HIPAA sensitive)
  group_number TEXT,        -- Encrypted (HIPAA sensitive)
  subscriber_id TEXT,       -- Encrypted (HIPAA sensitive)
  phone_number TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration TEXT,
  status TEXT NOT NULL,     -- 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting'
  insurance_rep TEXT,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interface for coverage code data
CREATE TABLE IF NOT EXISTS if_call_coverage_code_list (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  if_call_transaction_id VARCHAR NOT NULL REFERENCES if_call_transaction_list(id) ON DELETE CASCADE,
  sai_code TEXT,
  ref_ins_code TEXT,
  category TEXT,
  field_name TEXT,
  pre_step_value TEXT,
  verified BOOLEAN,
  verified_by TEXT,
  coverage_data TEXT,       -- JSON string of complete coverage data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interface for call messages
CREATE TABLE IF NOT EXISTS if_call_message_list (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  if_call_transaction_id VARCHAR NOT NULL REFERENCES if_call_transaction_list(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  speaker TEXT NOT NULL,    -- 'AI' | 'InsuranceRep' | 'System'
  message TEXT NOT NULL,
  type TEXT NOT NULL,       -- 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note'
  created_at TIMESTAMP DEFAULT NOW()
);
