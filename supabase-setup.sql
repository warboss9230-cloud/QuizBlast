-- ══════════════════════════════════════════════════════════
--   QuizBlast — Supabase Setup SQL
--   Supabase Dashboard → SQL Editor mein ye RUN karo
--   STEP 1 pehle, phir STEP 2, phir STEP 3
-- ══════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════
-- STEP 1: TABLES BANAO
-- ══════════════════════════════════════════════════════════

-- 1A. PROFILES TABLE
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar text default '🐉',
  coins integer default 100,
  xp integer default 0,
  level integer default 1,
  total_games integer default 0,
  best_accuracy integer default 0,
  max_streak integer default 0,
  day_streak integer default 0,
  boss_wins integer default 0,
  pvp_wins integer default 0,
  pvp_losses integer default 0,
  total_xp integer default 0,
  unlocked_badges jsonb default '[]',
  unlocked_avatars jsonb default '[]',
  subject_stats jsonb default '{}',
  weekly_scores jsonb default '[0,0,0,0,0,0,0]',
  study_dates jsonb default '[]',
  last_study_date text default '',
  daily_last_date text default '',
  updated_at timestamptz default now()
);

-- 1B. LEADERBOARD TABLE
create table if not exists leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  username text,
  avatar text,
  score integer default 0,
  accuracy integer default 0,
  subject text default 'gk',
  class integer default 6,
  mode text default 'freeplay',
  coins integer default 0,
  created_at timestamptz default now()
);

-- 1C. DAILY CHALLENGE TABLE
create table if not exists daily_challenge (
  id uuid default gen_random_uuid() primary key,
  cls integer,
  subject text,
  message text,
  reward integer default 200,
  set_by uuid references auth.users,
  active_date date unique,
  created_at timestamptz default now()
);

-- 1D. CUSTOM QUESTIONS TABLE
create table if not exists custom_questions (
  id uuid default gen_random_uuid() primary key,
  cls integer,
  subject text,
  question text,
  options jsonb,
  answer text,
  hint text default '',
  approved boolean default false,
  added_by uuid references auth.users,
  created_at timestamptz default now()
);


-- ══════════════════════════════════════════════════════════
-- STEP 2: AUTO PROFILE TRIGGER
-- (Signup ke baad automatically profile row banta hai)
-- ══════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Player'),
    '🐉'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ══════════════════════════════════════════════════════════
-- STEP 3: RLS POLICIES (Row Level Security)
-- ══════════════════════════════════════════════════════════

-- PROFILES
alter table profiles enable row level security;

drop policy if exists "Users can read all profiles" on profiles;
create policy "Users can read all profiles"
  on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- LEADERBOARD
alter table leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on leaderboard;
create policy "Anyone can read leaderboard"
  on leaderboard for select using (true);

drop policy if exists "Logged in users can insert leaderboard" on leaderboard;
create policy "Logged in users can insert leaderboard"
  on leaderboard for insert with check (auth.uid() = user_id);

-- DAILY CHALLENGE
alter table daily_challenge enable row level security;

drop policy if exists "Anyone can read daily challenge" on daily_challenge;
create policy "Anyone can read daily challenge"
  on daily_challenge for select using (true);

drop policy if exists "Logged in users can insert daily challenge" on daily_challenge;
create policy "Logged in users can insert daily challenge"
  on daily_challenge for insert with check (auth.role() = 'authenticated');

drop policy if exists "Logged in users can upsert daily challenge" on daily_challenge;
create policy "Logged in users can upsert daily challenge"
  on daily_challenge for update using (auth.role() = 'authenticated');

-- CUSTOM QUESTIONS
alter table custom_questions enable row level security;

drop policy if exists "Anyone can read approved questions" on custom_questions;
create policy "Anyone can read approved questions"
  on custom_questions for select using (approved = true);

drop policy if exists "Logged in users can insert questions" on custom_questions;
create policy "Logged in users can insert questions"
  on custom_questions for insert with check (auth.role() = 'authenticated');


-- ══════════════════════════════════════════════════════════
-- DONE! Ab Supabase Dashboard mein:
-- Authentication → Settings →
-- "Enable email confirmations" = OFF kar do
-- ══════════════════════════════════════════════════════════
