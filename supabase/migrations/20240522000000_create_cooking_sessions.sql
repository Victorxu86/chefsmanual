
create table cooking_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  total_duration_seconds integer,
  recipes jsonb default '[]'::jsonb,
  status text default 'completed' -- 'completed', 'abandoned'
);

-- Add RLS policies
alter table cooking_sessions enable row level security;

create policy "Users can insert their own sessions"
  on cooking_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own sessions"
  on cooking_sessions for select
  using (auth.uid() = user_id);

