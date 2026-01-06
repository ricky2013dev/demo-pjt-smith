-- ============================================================================
-- Interface Tables for External System Integration
-- ============================================================================
-- Purpose: These tables store snapshots of CALL transaction data for
--          integration with external systems (PMS, billing, etc.)
--
-- Important: These tables are independent copies with NO foreign key
--           constraints to the main transactions table, ensuring data
--           persistence even if source transactions are deleted.
-- ============================================================================

-- Drop tables if they exist (reverse order due to foreign keys)
DROP TABLE IF EXISTS if_call_message_list CASCADE;
DROP TABLE IF EXISTS if_call_coverage_code_list CASCADE;
DROP TABLE IF EXISTS if_call_transaction_list CASCADE;

-- ============================================================================
-- Table 1: if_call_transaction_list
-- ============================================================================
-- Purpose: Main interface table storing CALL transaction snapshots
-- Contains: Patient info, insurance details, call metadata
-- HIPAA Sensitive: policyNumber, groupNumber, subscriberId (encrypted)
-- ============================================================================

CREATE TABLE if_call_transaction_list (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Transaction References (NO FK constraints - independent copy)
    transaction_id VARCHAR NOT NULL,
    request_id VARCHAR NOT NULL,
    patient_id VARCHAR NOT NULL,

    -- Patient Information
    patient_name TEXT NOT NULL,

    -- Insurance Information
    insurance_provider TEXT,
    policy_number TEXT,      -- ENCRYPTED - HIPAA sensitive
    group_number TEXT,        -- ENCRYPTED - HIPAA sensitive
    subscriber_id TEXT,       -- ENCRYPTED - HIPAA sensitive
    phone_number TEXT,

    -- Call Timing
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration TEXT,

    -- Status and Results
    status TEXT NOT NULL,     -- 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'Waiting'
    insurance_rep TEXT,
    transcript TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_if_call_transaction_transaction_id ON if_call_transaction_list(transaction_id);
CREATE INDEX idx_if_call_transaction_patient_id ON if_call_transaction_list(patient_id);
CREATE INDEX idx_if_call_transaction_request_id ON if_call_transaction_list(request_id);
CREATE INDEX idx_if_call_transaction_status ON if_call_transaction_list(status);
CREATE INDEX idx_if_call_transaction_created_at ON if_call_transaction_list(created_at);

-- Comments
COMMENT ON TABLE if_call_transaction_list IS 'Interface table storing CALL transaction snapshots for external system integration';
COMMENT ON COLUMN if_call_transaction_list.transaction_id IS 'Reference to original transaction (no FK - independent copy)';
COMMENT ON COLUMN if_call_transaction_list.policy_number IS 'Encrypted - HIPAA sensitive';
COMMENT ON COLUMN if_call_transaction_list.group_number IS 'Encrypted - HIPAA sensitive';
COMMENT ON COLUMN if_call_transaction_list.subscriber_id IS 'Encrypted - HIPAA sensitive';

-- ============================================================================
-- Table 2: if_call_coverage_code_list
-- ============================================================================
-- Purpose: Coverage code data snapshots from CALL transactions
-- Contains: Procedure codes, coverage details, verification status
-- Relationship: Many-to-one with if_call_transaction_list (CASCADE DELETE)
-- ============================================================================

CREATE TABLE if_call_coverage_code_list (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key (CASCADE DELETE)
    if_call_transaction_id VARCHAR NOT NULL,

    -- Procedure Codes
    sai_code TEXT,
    ref_ins_code TEXT,
    category TEXT,
    field_name TEXT,

    -- Coverage Data
    pre_step_value TEXT,
    verified BOOLEAN,
    verified_by TEXT,
    coverage_data TEXT,       -- JSON string of complete coverage data

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign Key Constraint (CASCADE DELETE)
    CONSTRAINT fk_if_call_coverage_code_transaction
        FOREIGN KEY (if_call_transaction_id)
        REFERENCES if_call_transaction_list(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_if_call_coverage_code_transaction_id ON if_call_coverage_code_list(if_call_transaction_id);
CREATE INDEX idx_if_call_coverage_code_sai_code ON if_call_coverage_code_list(sai_code);
CREATE INDEX idx_if_call_coverage_code_category ON if_call_coverage_code_list(category);
CREATE INDEX idx_if_call_coverage_code_verified ON if_call_coverage_code_list(verified);

-- Comments
COMMENT ON TABLE if_call_coverage_code_list IS 'Coverage code data snapshots from CALL transactions';
COMMENT ON COLUMN if_call_coverage_code_list.coverage_data IS 'JSON string of complete coverage data';

-- ============================================================================
-- Table 3: if_call_message_list
-- ============================================================================
-- Purpose: Call communication history from AI call center
-- Contains: Conversation transcript, speaker identification, message types
-- Relationship: Many-to-one with if_call_transaction_list (CASCADE DELETE)
-- ============================================================================

CREATE TABLE if_call_message_list (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key (CASCADE DELETE)
    if_call_transaction_id VARCHAR NOT NULL,

    -- Message Data
    timestamp TEXT NOT NULL,
    speaker TEXT NOT NULL,    -- 'AI' | 'InsuranceRep' | 'System'
    message TEXT NOT NULL,
    type TEXT NOT NULL,       -- 'question' | 'answer' | 'confirmation' | 'hold' | 'transfer' | 'note'

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    -- Foreign Key Constraint (CASCADE DELETE)
    CONSTRAINT fk_if_call_message_transaction
        FOREIGN KEY (if_call_transaction_id)
        REFERENCES if_call_transaction_list(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_if_call_message_transaction_id ON if_call_message_list(if_call_transaction_id);
CREATE INDEX idx_if_call_message_speaker ON if_call_message_list(speaker);
CREATE INDEX idx_if_call_message_type ON if_call_message_list(type);
CREATE INDEX idx_if_call_message_created_at ON if_call_message_list(created_at);

-- Comments
COMMENT ON TABLE if_call_message_list IS 'Call communication history from AI call center';
COMMENT ON COLUMN if_call_message_list.speaker IS 'AI | InsuranceRep | System';
COMMENT ON COLUMN if_call_message_list.type IS 'question | answer | confirmation | hold | transfer | note';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables were created successfully
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name LIKE 'if_call%'
ORDER BY table_name;

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'if_call%'
ORDER BY tablename, indexname;

-- Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'if_call%'
ORDER BY tc.table_name;

-- ============================================================================
-- Grant Permissions (adjust as needed for your production environment)
-- ============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_transaction_list TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_coverage_code_list TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_message_list TO your_app_user;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
