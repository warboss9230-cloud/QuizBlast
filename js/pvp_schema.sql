-- ══════════════════════════════════════════════════════════════
--  QuizBlast — Online PvP SQL
--  Supabase SQL Editor mein run karo (existing schema ke baad)
-- ══════════════════════════════════════════════════════════════

-- ── 1. PVP ROOMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pvp_rooms (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  status        TEXT          NOT NULL DEFAULT 'waiting',
    -- waiting → matched → playing → finished
  player1_id    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  player2_id    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  player1_name  TEXT          NOT NULL DEFAULT 'Player',
  player2_name  TEXT          NOT NULL DEFAULT 'Player',
  player1_avatar TEXT         NOT NULL DEFAULT '🐉',
  player2_avatar TEXT         NOT NULL DEFAULT '🐉',
  player1_score INTEGER       NOT NULL DEFAULT 0,
  player2_score INTEGER       NOT NULL DEFAULT 0,
  player1_done  BOOLEAN       NOT NULL DEFAULT FALSE,
  player2_done  BOOLEAN       NOT NULL DEFAULT FALSE,
  subject       TEXT          NOT NULL DEFAULT 'gk',
  class         INTEGER       NOT NULL DEFAULT 1,
  rounds        INTEGER       NOT NULL DEFAULT 10,
  bet_coins     INTEGER       NOT NULL DEFAULT 0,
  winner_id     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pvp_status ON public.pvp_rooms(status);
CREATE INDEX IF NOT EXISTS idx_pvp_p1     ON public.pvp_rooms(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_p2     ON public.pvp_rooms(player2_id);


-- ── 2. PVP MATCH HISTORY ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pvp_history (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID          REFERENCES public.pvp_rooms(id) ON DELETE CASCADE,
  winner_id     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  loser_id      UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  winner_name   TEXT          NOT NULL DEFAULT 'Player',
  loser_name    TEXT          NOT NULL DEFAULT 'Player',
  winner_score  INTEGER       NOT NULL DEFAULT 0,
  loser_score   INTEGER       NOT NULL DEFAULT 0,
  subject       TEXT          NOT NULL DEFAULT 'gk',
  class         INTEGER       NOT NULL DEFAULT 1,
  coins_won     INTEGER       NOT NULL DEFAULT 0,
  played_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pvph_winner ON public.pvp_history(winner_id);
CREATE INDEX IF NOT EXISTS idx_pvph_loser  ON public.pvp_history(loser_id);
CREATE INDEX IF NOT EXISTS idx_pvph_time   ON public.pvp_history(played_at DESC);


-- ── 3. RLS POLICIES ────────────────────────────────────────────
ALTER TABLE public.pvp_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_history  ENABLE ROW LEVEL SECURITY;

-- Rooms: logged-in players read/write kar sakte hain
CREATE POLICY "pvp_rooms_select"
  ON public.pvp_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "pvp_rooms_insert"
  ON public.pvp_rooms FOR INSERT
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "pvp_rooms_update"
  ON public.pvp_rooms FOR UPDATE
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- History: sabhi read kar sakte hain
CREATE POLICY "pvp_history_select"
  ON public.pvp_history FOR SELECT
  USING (true);

CREATE POLICY "pvp_history_insert"
  ON public.pvp_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ── 4. AUTO updated_at TRIGGER ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.pvp_handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS pvp_rooms_updated_at ON public.pvp_rooms;
CREATE TRIGGER pvp_rooms_updated_at
  BEFORE UPDATE ON public.pvp_rooms
  FOR EACH ROW EXECUTE FUNCTION public.pvp_handle_updated_at();


-- ── 5. CLEANUP OLD ROOMS (waiting > 2 min) ─────────────────────
-- Manually run this ya cron se lagao agar chahiye:
-- DELETE FROM public.pvp_rooms
-- WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '2 minutes';
