/* ════════════════════════════════════════════════════════════
   QuizBlast — Supabase Integration Layer
   ─────────────────────────────────────────────────────────
   SETUP: Replace SUPABASE_URL and SUPABASE_ANON_KEY below
   Get them from: Supabase Dashboard → Settings → API
════════════════════════════════════════════════════════════ */
'use strict';

// ── CONFIG — Replace these with your Supabase project values ──
const SUPABASE_URL      = 'https://kuxbunmcxemfylbywzdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eGJ1bm1jeGVtZnlsYnl3emRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDIyMTEsImV4cCI6MjA4OTU3ODIxMX0.2lWKI4XLE0mt7cs1ZkGhflKftF8go-ZwkZkvzWuZuQ4';

// ── Load Supabase JS SDK ───────────────────────────────────────
// Loaded via CDN in index.html before this file

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ════════════════════════════════════════════════════════════
   NAME PROMPT — Pehli baar naam poochta hai
════════════════════════════════════════════════════════════ */
const NamePrompt = {
  _resolve: null,

  ask() {
    return new Promise((resolve) => {
      this._resolve = resolve;

      // Agar overlay already hai toh remove karo
      const existing = document.getElementById('namePromptOverlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'namePromptOverlay';
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:99999;
        background:linear-gradient(135deg,#1a1625,#2a2440);
        display:flex;align-items:center;justify-content:center;
        font-family:'Nunito',sans-serif;padding:20px;`;

      overlay.innerHTML = `
        <div style="background:#251f38;border:1px solid rgba(200,180,255,.15);
                    border-radius:20px;padding:36px 28px;max-width:360px;
                    width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5)">
          <div style="font-size:3rem;margin-bottom:12px">🎮</div>
          <h2 style="font-family:'Baloo 2',cursive;font-size:1.5rem;font-weight:800;
                     background:linear-gradient(135deg,#f0eaff,#ce93d8);
                     -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                     background-clip:text;margin-bottom:6px">QuizBlast</h2>
          <p style="color:#b8a9d9;font-size:.82rem;font-weight:700;margin-bottom:24px">
            Leaderboard ke liye apna naam daalo!</p>

          <input id="namePromptInput" type="text" maxlength="20"
            placeholder="Apna naam likho… (e.g. Harendra)"
            autocomplete="off" autocorrect="off" autocapitalize="words"
            style="width:100%;padding:13px 16px;background:#2a2440;
                   border:2px solid rgba(200,180,255,.25);border-radius:12px;
                   color:#f0eaff;font-family:'Nunito',sans-serif;font-size:1rem;
                   font-weight:700;outline:none;margin-bottom:8px;
                   box-sizing:border-box;text-align:center"/>

          <div id="namePromptErr" style="min-height:18px;font-size:.75rem;
               font-weight:800;color:#ef9a9a;margin-bottom:10px"></div>

          <button id="namePromptBtn"
            onclick="NamePrompt.submit()"
            style="width:100%;padding:13px;border:none;border-radius:50px;
                   background:linear-gradient(135deg,#b39ddb,#ce93d8);
                   color:#2d2040;font-family:'Nunito',sans-serif;font-size:.95rem;
                   font-weight:900;cursor:pointer;
                   box-shadow:0 4px 16px rgba(179,157,219,.3)">
            ✅ Save & Play!
          </button>
        </div>`;

      document.body.appendChild(overlay);

      // Enter key support
      setTimeout(() => {
        const inp = document.getElementById('namePromptInput');
        if (inp) {
          inp.focus();
          inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') NamePrompt.submit();
          });
        }
      }, 100);
    });
  },

  submit() {
    const inp = document.getElementById('namePromptInput');
    const err = document.getElementById('namePromptErr');
    const name = inp ? inp.value.trim() : '';

    if (!name || name.length < 2) {
      if (err) err.textContent = '⚠️ Kam se kam 2 characters chahiye!';
      return;
    }
    if (name.length > 20) {
      if (err) err.textContent = '⚠️ Maximum 20 characters!';
      return;
    }

    // Remove overlay
    const overlay = document.getElementById('namePromptOverlay');
    if (overlay) overlay.remove();

    if (this._resolve) {
      this._resolve(name);
      this._resolve = null;
    }
  }
};

/* ════════════════════════════════════════════════════════════
   AUTH MODULE
════════════════════════════════════════════════════════════ */
const SBAuth = (() => {
  let _user = null;
  let _profile = null;
  let _listeners = [];

  // Get current session on load
  async function init() {
    const { data: { session } } = await _sb.auth.getSession();
    if (session) {
      _user = session.user;
      await _loadProfile();
    }
    // Listen for auth changes
    _sb.auth.onAuthStateChange(async (event, session) => {
      _user = session?.user || null;
      if (_user) await _loadProfile();
      else _profile = null;
      _listeners.forEach(fn => fn(event, _user, _profile));
    });
    return { user: _user, profile: _profile };
  }

  async function signUp(username, password) {
    // Create internal email — user never sees this
    const clean = username.toLowerCase().replace(/[^a-z0-9]/g,'');
    const hash  = Math.abs(username.split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)&0xffff);
    const email = `${clean}${hash}@qblast.game`;
    const { data, error } = await _sb.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: undefined,
      }
    });
    if (error) throw error;
    // If user already exists, signUp returns user but with identities: []
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('Username already registered');
    }
    return data;
  }

  async function signIn(username, password) {
    const clean = username.toLowerCase().replace(/[^a-z0-9]/g,'');
    const hash  = Math.abs(username.split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)&0xffff);
    const email = `${clean}${hash}@qblast.game`;
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    _user = data.user;
    await _loadProfile();
    return { user: _user, profile: _profile };
  }

  async function signOut() {
    await _sb.auth.signOut();
    _user = null; _profile = null;
  }

  // Auto-login using device fingerprint
  // If name not set or is generic "Player####", ask user for their name
  async function autoLogin() {
    try {
      let deviceId = localStorage.getItem('qb_device_id');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2,9);
        localStorage.setItem('qb_device_id', deviceId);
      }
      const email    = `${deviceId}@qblast.game`;
      const password = 'QB_' + deviceId.split('').reverse().join('').slice(0,16);

      // Get local player name
      const getLocalName = () => {
        try {
          const p = JSON.parse(localStorage.getItem('qb_player') || '{}');
          return (p.name && p.name !== 'Player' && !/^Player\d+$/.test(p.name)) ? p.name : null;
        } catch { return null; }
      };

      const getLocalAvatar = () => {
        try {
          const p = JSON.parse(localStorage.getItem('qb_player') || '{}');
          return p.avatar || '🐉';
        } catch { return '🐉'; }
      };

      // Try sign in first
      try {
        const { data, error } = await _sb.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          _user = data.user;
          await _loadProfile();

          // If profile username is generic (Player####) or missing, ask for real name
          const isGeneric = !_profile?.username || /^Player\d+$/.test(_profile.username) || _profile.username === 'Player';
          const localName = getLocalName();

          if (isGeneric && !localName) {
            // Ask user for their name
            const name = await NamePrompt.ask();
            if (name) {
              // Save locally
              try {
                const p = JSON.parse(localStorage.getItem('qb_player') || '{}');
                p.name = name;
                localStorage.setItem('qb_player', JSON.stringify(p));
              } catch(e) {}
              // Save to Supabase
              await _sb.from('profiles').update({
                username: name,
                avatar: getLocalAvatar(),
                updated_at: new Date().toISOString()
              }).eq('id', _user.id);
              await _loadProfile();
            }
          } else if (localName && (_profile?.username !== localName)) {
            // Sync local name to Supabase
            await _sb.from('profiles').update({
              username: localName,
              avatar: getLocalAvatar(),
              updated_at: new Date().toISOString()
            }).eq('id', _user.id);
            await _loadProfile();
          }
          return;
        }
      } catch(e) {}

      // New device — ask for name first
      let userName = getLocalName();
      if (!userName) {
        userName = await NamePrompt.ask();
        if (userName) {
          try {
            const p = JSON.parse(localStorage.getItem('qb_player') || '{}');
            p.name = userName;
            localStorage.setItem('qb_player', JSON.stringify(p));
          } catch(e) {}
        } else {
          userName = 'Player' + Math.floor(Math.random()*9000+1000);
        }
      }

      const { data: signUpData } = await _sb.auth.signUp({
        email, password,
        options: { data: { username: userName } }
      });
      if (signUpData?.user) {
        _user = signUpData.user;
        await new Promise(r => setTimeout(r, 800));
        await _loadProfile();
      }
    } catch(e) {
      console.warn('Auto-login failed, offline mode:', e);
    }
  }

  // Expose _loadProfile so SBPlayer.pull can refresh before reading
  async function loadProfile() {
    return await _loadProfile();
  }

  async function _loadProfile() {
    if (!_user) return null;
    const { data, error } = await _sb
      .from('profiles')
      .select('*')
      .eq('id', _user.id)
      .single();
    if (!error) _profile = data;
    return _profile;
  }

  async function updateProfile(patch) {
    if (!_user) return;
    const { data, error } = await _sb
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', _user.id)
      .select()
      .single();
    if (!error) _profile = data;
    return data;
  }

  function getUser()    { return _user; }
  function getProfile() { return _profile; }
  function isLoggedIn() { return !!_user; }
  function onChange(fn) { _listeners.push(fn); }

  async function logout() {
    await _sb.auth.signOut();
    _user = null; _profile = null;
    localStorage.removeItem('qb_guest_mode');
    localStorage.removeItem('qb_device_id');
    // Show login screen
    SBLoginUI.show();
  }

  function isGuest() {
    return localStorage.getItem('qb_guest_mode') === '1';
  }

  return { init, signUp, signIn, signOut, autoLogin, updateProfile, getUser, getProfile, isLoggedIn, onChange, loadProfile, logout, isGuest };
})();

/* ════════════════════════════════════════════════════════════
   PLAYER SYNC — bridges localStorage Player ↔ Supabase
════════════════════════════════════════════════════════════ */
const SBPlayer = (() => {

  // Push local player data to Supabase
  async function push() {
    if (!SBAuth.isLoggedIn()) return;
    const local = Player.get();
    const patch = {
      avatar:           local.avatar,
      coins:            local.coins,
      xp:               local.xp,
      level:            local.level,
      total_games:      local.totalGames || 0,
      best_accuracy:    local.bestAccuracy || 0,
      max_streak:       local.maxStreak || 0,
      day_streak:       local.dayStreak || 0,
      boss_wins:        local.bossWins || 0,
      pvp_wins:         local.pvpWins || 0,
      pvp_losses:       local.pvpLosses || 0,
      total_xp:         local.totalXP || 0,
      unlocked_badges:  local.unlockedBadges || [],
      unlocked_avatars: local.unlockedAvatars || [],
      subject_stats:    local.subjectStats || {},
      weekly_scores:    local.weeklyScores || [0,0,0,0,0,0,0],
      study_dates:      local.studyDates || [],
      last_study_date:  local.lastStudyDate || '',
      daily_last_date:  local.dailyLastDate || '',
    };
    try { await SBAuth.updateProfile(patch); } catch(e) { console.warn('SBPlayer.push:', e); }
  }

  // Pull Supabase profile → local Player
  async function pull() {
    if (!SBAuth.isLoggedIn()) return;
    // Reload profile from DB to get latest data
    await SBAuth.loadProfile();
    const profile = SBAuth.getProfile();
    if (!profile) return;
    const patch = {
      name:            profile.username || 'Player',
      avatar:          profile.avatar || '🐉',
      coins:           profile.coins !== undefined ? profile.coins : 100,
      xp:              profile.xp || 0,
      level:           profile.level || 1,
      totalGames:      profile.total_games || 0,
      bestAccuracy:    profile.best_accuracy || 0,
      maxStreak:       profile.max_streak || 0,
      dayStreak:       profile.day_streak || 0,
      bossWins:        profile.boss_wins || 0,
      pvpWins:         profile.pvp_wins || 0,
      pvpLosses:       profile.pvp_losses || 0,
      totalXP:         profile.total_xp || 0,
      unlockedBadges:  profile.unlocked_badges || [],
      unlockedAvatars: profile.unlocked_avatars || [],
      subjectStats:    profile.subject_stats || {},
      weeklyScores:    profile.weekly_scores || [0,0,0,0,0,0,0],
      studyDates:      profile.study_dates || [],
      lastStudyDate:   profile.last_study_date || '',
      dailyLastDate:   profile.daily_last_date || '',
    };
    Player.update(patch);
    Player.updateHUD();
  }

  // Debounced push (avoid too many API calls)
  let _pushTimer = null;
  function pushDebounced() {
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(push, 2000);
  }

  return { push, pull, pushDebounced };
})();

/* ════════════════════════════════════════════════════════════
   LEADERBOARD — Global scores
════════════════════════════════════════════════════════════ */
const SBLeaderboard = (() => {

  async function submit(score, accuracy, subject, cls, mode) {
    if (!SBAuth.isLoggedIn()) return;
    if (SBAuth.isGuest()) return; // Guest leaderboard mein nahi
    const profile = SBAuth.getProfile();
    if (!profile) return;
    try {
      const { error } = await _sb.from('leaderboard').insert({
        user_id:  SBAuth.getUser().id,
        username: profile.username || 'Player',
        avatar:   profile.avatar || '🐉',
        score, accuracy,
        subject:  subject || 'gk',
        class:    cls || 6,
        mode:     mode || 'freeplay',
        coins:    profile.coins || 0,
      });
      if (error) console.warn('Leaderboard submit error:', error.message);
    } catch(e) {
      console.warn('Leaderboard submit failed:', e);
    }
  }

  async function getTop(limit = 20, subject = null) {
    let query = _sb
      .from('leaderboard')
      .select('username,avatar,score,accuracy,subject,class,mode,created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (subject) query = query.eq('subject', subject);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  async function getMyRank() {
    if (!SBAuth.isLoggedIn()) return null;
    const profile = SBAuth.getProfile();
    const { count } = await _sb
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('score', profile.coins || 0);
    return (count || 0) + 1;
  }

  return { submit, getTop, getMyRank };
})();

/* ════════════════════════════════════════════════════════════
   DAILY CHALLENGE — Admin controlled, global
════════════════════════════════════════════════════════════ */
const SBDaily = (() => {

  async function get() {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await _sb
      .from('daily_challenge')
      .select('*')
      .eq('active_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data || null;
  }

  async function set(cls, subject, message, reward = 200) {
    if (!SBAuth.isLoggedIn()) return;
    const today = new Date().toISOString().slice(0, 10);
    // Upsert today's challenge
    await _sb.from('daily_challenge').upsert({
      cls, subject, message, reward,
      set_by: SBAuth.getUser().id,
      active_date: today,
    }, { onConflict: 'active_date' });
  }

  return { get, set };
})();

/* ════════════════════════════════════════════════════════════
   CUSTOM QUESTIONS — Admin add, all players see
════════════════════════════════════════════════════════════ */
const SBQuestions = (() => {

  async function getForClass(cls, subject) {
    const { data, error } = await _sb
      .from('custom_questions')
      .select('question,options,answer,hint')
      .eq('cls', cls)
      .eq('subject', subject)
      .eq('approved', true);
    if (error || !data) return [];
    // Convert to QuizBlast format
    return data.map(q => ({
      q:    q.question,
      opts: q.options,
      ans:  q.answer,
      hint: q.hint || '',
    }));
  }

  async function add(cls, subject, question, options, answer, hint = '') {
    if (!SBAuth.isLoggedIn()) return;
    await _sb.from('custom_questions').insert({
      cls, subject, question,
      options, answer, hint,
      added_by: SBAuth.getUser().id,
    });
  }

  async function remove(id) {
    await _sb.from('custom_questions').delete().eq('id', id);
  }

  return { getForClass, add, remove };
})();

/* ════════════════════════════════════════════════════════════
   LOGIN SCREEN UI
════════════════════════════════════════════════════════════ */
const SBLoginUI = (() => {

  function show() {
    let overlay = document.getElementById('sbLoginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sbLoginOverlay';
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        background:linear-gradient(135deg,#1a1625,#2a2440);
        display:flex;align-items:center;justify-content:center;
        font-family:'Nunito',sans-serif;padding:20px;`;
      overlay.innerHTML = `
        <div style="background:#251f38;border:1px solid rgba(200,180,255,.15);
                    border-radius:20px;padding:36px 28px;max-width:360px;
                    width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5)">
          <div style="font-size:3rem;margin-bottom:8px">🚀</div>
          <h2 style="font-family:'Baloo 2',cursive;font-size:1.6rem;font-weight:800;
                     background:linear-gradient(135deg,#f0eaff,#ce93d8);
                     -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                     background-clip:text;margin-bottom:4px">QuizBlast</h2>
          <p style="color:#b8a9d9;font-size:.78rem;font-weight:700;margin-bottom:24px">
            Learn · Play · Level Up</p>

          <div id="sbError" style="display:none;background:rgba(239,154,154,.12);
                border:1px solid rgba(239,154,154,.3);border-radius:10px;
                padding:8px 12px;color:#ef9a9a;font-size:.78rem;font-weight:800;
                margin-bottom:12px"></div>

          <p style="color:#b8a9d9;font-size:.72rem;font-weight:700;
                   margin-bottom:8px;text-align:left">
            👤 Username (no email, no spaces)</p>
          <input id="sbUsername" type="text" maxlength="20"
            placeholder="e.g. Harendra123"
            autocomplete="username" autocorrect="off" autocapitalize="off"
            style="width:100%;padding:12px 16px;background:#2a2440;
                   border:2px solid rgba(200,180,255,.15);border-radius:12px;
                   color:#f0eaff;font-family:'Nunito',sans-serif;font-size:.9rem;
                   font-weight:700;outline:none;margin-bottom:10px;
                   box-sizing:border-box"/>
          <p style="color:#b8a9d9;font-size:.72rem;font-weight:700;
                   margin-bottom:8px;text-align:left">
            🔒 Password (min 6 characters)</p>
          <input id="sbPassword" type="password" maxlength="40"
            placeholder="Password"
            autocomplete="current-password"
            style="width:100%;padding:12px 16px;background:#2a2440;
                   border:2px solid rgba(200,180,255,.15);border-radius:12px;
                   color:#f0eaff;font-family:'Nunito',sans-serif;font-size:.9rem;
                   font-weight:700;outline:none;margin-bottom:16px;
                   box-sizing:border-box"/>

          <button id="sbLoginBtn" onclick="SBLoginUI.login()"
            style="width:100%;padding:13px;border:none;border-radius:50px;
                   background:linear-gradient(135deg,#b39ddb,#ce93d8);
                   color:#2d2040;font-family:'Nunito',sans-serif;font-size:.95rem;
                   font-weight:900;cursor:pointer;margin-bottom:10px;
                   box-shadow:0 4px 16px rgba(179,157,219,.3)">
            🔓 Login
          </button>
          <button id="sbSignupBtn" onclick="SBLoginUI.switchMode()"
            style="width:100%;padding:11px;border:2px solid rgba(200,180,255,.2);
                   border-radius:50px;background:transparent;
                   color:#b8a9d9;font-family:'Nunito',sans-serif;
                   font-size:.85rem;font-weight:800;cursor:pointer">
            ✨ Create Account
          </button>
          <p id="sbModeLabel" style="color:#b8a9d9;font-size:.72rem;
             font-weight:700;margin-top:14px">
            New here? Create an account above!</p>

          <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(200,180,255,.1)">
            <button onclick="SBLoginUI.playAsGuest()"
              style="width:100%;padding:10px;border:1px solid rgba(200,180,255,.15);
                     border-radius:50px;background:transparent;
                     color:#6b7280;font-family:'Nunito',sans-serif;
                     font-size:.78rem;font-weight:700;cursor:pointer">
              👻 Guest ke roop mein khelo (Leaderboard nahi)
            </button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      // Enter key support
      overlay.addEventListener('keydown', e => {
        if (e.key === 'Enter') SBLoginUI.login();
      });
    }
    overlay.style.display = 'flex';
    document.getElementById('sbUsername')?.focus();
  }

  function hide() {
    const el = document.getElementById('sbLoginOverlay');
    if (el) el.style.display = 'none';
  }

  let _isSignup = false;
  function switchMode() {
    _isSignup = !_isSignup;
    const loginBtn  = document.getElementById('sbLoginBtn');
    const signupBtn = document.getElementById('sbSignupBtn');
    const label     = document.getElementById('sbModeLabel');
    if (_isSignup) {
      loginBtn.textContent  = '✨ Create Account';
      signupBtn.textContent = '← Back to Login';
      label.textContent     = 'Choose a username and strong password!';
    } else {
      loginBtn.textContent  = '🔓 Login';
      signupBtn.textContent = '✨ Create Account';
      label.textContent     = 'New here? Create an account above!';
    }
    _setError('');
  }

  function _setError(msg) {
    const el = document.getElementById('sbError');
    if (!el) return;
    if (msg) { el.textContent = msg; el.style.display = 'block'; }
    else      { el.style.display = 'none'; }
  }

  function _setLoading(loading) {
    const btn = document.getElementById('sbLoginBtn');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? '⏳ Please wait…' : (_isSignup ? '✨ Create Account' : '🔓 Login');
  }

  async function login() {
    const username = document.getElementById('sbUsername')?.value.trim();
    const password = document.getElementById('sbPassword')?.value;
    if (!username || username.length < 3) { _setError('⚠️ Username min 3 characters!'); return; }
    if (username.includes('@')) { _setError('⚠️ Username mein @ mat daalo — sirf naam likhao (e.g. Harendra123)'); return; }
    if (username.includes(' ')) { _setError('⚠️ Username mein space nahi — e.g. Harendra123'); return; }
    if (!password || password.length < 6) { _setError('⚠️ Password min 6 characters!'); return; }
    _setError(''); _setLoading(true);
    try {
      if (_isSignup) {
        await SBAuth.signUp(username, password);
        _setError(''); _setLoading(false);
        // Auto login after signup
        await SBAuth.signIn(username, password);
      } else {
        await SBAuth.signIn(username, password);
      }
      await SBPlayer.pull();
      hide();
      // Go to game
      if (typeof App !== 'undefined') App.init();
    } catch(e) {
      _setLoading(false);
      const msg = e.message || '';
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('Username already registered')) {
        _setError('Username taken! Try another.');
      } else if (msg.includes('Invalid login') || msg.includes('credentials')) {
        _setError('Wrong username or password!');
      } else if (msg.includes('rate limit')) {
        _setError('Too many attempts. Wait a minute.');
      } else {
        _setError(msg || 'Something went wrong. Try again.');
      }
    }
  }

  // Guest mode — play without account, no leaderboard
  function playAsGuest() {
    localStorage.setItem('qb_guest_mode', '1');
    hide();
    if (typeof App !== 'undefined') App.init();
  }

  return { show, hide, login, switchMode, playAsGuest };
})();

/* ════════════════════════════════════════════════════════════
   GLOBAL LEADERBOARD SCREEN — replaces local leaderboard
════════════════════════════════════════════════════════════ */
const SBLeaderboardUI = {
  async render() {
    const container = document.getElementById('lbContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text2);font-weight:700">⏳ Loading…</div>';
    try {
      const entries = await SBLeaderboard.getTop(20);
      if (!entries.length) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text2);font-weight:700">No scores yet. Be the first! 🏆</div>';
        return;
      }
      container.innerHTML = entries.map((e, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
                    background:var(--card);border:1px solid var(--border);
                    border-radius:12px;margin:0 14px 8px;">
          <div style="font-family:'Baloo 2',cursive;font-size:1.2rem;font-weight:800;
                      color:${i===0?'#ffe082':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text2)'};
                      width:28px;text-align:center">
            ${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
          </div>
          <div style="font-size:1.8rem">${e.avatar||'👤'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:.95rem;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.username}</div>
            <div style="font-size:.68rem;color:var(--text2);font-weight:700;margin-top:2px">
              ${e.score} pts · ${e.accuracy||0}% · ${e.subject||'gk'}</div>
          </div>
          <div style="font-family:'Baloo 2',cursive;font-size:1rem;font-weight:800;color:var(--gold)">
            ${e.score}
          </div>
        </div>`).join('');
    } catch(e) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--red);font-weight:700">⚠️ Could not load. Check connection.</div>';
    }
  }
};


/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS — Admin se player ko message
════════════════════════════════════════════════════════════ */
const SBNotifications = (() => {

  async function check() {
    if (!SBAuth.isLoggedIn()) return;
    try {
      const { data, error } = await _sb
        .from('notifications')
        .select('*')
        .eq('user_id', SBAuth.getUser().id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error || !data || !data.length) return;

      // Show each notification one by one
      for (const notif of data) {
        await showNotif(notif);
        // Mark as read
        await _sb.from('notifications')
          .update({ is_read: true })
          .eq('id', notif.id);
      }
    } catch(e) {
      console.warn('Notification check failed:', e);
    }
  }

  function showNotif(notif) {
    return new Promise((resolve) => {
      // Remove existing
      const existing = document.getElementById('sbNotifOverlay');
      if (existing) existing.remove();

      const colors = {
        coins:   { bg: '#ffe082', icon: '🪙', grad: 'linear-gradient(135deg,#ffe082,#ffcc80)' },
        xp:      { bg: '#ce93d8', icon: '⚡', grad: 'linear-gradient(135deg,#b39ddb,#ce93d8)' },
        info:    { bg: '#80deea', icon: '📢', grad: 'linear-gradient(135deg,#80deea,#4dd0e1)' },
        warning: { bg: '#ef9a9a', icon: '⚠️', grad: 'linear-gradient(135deg,#ef9a9a,#e57373)' },
      };
      const c = colors[notif.type] || colors.info;

      const overlay = document.createElement('div');
      overlay.id = 'sbNotifOverlay';
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:999999;
        background:rgba(0,0,0,0.6);
        display:flex;align-items:center;justify-content:center;
        padding:20px;font-family:'Nunito',sans-serif;
        animation:fadeIn .3s ease;`;

      overlay.innerHTML = `
        <div style="background:#251f38;border:2px solid rgba(200,180,255,.2);
                    border-radius:20px;padding:32px 24px;max-width:340px;
                    width:100%;text-align:center;
                    box-shadow:0 24px 60px rgba(0,0,0,.6);
                    animation:popIn .4s cubic-bezier(.36,.07,.19,.97) both">

          <div style="width:64px;height:64px;border-radius:50%;
                      background:${c.grad};
                      display:flex;align-items:center;justify-content:center;
                      font-size:2rem;margin:0 auto 16px">
            ${c.icon}
          </div>

          <h3 style="font-family:'Baloo 2',cursive;font-size:1.3rem;font-weight:800;
                     color:#f0eaff;margin-bottom:10px">
            ${notif.title}
          </h3>

          <p style="color:#b8a9d9;font-size:.88rem;font-weight:700;
                    line-height:1.5;margin-bottom:20px">
            ${notif.message}
          </p>

          <div style="font-size:.68rem;color:#6b7280;font-weight:700;margin-bottom:16px">
            ${new Date(notif.created_at).toLocaleString('en-IN')}
          </div>

          <button onclick="document.getElementById('sbNotifOverlay').remove()"
            style="width:100%;padding:12px;border:none;border-radius:50px;
                   background:${c.grad};
                   color:#2d2040;font-family:'Nunito',sans-serif;
                   font-size:.95rem;font-weight:900;cursor:pointer">
            ✅ Got it!
          </button>
        </div>`;

      document.body.appendChild(overlay);

      // Auto resolve when closed
      const btn = overlay.querySelector('button');
      btn.addEventListener('click', () => {
        setTimeout(resolve, 200);
      });
    });
  }

  // Check every 2 minutes while game is open
  function startPolling() {
    check(); // Check immediately on load
    setInterval(check, 120000); // Then every 2 minutes
  }

  return { check, startPolling };
})();

console.log('✅ QuizBlast Supabase layer loaded');
