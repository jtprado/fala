-- Create partitioned sessions table
CREATE TABLE public.sessions_partitioned (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null references auth.users(id),
    title text not null default 'New Chat Session',
    last_message_at timestamptz default now(),
    last_accessed_at timestamptz default now(),
    status public.session_status not null default 'active',
    language public.session_language not null default 'en',
    level public.session_level not null default 'beginner',
    created_at timestamptz default now()
) PARTITION BY LIST (status);

-- Create partitions for different session statuses
CREATE TABLE public.sessions_active 
    PARTITION OF public.sessions_partitioned 
    FOR VALUES IN ('active');

CREATE TABLE public.sessions_archived 
    PARTITION OF public.sessions_partitioned 
    FOR VALUES IN ('archived');

CREATE TABLE public.sessions_deleted 
    PARTITION OF public.sessions_partitioned 
    FOR VALUES IN ('deleted');

-- Create indexes on partitions for better query performance
CREATE INDEX sessions_active_user_id_idx ON public.sessions_active(user_id);
CREATE INDEX sessions_active_last_accessed_idx ON public.sessions_active(last_accessed_at DESC);

CREATE INDEX sessions_archived_user_id_idx ON public.sessions_archived(user_id);
CREATE INDEX sessions_archived_last_accessed_idx ON public.sessions_archived(last_accessed_at DESC);

-- Create materialized view for session statistics
CREATE MATERIALIZED VIEW public.session_stats AS
SELECT 
    user_id,
    status,
    COUNT(*) as session_count,
    MAX(last_accessed_at) as last_activity,
    COUNT(DISTINCT language) as languages_used,
    COUNT(DISTINCT level) as levels_used
FROM public.sessions_partitioned
GROUP BY user_id, status
WITH DATA;

-- Create index on materialized view
CREATE UNIQUE INDEX session_stats_user_status_idx ON public.session_stats(user_id, status);

-- Create function to refresh session stats
CREATE OR REPLACE FUNCTION refresh_session_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.session_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh stats on changes
CREATE TRIGGER refresh_session_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sessions_partitioned
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_session_stats();

-- Create function to archive old sessions
CREATE OR REPLACE FUNCTION archive_old_sessions(days_threshold integer)
RETURNS integer AS $$
DECLARE
    archived_count integer;
BEGIN
    WITH updated_sessions AS (
        UPDATE public.sessions_partitioned
        SET status = 'archived'
        WHERE status = 'active'
        AND last_accessed_at < NOW() - (days_threshold || ' days')::interval
        RETURNING id
    )
    SELECT COUNT(*) INTO archived_count
    FROM updated_sessions;

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create migration function to move data from old to new table
CREATE OR REPLACE FUNCTION migrate_sessions_to_partitioned()
RETURNS void AS $$
BEGIN
    -- Insert data from old sessions table to new partitioned table
    INSERT INTO public.sessions_partitioned
    SELECT * FROM public.sessions;

    -- Verify data migration
    IF (
        SELECT COUNT(*) FROM public.sessions
    ) = (
        SELECT COUNT(*) FROM public.sessions_partitioned
    ) THEN
        -- Drop old table and rename new one
        DROP TABLE public.sessions CASCADE;
        ALTER TABLE public.sessions_partitioned RENAME TO sessions;
    ELSE
        RAISE EXCEPTION 'Data migration verification failed';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for partitioned table
ALTER TABLE public.sessions_partitioned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.sessions_partitioned FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.sessions_partitioned FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.sessions_partitioned FOR UPDATE
USING (auth.uid() = user_id);

-- Execute migration
SELECT migrate_sessions_to_partitioned();

-- Create a view for active sessions to simplify queries
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT * FROM public.sessions
WHERE status = 'active'
ORDER BY last_accessed_at DESC;

COMMENT ON VIEW public.active_sessions IS 
'View for accessing only active sessions, ordered by last access time';

-- Add comments for documentation
COMMENT ON TABLE public.sessions IS 
'Partitioned table storing all chat sessions with separate partitions for active, archived, and deleted sessions';

COMMENT ON MATERIALIZED VIEW public.session_stats IS 
'Materialized view containing pre-calculated session statistics per user and status';

COMMENT ON FUNCTION archive_old_sessions IS 
'Function to automatically archive sessions that have not been accessed for a specified number of days';

-- Create index for message search
CREATE INDEX messages_content_search_idx ON public.messages 
USING gin(to_tsvector('english', content));

-- Add function for full-text message search
CREATE OR REPLACE FUNCTION search_messages(
    search_query text,
    session_id_param uuid DEFAULT NULL,
    user_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    session_id uuid,
    content text,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.session_id,
        m.content,
        ts_rank(to_tsvector('english', m.content), to_tsquery('english', search_query)) as rank
    FROM public.messages m
    JOIN public.sessions s ON s.id = m.session_id
    WHERE 
        to_tsvector('english', m.content) @@ to_tsquery('english', search_query)
        AND (session_id_param IS NULL OR m.session_id = session_id_param)
        AND (user_id_param IS NULL OR s.user_id = user_id_param)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
