-- Create emails table
create table if not exists public.emails (
  id uuid primary key,
  from_address text,
  to_address text,
  subject text,
  text text,
  html text,
  received_at timestamptz default now(),
  raw_payload jsonb
);

-- Enable Row Level Security
alter table public.emails enable row level security;

-- Create policy to allow service role full access
create policy "Service role has full access"
  on public.emails
  for all
  to service_role
  using (true)
  with check (true);

-- Create policy to allow anon users to read emails (for your frontend)
create policy "Anyone can read emails"
  on public.emails
  for select
  to anon
  using (true);
