-- ponytail: anon-full RLS for single-user MVP; tighten with auth when sharing
create table if not exists exercises (
  id bigint generated always as identity primary key,
  day text not null,
  name text not null,
  sets_reps text,
  weight_template text,
  category text,
  order_index int,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id bigint generated always as identity primary key,
  performed_at date not null default current_date,
  week_number int,
  day text not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists exercise_logs (
  id bigint generated always as identity primary key,
  session_id bigint references sessions(id) on delete cascade,
  exercise_id bigint references exercises(id) on delete set null,
  set_number int not null,
  reps int,
  weight_kg numeric,
  notes text,
  created_at timestamptz default now()
);

create index if not exists exercise_logs_session_idx on exercise_logs(session_id);
create index if not exists exercise_logs_exercise_idx on exercise_logs(exercise_id);
create index if not exists sessions_performed_idx on sessions(performed_at desc);

alter table exercises enable row level security;
alter table sessions enable row level security;
alter table exercise_logs enable row level security;

drop policy if exists "anon full" on exercises;
drop policy if exists "anon full" on sessions;
drop policy if exists "anon full" on exercise_logs;

create policy "anon full" on exercises for all using (true) with check (true);
create policy "anon full" on sessions for all using (true) with check (true);
create policy "anon full" on exercise_logs for all using (true) with check (true);
