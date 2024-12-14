# Migration Guide

## Database Schema Analysis

### Tables and Relationships

1. **Sessions Table** (Partitioned)
   - Primary Key: id (uuid)
   - Foreign Key: user_id → auth.users(id)
   - Partitioned by: status (active, archived, deleted)
   - Uses enums: session_language, session_level, session_status
   - Indexes:
     * sessions_active_user_id_idx
     * sessions_active_last_accessed_idx
     * sessions_archived_user_id_idx
     * sessions_archived_last_accessed_idx

2. **Messages Table**
   - Primary Key: id (uuid)
   - Foreign Key: session_id → sessions(id)
   - Foreign Key: user_id → auth.users(id)
   - Uses enum: message_type
   - Indexes:
     * messages_session_id_idx
     * messages_sequence_number_idx
     * messages_content_search_idx

3. **Message Feedback Table**
   - Primary Key: id (uuid)
   - Foreign Key: message_id → messages(id)
   - Constraints: Score ranges (0-100)
   - Indexes:
     * message_feedback_message_id_idx
     * message_feedback_created_at_idx

4. **Materialized Views**
   - session_stats: Pre-calculated session statistics
   - Index: session_stats_user_status_idx

### Enums

1. session_language: 'en', 'es', 'fr', 'de'
2. session_level: 'beginner', 'intermediate', 'advanced'
3. session_status: 'active', 'archived', 'deleted'
4. message_type: 'text', 'audio', 'system'

## Migration Steps

1. **Backup Existing Data**
   ```sql
   -- Export existing data (using psql)
   \copy (SELECT * FROM sessions) TO 'sessions_backup.csv' WITH CSV HEADER;
   \copy (SELECT * FROM messages) TO 'messages_backup.csv' WITH CSV HEADER;
   ```

2. **Create Enums**
   ```sql
   -- Run Phase 1 migration first
   psql -f 20240101000000_phase1_improvements.sql
   ```

3. **Verify Enum Creation**
   ```sql
   -- Check if enums exist
   SELECT typname, enumlabels 
   FROM pg_type 
   JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid;
   ```

4. **Create Message Feedback Table**
   - Ensure the table is created from Phase 1
   - Verify constraints and indexes

5. **Create Partitioned Sessions Table**
   ```sql
   -- Run Phase 5 migration
   psql -f 20240102000000_phase5_improvements.sql
   ```

6. **Verify Data Migration**
   ```sql
   -- Check record counts
   SELECT COUNT(*) FROM sessions;
   SELECT COUNT(*) FROM sessions_partitioned;
   
   -- Check partition distribution
   SELECT tableoid::regclass, COUNT(*) 
   FROM sessions_partitioned 
   GROUP BY tableoid;
   ```

7. **Create Materialized Views**
   ```sql
   -- Refresh materialized view
   REFRESH MATERIALIZED VIEW CONCURRENTLY session_stats;
   
   -- Verify stats
   SELECT * FROM session_stats LIMIT 5;
   ```

8. **Set Up RLS Policies**
   ```sql
   -- Verify RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Test policies
   SET request.jwt.claim.sub = 'test-user-id';
   SELECT * FROM sessions LIMIT 1;
   ```

9. **Create Indexes**
   ```sql
   -- Verify indexes
   SELECT 
       schemaname,
       tablename,
       indexname,
       indexdef
   FROM pg_indexes
   WHERE schemaname = 'public';
   ```

10. **Test Full-Text Search**
    ```sql
    -- Test search function
    SELECT * FROM search_messages('test query', NULL, 'test-user-id');
    ```

## Rollback Plan

1. **Keep Backup Tables**
   ```sql
   -- Create backup tables before migration
   CREATE TABLE sessions_backup AS SELECT * FROM sessions;
   CREATE TABLE messages_backup AS SELECT * FROM messages;
   ```

2. **Rollback Procedure**
   ```sql
   -- If needed, restore from backups
   DROP TABLE sessions CASCADE;
   ALTER TABLE sessions_backup RENAME TO sessions;
   -- Recreate indexes and constraints
   ```

## Post-Migration Verification

1. **Data Integrity**
   - Verify record counts match
   - Check referential integrity
   - Validate enum values

2. **Performance**
   - Test common queries
   - Verify index usage
   - Check materialized view refresh times

3. **Security**
   - Test RLS policies
   - Verify user access controls
   - Check backup procedures

4. **Monitoring**
   - Set up alerts for partition sizes
   - Monitor materialized view refresh performance
   - Track full-text search performance

## Notes

- The migration preserves all existing data
- New partitioning improves query performance
- Materialized views provide efficient statistics
- Full-text search enables message content search
- Automatic archiving helps manage old sessions
