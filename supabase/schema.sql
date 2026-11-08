-- ==============================================================================
-- BOT CONVERSA PLATFORM - SUPABASE SCHEMA V1
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CHATBOTS TABLE
create table if not exists public.chatbots (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text default '',
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    current_published_version_id uuid,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CHATBOT DRAFTS TABLE (Single draft per chatbot)
create table if not exists public.chatbot_drafts (
    id uuid primary key default uuid_generate_v4(),
    chatbot_id uuid not null references public.chatbots(id) on delete cascade unique,
    flow_data jsonb not null default '{"nodes": [], "edges": [], "settings": {}, "triggers": []}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CHATBOT VERSIONS (Immutable published snapshots)
create table if not exists public.chatbot_versions (
    id uuid primary key default uuid_generate_v4(),
    chatbot_id uuid not null references public.chatbots(id) on delete cascade,
    version_number integer not null,
    flow_data jsonb not null,
    changelog text default '',
    published_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(chatbot_id, version_number)
);

-- Add foreign key constraint to chatbots for current_published_version_id
alter table public.chatbots 
    drop constraint if exists fk_chatbots_current_version;

alter table public.chatbots
    add constraint fk_chatbots_current_version
    foreign key (current_published_version_id)
    references public.chatbot_versions(id)
    on delete set null;

-- 4. CONTACTS TABLE
create table if not exists public.contacts (
    id uuid primary key default uuid_generate_v4(),
    name text default 'Desconhecido',
    phone text not null unique,
    profile_pic_url text default '',
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TAGS TABLE
create table if not exists public.tags (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    color text default '#6366f1',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CONTACT_TAGS TABLE
create table if not exists public.contact_tags (
    id uuid primary key default uuid_generate_v4(),
    contact_id uuid not null references public.contacts(id) on delete cascade,
    tag_id uuid not null references public.tags(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(contact_id, tag_id)
);

-- 7. CONVERSATION STATE TABLE (Persistent state for ongoing flows)
create table if not exists public.conversation_state (
    id uuid primary key default uuid_generate_v4(),
    contact_id uuid not null references public.contacts(id) on delete cascade,
    chatbot_id uuid not null references public.chatbots(id) on delete cascade,
    chatbot_version_id uuid not null references public.chatbot_versions(id) on delete cascade,
    current_node_id text,
    status text not null default 'active' check (status in ('active', 'waiting_input', 'waiting_delay', 'completed', 'failed', 'paused')),
    variables jsonb default '{}'::jsonb,
    resume_at timestamp with time zone,
    execution_context jsonb default '{}'::jsonb,
    last_interaction_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. EXECUTIONS TABLE
create table if not exists public.executions (
    id uuid primary key default uuid_generate_v4(),
    conversation_state_id uuid references public.conversation_state(id) on delete set null,
    chatbot_version_id uuid not null references public.chatbot_versions(id) on delete cascade,
    contact_id uuid not null references public.contacts(id) on delete cascade,
    trigger_type text not null default 'new_conversation',
    status text not null default 'running' check (status in ('running', 'paused', 'completed', 'failed')),
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    finished_at timestamp with time zone,
    metadata jsonb default '{}'::jsonb
);

-- 9. VARIABLES DEFINITION TABLE
create table if not exists public.variables (
    id uuid primary key default uuid_generate_v4(),
    chatbot_id uuid references public.chatbots(id) on delete cascade,
    key text not null,
    name text not null,
    default_value text default '',
    type text not null default 'string' check (type in ('string', 'number', 'boolean', 'json')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. LOGS TABLE
create table if not exists public.logs (
    id uuid primary key default uuid_generate_v4(),
    execution_id uuid references public.executions(id) on delete set null,
    conversation_state_id uuid references public.conversation_state(id) on delete set null,
    chatbot_id uuid references public.chatbots(id) on delete set null,
    level text not null default 'info' check (level in ('info', 'warn', 'error', 'debug')),
    node_id text default '',
    message text not null,
    details jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for lightning fast lookups
create index if not exists idx_conversation_state_contact on public.conversation_state(contact_id);
create index if not exists idx_conversation_state_resume on public.conversation_state(status, resume_at);
create index if not exists idx_executions_contact on public.executions(contact_id);
create index if not exists idx_chatbot_versions_chatbot on public.chatbot_versions(chatbot_id);
create index if not exists idx_logs_execution on public.logs(execution_id);
create index if not exists idx_logs_conversation on public.logs(conversation_state_id);
