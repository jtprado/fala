-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create sessions table
create table public.sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null references auth.users(id),
    title text not null default 'New Chat Session',
    last_message_at timestamptz default now(),
    last_accessed_at timestamptz default now(),
    status text not null default 'active',
    language text not null default 'en',
    level text not null default 'beginner',
    created_at timestamptz default now(),
    
    constraint valid_language check (language in ('en', 'es', 'fr', 'de')),
    constraint valid_level check (level in ('beginner', 'intermediate', 'advanced')),
    constraint valid_status check (status in ('active', 'archived', 'deleted'))
);

-- Create messages table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    session_id uuid not null references public.sessions(id) on delete cascade,
    user_id uuid not null references auth.users(id),
    content text not null,
    type text not null,
    translation text,
    feedback jsonb,
    sequence_number bigint not null,
    created_at timestamptz default now(),
    
    constraint valid_type check (type in ('text', 'audio', 'system'))
);

-- Create sequence number trigger
create or replace function update_sequence_number()
returns trigger as $$
begin
    select coalesce(max(sequence_number), 0) + 1
    into new.sequence_number
    from messages
    where session_id = new.session_id;
    return new;
end;
$$ language plpgsql;

create trigger messages_sequence_number_trigger
before insert on messages
for each row
execute function update_sequence_number();

-- Create RLS policies
alter table public.sessions enable row level security;
alter table public.messages enable row level security;

-- Sessions policies
create policy "Users can view their own sessions"
on public.sessions for select
using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
on public.sessions for insert
with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
on public.sessions for update using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view messages in their sessions"
on public.messages for select
using (
    exists (
        select 1 from public.sessions
        where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
);

create policy "Users can insert messages in their sessions"
on public.messages for insert
with check (
    exists (
        select 1 from public.sessions
        where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
);

-- Create indexes
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_last_accessed_at_idx on public.sessions(last_accessed_at);
create index messages_session_id_idx on public.messages(session_id);
create index messages_sequence_number_idx on public.messages(session_id, sequence_number);