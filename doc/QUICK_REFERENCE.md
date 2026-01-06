# Interface Tables - Quick Reference Card

## 🚀 Quick Deploy (Production)

```bash
# 1. Connect to database
psql "postgresql://user:password@host:port/database?sslmode=require"

# 2. Execute creation script
\i db/interface_tables_production.sql

# 3. Verify tables created
\dt if_call*

# 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_transaction_list TO your_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_coverage_code_list TO your_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON if_call_message_list TO your_app_user;
```

## 📊 Quick Verification

```sql
-- Check record counts
SELECT 'if_call_transaction_list' as table, COUNT(*) FROM if_call_transaction_list
UNION ALL SELECT 'if_call_coverage_code_list', COUNT(*) FROM if_call_coverage_code_list
UNION ALL SELECT 'if_call_message_list', COUNT(*) FROM if_call_message_list;

-- Check recent activity (last 24h)
SELECT COUNT(*), status FROM if_call_transaction_list
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.' || tablename))
FROM pg_tables WHERE tablename LIKE 'if_call%';
```

## 🔍 Common Queries

```sql
-- Get latest 10 transactions
SELECT transaction_id, patient_name, status, created_at
FROM if_call_transaction_list
ORDER BY created_at DESC LIMIT 10;

-- Get transaction with messages
SELECT t.transaction_id, m.speaker, m.message
FROM if_call_transaction_list t
JOIN if_call_message_list m ON m.if_call_transaction_id = t.id
WHERE t.transaction_id = 'YOUR_ID'
ORDER BY m.timestamp;

-- Success rate by insurance provider
SELECT insurance_provider,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful
FROM if_call_transaction_list
GROUP BY insurance_provider
ORDER BY total DESC LIMIT 5;
```

## 🔧 Maintenance

```sql
-- Analyze tables (improves query performance)
ANALYZE if_call_transaction_list;
ANALYZE if_call_coverage_code_list;
ANALYZE if_call_message_list;

-- Check for orphaned records (should return 0)
SELECT COUNT(*) FROM if_call_coverage_code_list c
LEFT JOIN if_call_transaction_list t ON t.id = c.if_call_transaction_id
WHERE t.id IS NULL;

-- Vacuum tables (reclaim space)
VACUUM ANALYZE if_call_transaction_list;
VACUUM ANALYZE if_call_coverage_code_list;
VACUUM ANALYZE if_call_message_list;
```

## 💾 Backup & Restore

```bash
# Backup interface tables only
pg_dump -h host -U user -d database \
  -t if_call_transaction_list \
  -t if_call_coverage_code_list \
  -t if_call_message_list \
  -f interface_tables_$(date +%Y%m%d).sql

# Restore
psql -h host -U user -d database -f interface_tables_YYYYMMDD.sql
```

## ⚠️ Important Notes

### CASCADE DELETE Behavior
Deleting from `if_call_transaction_list` will automatically delete:
- All related records in `if_call_coverage_code_list`
- All related records in `if_call_message_list`

### HIPAA Sensitive Fields (Encrypted)
- `policy_number`
- `group_number`
- `subscriber_id`

### Table Relationships
```
if_call_transaction_list (parent)
    ├── if_call_coverage_code_list (child, CASCADE DELETE)
    └── if_call_message_list (child, CASCADE DELETE)
```

## 🚨 Troubleshooting

### Tables Already Exist
```sql
-- Drop all interface tables (CAUTION: deletes data!)
DROP TABLE IF EXISTS if_call_message_list CASCADE;
DROP TABLE IF EXISTS if_call_coverage_code_list CASCADE;
DROP TABLE IF EXISTS if_call_transaction_list CASCADE;
```

### Slow Queries
```sql
-- Check index usage
SELECT tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename LIKE 'if_call%'
ORDER BY idx_scan;

-- Analyze slow query
EXPLAIN ANALYZE
SELECT * FROM if_call_transaction_list WHERE status = 'SUCCESS';
```

### Check Foreign Keys
```sql
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name LIKE 'if_call%' AND constraint_type = 'FOREIGN KEY';
```

## 📁 File Locations

- **Creation Script**: `db/interface_tables_production.sql`
- **Query Collection**: `db/interface_tables_queries.sql`
- **Full Documentation**: `db/INTERFACE_TABLES_README.md`
- **This Guide**: `db/QUICK_REFERENCE.md`

## 🔗 Related Documentation

- Main Documentation: `doc/README.md`
- HIPAA Guide: `doc/HIPAA_SENSITIVE_DATA_GUIDE.md`

---
**Last Updated**: 2025-01-30
