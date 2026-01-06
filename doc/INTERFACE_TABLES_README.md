# Interface Tables - Production Deployment Guide

## Overview

The interface tables are designed for external system integration (PMS, billing systems, etc.). They store snapshots of CALL transaction data independently from the main transaction tables.

## Key Features

- **Independent Storage**: No foreign key constraints to main transactions table
- **Data Persistence**: Data remains even if source transactions are deleted
- **HIPAA Compliant**: Encrypted sensitive fields (policy numbers, group numbers, subscriber IDs)
- **CASCADE Delete**: Child records automatically deleted when parent interface transaction is removed
- **Optimized Indexes**: Performance indexes on commonly queried columns

## Tables Structure

### 1. if_call_transaction_list
**Main interface table** storing CALL transaction snapshots.

**Key Fields:**
- Transaction identifiers (transaction_id, request_id, patient_id)
- Patient information (name)
- Insurance details (provider, encrypted policy/group/subscriber IDs)
- Call metadata (timing, duration, status, representative)
- Transcript

**HIPAA Sensitive (Encrypted):**
- `policy_number`
- `group_number`
- `subscriber_id`

### 2. if_call_coverage_code_list
**Coverage code data** from verification calls.

**Key Fields:**
- Procedure codes (SAI code, insurance reference code)
- Category and field information
- Verification status and user
- Coverage data (JSON format)

**Relationship:** Many-to-one with `if_call_transaction_list` (CASCADE DELETE)

### 3. if_call_message_list
**Call conversation history** from AI call center.

**Key Fields:**
- Message timestamp and content
- Speaker identification (AI, InsuranceRep, System)
- Message type (question, answer, confirmation, hold, transfer, note)

**Relationship:** Many-to-one with `if_call_transaction_list` (CASCADE DELETE)

## Deployment Instructions

### Step 1: Review SQL Script

Open and review: `interface_tables_production.sql`

```bash
# Review the script
cat db/interface_tables_production.sql
```

### Step 2: Connect to Production Database

```bash
# Example connection strings:

# Using psql
psql "postgresql://user:password@host:port/database?sslmode=require"

# Using connection parameters
psql -h host -p port -U user -d database
```

### Step 3: Execute Creation Script

```sql
-- Run the entire script
\i db/interface_tables_production.sql

-- OR copy-paste the contents into your SQL client
```

### Step 4: Verify Tables Created

```sql
-- Check tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name LIKE 'if_call%'
ORDER BY table_name;

-- Expected output:
-- if_call_coverage_code_list | BASE TABLE
-- if_call_message_list        | BASE TABLE
-- if_call_transaction_list    | BASE TABLE
```

### Step 5: Verify Indexes

```sql
-- Check indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename LIKE 'if_call%'
ORDER BY tablename, indexname;

-- Expected: 13+ indexes across the three tables
```

### Step 6: Grant Permissions

Adjust based on your production environment:

```sql
-- Grant to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_transaction_list TO your_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_coverage_code_list TO your_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_message_list TO your_app_user;

-- Grant to read-only reporting user (optional)
GRANT SELECT ON if_call_transaction_list TO reporting_user;
GRANT SELECT ON if_call_coverage_code_list TO reporting_user;
GRANT SELECT ON if_call_message_list TO reporting_user;
```

### Step 7: Test with Sample Data (Optional)

```sql
-- Insert test transaction
INSERT INTO if_call_transaction_list (
    transaction_id,
    request_id,
    patient_id,
    patient_name,
    insurance_provider,
    status,
    start_time
) VALUES (
    'test-001',
    'req-001',
    'patient-001',
    'Test Patient',
    'Test Insurance Co',
    'SUCCESS',
    '2025-01-30 10:00:00'
) RETURNING id;

-- Insert test coverage code (use ID from above)
INSERT INTO if_call_coverage_code_list (
    if_call_transaction_id,
    sai_code,
    category,
    verified
) VALUES (
    'ID_FROM_PREVIOUS_INSERT',
    'D0120',
    'Preventive',
    true
);

-- Verify cascade delete works
DELETE FROM if_call_transaction_list WHERE transaction_id = 'test-001';

-- Should return 0 (coverage code was deleted too)
SELECT COUNT(*) FROM if_call_coverage_code_list WHERE if_call_transaction_id = 'ID_FROM_PREVIOUS_INSERT';
```

