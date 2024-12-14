# Supabase Migration Guide

## Overview

This guide details how to implement the database changes using Supabase's tools and interface. All migrations will be performed through the Supabase Dashboard SQL Editor.

## Pre-Migration Steps

1. **Backup Your Data**
   - Go to Supabase Dashboard > Project Settings > Database
   - Under "Database Backups", create a point-in-time backup
   - Note: Supabase automatically creates daily backups

2. **Access SQL Editor**
   - Navigate to Supabase Dashboard > SQL Editor
   - Create a new query or use an existing one

## Migration Steps

### Step 1: Create Enums and Initial Tables

1. Open SQL Editor in Supabase Dashboard
2. Create a new query and paste Phase 1 migration:
   ```sql
   -- Copy content from 20240101000000_phase1_improvements.sql
   ```
3. Run the query and verify in Table Editor:
   - Check "Enums" under Database
   - Verify message_feedback table creation
   - Confirm indexes are created

### Step 2: Verify Data Types

1. In Supabase Dashboard > Database:
   - Verify enum types are listed
   - Check table columns use correct types
   - Confirm constraints are applied

### Step 3: Implement Partitioning

1. Create new query in SQL Editor for Phase 5:
   ```sql
   -- Copy content from 20240102000000_phase5_improvements.sql
   ```
2. Run in smaller chunks if needed:
   - Create partitioned table
   - Create partitions
   - Add indexes
   - Create materialized view

### Step 4: Migrate Data

1. Use Supabase's SQL Editor:
   ```sql
   -- Run migration function
   SELECT migrate_sessions_to_partitioned();
   ```
2. Verify in Table Editor:
   - Check record counts
   - Verify data distribution across partitions

### Step 5: Set Up RLS Policies

1. Can be done via SQL Editor or Supabase Authentication Settings:
   - Navigate to Authentication > Policies
   - Or run RLS commands in SQL Editor
2. Test policies in SQL Editor:
   ```sql
   -- Test as authenticated user
   select * from sessions;
   select * from messages;
   select * from message_feedback;
   ```

## Verification Steps

1. **Database Structure**
   - Use Supabase Table Editor to verify:
     * Table schemas
     * Relationships
     * Indexes
     * Policies

2. **Data Integrity**
   - Run in SQL Editor:
   ```sql
   -- Check partition distribution
   SELECT tableoid::regclass, COUNT(*) 
   FROM sessions 
   GROUP BY tableoid;

   -- Verify message feedback
   SELECT COUNT(*) FROM message_feedback;
   ```

3. **Performance**
   - Use Supabase Dashboard > Database > Performance
   - Monitor query execution times
   - Check index usage

## Rollback Plan

1. **If Issues Occur During Migration**
   - Supabase maintains automatic backups
   - Go to Project Settings > Database > Backups
   - Restore from the pre-migration backup

2. **Manual Rollback**
   - Use SQL Editor:
   ```sql
   -- Drop new objects
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TYPE IF EXISTS session_language;
   DROP TYPE IF EXISTS session_level;
   DROP TYPE IF EXISTS session_status;
   DROP TYPE IF EXISTS message_type;
   
   -- Restore from backup if needed
   ```

## Post-Migration Tasks

1. **Update API Settings**
   - Review API settings in Supabase Dashboard
   - Update any affected API policies

2. **Monitor Performance**
   - Use Supabase Dashboard metrics
   - Monitor database size
   - Check query performance

3. **Update Documentation**
   - Update API documentation
   - Document new table structures
   - Note any changes in query patterns

## Notes

- All operations are performed through Supabase Dashboard
- No direct database access needed
- Supabase handles backup management
- RLS policies can be managed via UI or SQL
- Monitor usage in Supabase Dashboard

## Useful Supabase Links

- [Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Performance Monitoring](https://supabase.com/docs/guides/platform/performance)
- [SQL Editor Guide](https://supabase.com/docs/guides/database/sql-editor)

## Support

If issues occur during migration:
1. Check Supabase status page
2. Review Supabase logs
3. Contact Supabase support if needed
4. Reference migration files in this repository
