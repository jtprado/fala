-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.session_language AS ENUM ('en', 'es', 'fr', 'de');
CREATE TYPE public.session_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.session_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE public.message_type AS ENUM ('text', 'audio', 'system');

-- Create partitioned sessions table with composite primary key
CREATE TABLE public.sessions (
    id uuid DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    title text NOT NULL DEFAULT 'New Chat Session',
    last_message_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    status public.session_status NOT NULL DEFAULT 'active',
    language public.session_language NOT NULL DEFAULT 'en',
    level public.session_level NOT NULL DEFAULT 'beginner',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id, status)
) PARTITION BY LIST (status);

-- Create partitions
CREATE TABLE public.sessions_active
    PARTITION OF public.sessions
    FOR VALUES IN ('active');

CREATE TABLE public.sessions_archived
    PARTITION OF public.sessions
    FOR VALUES IN ('archived');

CREATE TABLE public.sessions_deleted
    PARTITION OF public.sessions
    FOR VALUES IN ('deleted');

-- Create messages table referencing the composite key
-- We add a "session_status" column to link properly
CREATE TABLE public.messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid NOT NULL,
    session_status public.session_status NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    type public.message_type NOT NULL,
    translation text,
    sequence_number bigint NOT NULL,
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (session_id, session_status) REFERENCES public.sessions(id, status) ON DELETE CASCADE
);

-- Create message_feedback table
CREATE TABLE public.message_feedback (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    pronunciation_score numeric CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
    accuracy_score numeric CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    fluency_score numeric CHECK (fluency_score >= 0 AND fluency_score <= 100),
    completeness_score numeric CHECK (completeness_score >= 0 AND completeness_score <= 100),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create onboarding_sessions table
CREATE TABLE public.onboarding_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid NOT NULL, -- Note: no direct FK since sessions is partitioned by status.
    practice_language text NOT NULL,
    reason text NOT NULL,
    topics text[] NOT NULL,
    level text NOT NULL,
    improvement_areas text[] NOT NULL,
    practice_frequency text NOT NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Trigger function for messages sequence_number
CREATE OR REPLACE FUNCTION update_sequence_number()
RETURNS trigger AS $$
BEGIN
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO NEW.sequence_number
    FROM messages
    WHERE session_id = NEW.session_id
      AND session_status = NEW.session_status;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_sequence_number_trigger
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_sequence_number();

-- Trigger function for message_feedback updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_feedback_updated_at
BEFORE UPDATE ON public.message_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for session stats
CREATE MATERIALIZED VIEW public.session_stats AS
SELECT
    user_id,
    status,
    COUNT(*) AS session_count,
    MAX(last_accessed_at) AS last_activity,
    COUNT(DISTINCT language) AS languages_used,
    COUNT(DISTINCT level) AS levels_used
FROM public.sessions
GROUP BY user_id, status
WITH DATA;

-- active_sessions view
CREATE VIEW public.active_sessions AS
SELECT * FROM public.sessions
WHERE status = 'active'
ORDER BY last_accessed_at DESC;

COMMENT ON VIEW public.active_sessions IS
'View for accessing only active sessions, ordered by last access time';

COMMENT ON TABLE public.sessions IS
'Partitioned table storing all chat sessions with separate partitions for active, archived, and deleted sessions';

COMMENT ON MATERIALIZED VIEW public.session_stats IS
'Materialized view containing pre-calculated session statistics per user and status';

-- Index for message content search
CREATE INDEX messages_content_search_idx ON public.messages
USING gin(to_tsvector('english', content));

-- Full-text search function
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
        ts_rank(to_tsvector('english', m.content), to_tsquery('english', search_query)) AS rank
    FROM public.messages m
    JOIN public.sessions s ON s.id = m.session_id AND s.status = m.session_status
    WHERE
        to_tsvector('english', m.content) @@ to_tsquery('english', search_query)
        AND (session_id_param IS NULL OR m.session_id = session_id_param)
        AND (user_id_param IS NULL OR s.user_id = user_id_param)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX sessions_active_user_id_idx ON public.sessions_active(user_id);
CREATE INDEX sessions_active_last_accessed_idx ON public.sessions_active(last_accessed_at DESC);
CREATE INDEX sessions_archived_user_id_idx ON public.sessions_archived(user_id);
CREATE INDEX sessions_archived_last_accessed_idx ON public.sessions_archived(last_accessed_at DESC);
CREATE INDEX messages_session_id_idx ON public.messages(session_id);
CREATE INDEX messages_sequence_number_idx ON public.messages(session_id, sequence_number);
CREATE UNIQUE INDEX session_stats_user_status_idx ON public.session_stats(user_id, status);
CREATE INDEX message_feedback_message_id_idx ON public.message_feedback(message_id);
CREATE INDEX message_feedback_created_at_idx ON public.message_feedback(created_at);
CREATE INDEX onboarding_sessions_session_id_idx ON public.onboarding_sessions(session_id);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their sessions"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.status = messages.session_status
        AND sessions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages in their sessions"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.status = messages.session_status
        AND sessions.user_id = auth.uid()
    )
);

-- Message feedback policies
CREATE POLICY "Users can view feedback for their messages"
ON public.message_feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages
        JOIN public.sessions ON sessions.id = messages.session_id AND sessions.status = messages.session_status
        WHERE messages.id = message_feedback.message_id
        AND sessions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert feedback for their messages"
ON public.message_feedback FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages
        JOIN public.sessions ON sessions.id = messages.session_id AND sessions.status = messages.session_status
        WHERE messages.id = message_feedback.message_id
        AND sessions.user_id = auth.uid()
    )
);