## Common Operations

### Using Provided Query File

The `interface_tables_queries.sql` file contains useful queries for:

1. **Data Verification**: Check record counts, recent transactions
2. **Analytics**: Success rates, call volumes, verification rates
3. **Search**: Find transactions by patient, date, procedure codes
4. **Export**: Generate data for external systems
5. **Maintenance**: Check orphaned records, table sizes, index usage
6. **Monitoring**: Performance metrics, table bloat

### Quick Reference Queries

**Get all transactions from last 24 hours:**
```sql
SELECT * FROM if_call_transaction_list
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Get transaction with full conversation:**
```sql
SELECT
    t.patient_name,
    m.timestamp,
    m.speaker,
    m.message
FROM if_call_transaction_list t
JOIN if_call_message_list m ON m.if_call_transaction_id = t.id
WHERE t.transaction_id = 'YOUR_TRANSACTION_ID'
ORDER BY m.timestamp;
```

**Check success rate:**
```sql
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM if_call_transaction_list
GROUP BY status;
```

## Maintenance

### Regular Maintenance Tasks

1. **Monitor Table Growth**
   ```sql
   SELECT
       tablename,
       pg_size_pretty(pg_total_relation_size('if_call_' || tablename)) AS size
   FROM pg_tables
   WHERE tablename LIKE 'if_call%';
   ```

2. **Check Index Usage**
   ```sql
   SELECT tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE tablename LIKE 'if_call%'
   ORDER BY idx_scan DESC;
   ```

3. **Archive Old Data** (if needed)
   ```sql
   -- Create archive table first (same structure)
   -- Then move old records
   INSERT INTO if_call_transaction_list_archive
   SELECT * FROM if_call_transaction_list
   WHERE created_at < NOW() - INTERVAL '365 days';
   ```

### Backup Recommendations

```bash
# Backup interface tables only
pg_dump -h host -U user -d database \
  -t if_call_transaction_list \
  -t if_call_coverage_code_list \
  -t if_call_message_list \
  > interface_tables_backup_$(date +%Y%m%d).sql

# Restore
psql -h host -U user -d database < interface_tables_backup_YYYYMMDD.sql
```

## Troubleshooting

### Issue: Tables Already Exist

**Error:** `relation "if_call_transaction_list" already exists`

**Solution:**
```sql
-- Option 1: Drop and recreate (CAUTION: deletes all data)
DROP TABLE IF EXISTS if_call_message_list CASCADE;
DROP TABLE IF EXISTS if_call_coverage_code_list CASCADE;
DROP TABLE IF EXISTS if_call_transaction_list CASCADE;
-- Then run creation script

-- Option 2: Check if tables are correctly structured
\d if_call_transaction_list
```

### Issue: Foreign Key Constraint Errors

**Error:** Foreign key constraint violation

**Solution:**
- Ensure parent transaction exists before inserting child records
- Check CASCADE DELETE is working properly
- Verify foreign key constraints were created:
  ```sql
  SELECT constraint_name, table_name
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_name LIKE 'if_call%';
  ```

### Issue: Slow Query Performance

**Solution:**
1. Check indexes exist and are being used
2. Run ANALYZE on tables:
   ```sql
   ANALYZE if_call_transaction_list;
   ANALYZE if_call_coverage_code_list;
   ANALYZE if_call_message_list;
   ```
3. Check query plans:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM if_call_transaction_list WHERE status = 'SUCCESS';
   ```

## Security Considerations

1. **Encrypted Fields**: `policy_number`, `group_number`, `subscriber_id` are stored encrypted
2. **Access Control**: Grant minimum necessary permissions to application users
3. **Audit Trail**: All records include `created_at` timestamp
4. **HIPAA Compliance**: Do not log or expose sensitive data in plain text

## Integration with Application

The application automatically populates these tables when CALL transactions are completed. The relevant code is in:

- **Backend**: `backend/routes.ts` (transaction save endpoints)
- **Schema**: `shared/schema.ts` (table definitions)
- **Storage**: `backend/storage.ts` (database operations)

## Support

For issues or questions:
- Review `doc/README.md` for system documentation
- Check `interface_tables_queries.sql` for common operations
- Review application logs for integration errors

## Version History

- **2025-01-30**: Initial production SQL scripts created
- Includes all three interface tables with proper indexes and constraints
- Added comprehensive query collection for operations and maintenance
