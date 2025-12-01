-- Create broadcast_schedules table
create type broadcast_type as enum ('broadcast', 'reception');
create type broadcast_status as enum ('scheduled', 'live', 'finished');

create table if not exists public.broadcast_schedules (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  type broadcast_type not null default 'broadcast',
  time time not null,
  channel_name text not null,
  program_title text not null,
  match_info text,
  studio_label text,
  video_source_info text,
  audio_source_info text,
  transmission_path text,
  biss_key text,
  contact_info text,
  memo text,
  status broadcast_status not null default 'scheduled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.broadcast_schedules enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.broadcast_schedules
  for select using (true);

create policy "Enable insert for authenticated users only" on public.broadcast_schedules
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.broadcast_schedules
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on public.broadcast_schedules
  for delete using (auth.role() = 'authenticated');

-- Create indexes
create index broadcast_schedules_date_idx on public.broadcast_schedules (date);
create index broadcast_schedules_type_idx on public.broadcast_schedules (type);
