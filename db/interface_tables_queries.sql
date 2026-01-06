-- ============================================================================
-- Interface Tables - Common Queries & Maintenance
-- ============================================================================
-- Purpose: Useful SQL queries for working with interface tables
-- ============================================================================

-- ============================================================================
-- DATA VERIFICATION QUERIES
-- ============================================================================

-- Check total records in each interface table
SELECT
    'if_call_transaction_list' as table_name,
    COUNT(*) as record_count
FROM if_call_transaction_list
UNION ALL
SELECT
    'if_call_coverage_code_list',
    COUNT(*)
FROM if_call_coverage_code_list
UNION ALL
SELECT
    'if_call_message_list',
    COUNT(*)
FROM if_call_message_list;

-- Check recent transactions (last 24 hours)
SELECT
    id,
    transaction_id,
    patient_name,
    insurance_provider,
    status,
    start_time,
    created_at
FROM if_call_transaction_list
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check transaction status distribution
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM if_call_transaction_list
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- DETAILED TRANSACTION QUERIES
-- ============================================================================

-- Get complete transaction details with all related records
SELECT
    t.id,
    t.transaction_id,
    t.patient_name,
    t.insurance_provider,
    t.status,
    t.start_time,
    t.end_time,
    t.duration,
    COUNT(DISTINCT c.id) as coverage_codes_count,
    COUNT(DISTINCT m.id) as messages_count
FROM if_call_transaction_list t
LEFT JOIN if_call_coverage_code_list c ON c.if_call_transaction_id = t.id
LEFT JOIN if_call_message_list m ON m.if_call_transaction_id = t.id
GROUP BY t.id, t.transaction_id, t.patient_name, t.insurance_provider,
         t.status, t.start_time, t.end_time, t.duration
ORDER BY t.created_at DESC;

-- Get transaction with all messages (conversation flow)
SELECT
    t.transaction_id,
    t.patient_name,
    t.insurance_provider,
    m.timestamp,
    m.speaker,
    m.type,
    m.message
FROM if_call_transaction_list t
INNER JOIN if_call_message_list m ON m.if_call_transaction_id = t.id
WHERE t.transaction_id = 'YOUR_TRANSACTION_ID'  -- Replace with actual transaction_id
ORDER BY m.timestamp;

-- Get transaction with all coverage codes
SELECT
    t.transaction_id,
    t.patient_name,
    c.sai_code,
    c.ref_ins_code,
    c.category,
    c.field_name,
    c.verified,
    c.verified_by,
    c.coverage_data
FROM if_call_transaction_list t
INNER JOIN if_call_coverage_code_list c ON c.if_call_transaction_id = t.id
WHERE t.transaction_id = 'YOUR_TRANSACTION_ID'  -- Replace with actual transaction_id
ORDER BY c.category, c.sai_code;

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Average call duration by status
SELECT
    status,
    COUNT(*) as call_count,
    AVG(CAST(NULLIF(duration, '') AS NUMERIC)) as avg_duration_seconds
FROM if_call_transaction_list
WHERE duration IS NOT NULL AND duration != ''
GROUP BY status
ORDER BY call_count DESC;

-- Top insurance providers by call volume
SELECT
    insurance_provider,
    COUNT(*) as call_count,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_calls,
    ROUND(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM if_call_transaction_list
WHERE insurance_provider IS NOT NULL
GROUP BY insurance_provider
ORDER BY call_count DESC
LIMIT 10;

-- Daily transaction volume (last 30 days)
SELECT
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial
FROM if_call_transaction_list
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Coverage code verification rate
SELECT
    category,
    COUNT(*) as total_codes,
    SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified_codes,
    ROUND(SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as verification_rate
FROM if_call_coverage_code_list
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total_codes DESC;

-- Message type distribution
SELECT
    speaker,
    type,
    COUNT(*) as message_count
FROM if_call_message_list
GROUP BY speaker, type
ORDER BY speaker, message_count DESC;

-- ============================================================================
-- SEARCH QUERIES
-- ============================================================================

-- Search transactions by patient name
SELECT
    id,
    transaction_id,
    patient_name,
    insurance_provider,
    status,
    start_time
FROM if_call_transaction_list
WHERE patient_name ILIKE '%PATIENT_NAME%'  -- Replace with search term
ORDER BY created_at DESC;

-- Search transactions by date range
SELECT
    id,
    transaction_id,
    patient_name,
    insurance_provider,
    status,
    start_time,
    created_at
FROM if_call_transaction_list
WHERE created_at BETWEEN 'START_DATE'::timestamp AND 'END_DATE'::timestamp  -- Replace with dates
ORDER BY created_at DESC;

-- Search for specific procedure codes
SELECT
    t.transaction_id,
    t.patient_name,
    c.sai_code,
    c.category,
    c.verified
FROM if_call_transaction_list t
INNER JOIN if_call_coverage_code_list c ON c.if_call_transaction_id = t.id
WHERE c.sai_code = 'CODE'  -- Replace with procedure code
ORDER BY t.created_at DESC;

-- ============================================================================
-- EXPORT QUERIES
-- ============================================================================

-- Export transaction summary for external system
SELECT
    transaction_id,
    request_id,
    patient_id,
    patient_name,
    insurance_provider,
    status,
    start_time,
    end_time,
    duration,
    insurance_rep,
    created_at
FROM if_call_transaction_list
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Export coverage data for billing integration
SELECT
    t.transaction_id,
    t.patient_name,
    t.insurance_provider,
    c.sai_code,
    c.ref_ins_code,
    c.category,
    c.field_name,
    c.pre_step_value,
    c.verified,
    c.coverage_data
FROM if_call_transaction_list t
INNER JOIN if_call_coverage_code_list c ON c.if_call_transaction_id = t.id
WHERE t.status = 'SUCCESS'
    AND c.verified = true
ORDER BY t.created_at DESC;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Check for orphaned coverage codes (shouldn't exist with CASCADE)
SELECT c.*
FROM if_call_coverage_code_list c
LEFT JOIN if_call_transaction_list t ON t.id = c.if_call_transaction_id
WHERE t.id IS NULL;

-- Check for orphaned messages (shouldn't exist with CASCADE)
SELECT m.*
FROM if_call_message_list m
LEFT JOIN if_call_transaction_list t ON t.id = m.if_call_transaction_id
WHERE t.id IS NULL;

-- Get table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'if_call%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename LIKE 'if_call%'
ORDER BY idx_scan DESC;

-- ============================================================================
-- DATA CLEANUP QUERIES (USE WITH CAUTION)
-- ============================================================================

-- Delete transactions older than X days
-- WARNING: This will CASCADE DELETE all related coverage codes and messages
-- DELETE FROM if_call_transaction_list
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete failed transactions older than X days
-- DELETE FROM if_call_transaction_list
-- WHERE status = 'FAILED'
--     AND created_at < NOW() - INTERVAL '30 days';

-- Archive old transactions (create archive table first)
-- INSERT INTO if_call_transaction_list_archive
-- SELECT * FROM if_call_transaction_list
-- WHERE created_at < NOW() - INTERVAL '365 days';

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Check for missing indexes (slow queries)
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename LIKE 'if_call%'
    AND n_distinct > 100
ORDER BY tablename, attname;

-- Check for table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE tablename LIKE 'if_call%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- END OF QUERIES
-- ============================================================================
