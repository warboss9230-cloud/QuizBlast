-- ══════════════════════════════════════════════════════════════
--  QuizBlast — PvP New Features SQL
--  Supabase SQL Editor mein run karo (pvp_schema.sql ke BAAD)
-- ══════════════════════════════════════════════════════════════

-- ── 1. PVP PLAYER STATS (Rank + Streak) ───────────────────────
CREATE TABLE IF NOT EXISTS public.pvp_stats (
  user_id       UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT    NOT NULL DEFAULT 'Player',
  avatar        TEXT    NOT NULL DEFAULT '🐉',
  total_wins    INTEGER NOT NULL DEFAULT 0,
  total_losses  INTEGER NOT NULL DEFAULT 0,
  win_streak    INTEGER NOT NULL DEFAULT 0,   -- current streak
  best_streak   INTEGER NOT NULL DEFAULT 0,
  rank_points   INTEGER NOT NULL DEFAULT 0,   -- for rank system
  rank          TEXT    NOT NULL DEFAULT 'Bronze',
  season_wins   INTEGER NOT NULL DEFAULT 0,   -- weekly reset
  season_points INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pvp_stats_rp ON public.pvp_stats(rank_points DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_stats_sw ON public.pvp_stats(season_wins DESC);

-- ── 2. PVP CHALLENGES ─────────────────────────────────────────
-- Ek player doosre ko direct challenge kare
CREATE TABLE IF NOT EXISTS public.pvp_challenges (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_name TEXT        NOT NULL DEFAULT 'Player',
  challenger_avatar TEXT      NOT NULL DEFAULT '🐉',
  challenged_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject         TEXT        NOT NULL DEFAULT 'gk',
  class           INTEGER     NOT NULL DEFAULT 1,
  bet_coins       INTEGER     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'pending',
    -- pending → accepted → declined → expired
  room_id         UUID        REFERENCES public.pvp_rooms(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenge_to   ON public.pvp_challenges(challenged_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_from ON public.pvp_challenges(challenger_id);

-- ── 3. PVP CHAT MESSAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pvp_chat (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID        NOT NULL REFERENCES public.pvp_rooms(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username  TEXT        NOT NULL DEFAULT 'Player',
  msg       TEXT        NOT NULL,   -- quick chat message
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pvp_chat_room ON public.pvp_chat(room_id, sent_at);

-- ── 4. RLS POLICIES ───────────────────────────────────────────
ALTER TABLE public.pvp_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_chat       ENABLE ROW LEVEL SECURITY;

-- pvp_stats
CREATE POLICY "pvp_stats_select_all"    ON public.pvp_stats FOR SELECT USING (true);
CREATE POLICY "pvp_stats_insert_own"    ON public.pvp_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pvp_stats_update_own"    ON public.pvp_stats FOR UPDATE USING (auth.uid() = user_id);

-- pvp_challenges
CREATE POLICY "challenge_select"  ON public.pvp_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
CREATE POLICY "challenge_insert"  ON public.pvp_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "challenge_update"  ON public.pvp_challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- pvp_chat
CREATE POLICY "chat_select" ON public.pvp_chat FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chat_insert" ON public.pvp_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 5. ADD streak/rank cols to pvp_rooms ──────────────────────
ALTER TABLE public.pvp_rooms
  ADD COLUMN IF NOT EXISTS player1_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_streak INTEGER NOT NULL DEFAULT 0;

-- ── 6. RANK HELPER FUNCTION ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.pvp_get_rank(points INTEGER)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF points >= 2000 THEN RETURN 'Diamond';
  ELSIF points >= 1000 THEN RETURN 'Gold';
  ELSIF points >= 400 THEN RETURN 'Silver';
  ELSE RETURN 'Bronze';
  END IF;
END; $$;
