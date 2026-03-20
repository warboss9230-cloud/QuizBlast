-- ═══════════════════════════════════════════════════════════
--  QuizBlast — Supabase Database Setup
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ── 1. PROFILES TABLE ──────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique not null,
  avatar      text default '🐉',
  coins       int  default 100,
  xp          int  default 0,
  level       int  default 1,
  total_games int  default 0,
  best_accuracy int default 0,
  max_streak  int  default 0,
  day_streak  int  default 0,
  boss_wins   int  default 0,
  pvp_wins    int  default 0,
  pvp_losses  int  default 0,
  total_xp    int  default 0,
  unlocked_badges text[] default '{}',
  unlocked_avatars int[] default '{}',
  subject_stats jsonb default '{}',
  weekly_scores int[] default '{0,0,0,0,0,0,0}',
  study_dates text[] default '{}',
  last_study_date text default '',
  daily_last_date text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 2. LEADERBOARD TABLE ───────────────────────────────────
create table if not exists public.leaderboard (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  username    text not null,
  avatar      text default '🐉',
  score       int  not null default 0,
  accuracy    int  default 0,
  subject     text default 'gk',
  class       int  default 6,
  mode        text default 'freeplay',
  coins       int  default 0,
  created_at  timestamptz default now()
);

-- ── 3. DAILY CHALLENGE TABLE ───────────────────────────────
create table if not exists public.daily_challenge (
  id          bigserial primary key,
  cls         int  default 6,
  subject     text default 'gk',
  message     text default 'Daily Challenge!',
  reward      int  default 200,
  set_by      uuid references public.profiles(id),
  active_date text not null default to_char(now(),'YYYY-MM-DD'),
  created_at  timestamptz default now()
);

-- ── 4. CUSTOM QUESTIONS TABLE ──────────────────────────────
create table if not exists public.custom_questions (
  id          bigserial primary key,
  cls         int  not null,
  subject     text not null,
  question    text not null,
  options     text[] not null,
  answer      int  not null default 0,
  hint        text default '',
  added_by    uuid references public.profiles(id),
  approved    boolean default true,
  created_at  timestamptz default now()
);

-- ── 5. ROW LEVEL SECURITY ──────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.leaderboard       enable row level security;
alter table public.daily_challenge   enable row level security;
alter table public.custom_questions  enable row level security;

-- Profiles: users can read all, write only own
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Leaderboard: anyone can read, authenticated can insert
create policy "lb_select_all"    on public.leaderboard for select using (true);
create policy "lb_insert_auth"   on public.leaderboard for insert with check (auth.uid() = user_id);
create policy "lb_delete_own"    on public.leaderboard for delete using (auth.uid() = user_id);

-- Daily challenge: anyone can read, only admins insert (handle in app)
create policy "dc_select_all"   on public.daily_challenge for select using (true);
create policy "dc_insert_auth"  on public.daily_challenge for insert with check (auth.uid() is not null);
create policy "dc_update_auth"  on public.daily_challenge for update using (auth.uid() is not null);

-- Custom questions: anyone can read approved, authenticated can insert
create policy "cq_select_approved" on public.custom_questions for select using (approved = true);
create policy "cq_insert_auth"     on public.custom_questions for insert with check (auth.uid() is not null);
create policy "cq_update_own"      on public.custom_questions for update using (auth.uid() = added_by);
create policy "cq_delete_own"      on public.custom_questions for delete using (auth.uid() = added_by);

-- ── 6. AUTO-CREATE PROFILE ON SIGNUP ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 7. UPDATED_AT TRIGGER ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── 8. INDEXES ─────────────────────────────────────────────
create index if not exists idx_lb_score     on public.leaderboard(score desc);
create index if not exists idx_lb_subject   on public.leaderboard(subject);
create index if not exists idx_cq_cls_subj  on public.custom_questions(cls, subject);
create index if not exists idx_dc_date      on public.daily_challenge(active_date);

-- Done! ✅
select 'QuizBlast Supabase setup complete!' as status;
