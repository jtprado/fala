-- Create enums for sessions and messages
create type public.session_language as enum ('en', 'es', 'fr', 'de');
create type public.session_level as enum ('beginner', 'intermediate', 'advanced');
create type public.session_status as enum ('active', 'archived', 'deleted');
create type public.message_type as enum ('text', 'audio', 'system');

-- Create message_feedback table
create table public.message_feedback (
    id uuid default uuid_generate_v4() primary key,
    message_id uuid not null references public.messages(id) on delete cascade,
    pronunciation_score numeric check (pronunciation_score >= 0 and pronunciation_score <= 100),
    accuracy_score numeric check (accuracy_score >= 0 and accuracy_score <= 100),
    fluency_score numeric check (fluency_score >= 0 and fluency_score <= 100),
    completeness_score numeric check (completeness_score >= 0 and completeness_score <= 100),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS to message_feedback
alter table public.message_feedback enable row level security;

create policy "Users can view feedback for their messages"
on public.message_feedback for select
using (
    exists (
        select 1 from public.messages
        join public.sessions on sessions.id = messages.session_id
        where messages.id = message_feedback.message_id
        and sessions.user_id = auth.uid()
    )
);

create policy "Users can insert feedback for their messages"
on public.message_feedback for insert
with check (
    exists (
        select 1 from public.messages
        join public.sessions on sessions.id = messages.session_id
        where messages.id = message_feedback.message_id
        and sessions.user_id = auth.uid()
    )
);

-- Add indexes for message_feedback
create index message_feedback_message_id_idx on public.message_feedback(message_id);
create index message_feedback_created_at_idx on public.message_feedback(created_at);

-- Migrate existing data and update column types
-- First, validate all existing data conforms to enum values
do $$
begin
    -- Verify session language values
    if exists (
        select 1 from public.sessions
        where language not in ('en', 'es', 'fr', 'de')
    ) then
        raise exception 'Invalid language values found in sessions table';
    end if;

    -- Verify session level values
    if exists (
        select 1 from public.sessions
        where level not in ('beginner', 'intermediate', 'advanced')
    ) then
        raise exception 'Invalid level values found in sessions table';
    end if;

    -- Verify session status values
    if exists (
        select 1 from public.sessions
        where status not in ('active', 'archived', 'deleted')
    ) then
        raise exception 'Invalid status values found in sessions table';
    end if;

    -- Verify message type values
    if exists (
        select 1 from public.messages
        where type not in ('text', 'audio', 'system')
    ) then
        raise exception 'Invalid type values found in messages table';
    end if;
end $$;

-- Alter tables to use new enum types
alter table public.sessions
    alter column language type public.session_language using language::public.session_language,
    alter column level type public.session_level using level::public.session_level,
    alter column status type public.session_status using status::public.session_status;

alter table public.messages
    alter column type type public.message_type using type::public.message_type;

-- Drop old check constraints as they're no longer needed
alter table public.sessions
    drop constraint if exists valid_language,
    drop constraint if exists valid_level,
    drop constraint if exists valid_status;

alter table public.messages
    drop constraint if exists valid_type;

-- Migrate existing feedback data to new table
insert into public.message_feedback (
    message_id,
    pronunciation_score,
    accuracy_score,
    fluency_score,
    completeness_score,
    created_at
)
select 
    id as message_id,
    (feedback->>'pronunciation_score')::numeric,
    (feedback->>'accuracy_score')::numeric,
    (feedback->>'fluency_score')::numeric,
    (feedback->>'completeness_score')::numeric,
    created_at
from public.messages
where feedback is not null;

-- Add composite indexes for common query patterns
create index sessions_user_last_accessed_idx on public.sessions(user_id, last_accessed_at);
create index messages_session_created_idx on public.messages(session_id, created_at);

-- Update messages table to remove old feedback column
alter table public.messages
    drop column feedback;

-- Add updated_at trigger function if it doesn't exist
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add updated_at trigger to message_feedback
create trigger update_message_feedback_updated_at
    before update on public.message_feedback
    for each row
    execute function public.update_updated_at_column();
