// ══════════════════════════════════════════════════════════════
//  QuizBlast — Online PvP Module
//  File: js/pvp_online.js
//  Yeh file index.html mein supabase.js ke BAAD include karo
// ══════════════════════════════════════════════════════════════

const PvPOnline = (() => {
  // ── State ──────────────────────────────────────────────────
  let _roomId       = null;
  let _myRole       = null;   // 'player1' | 'player2'
  let _channel      = null;   // Supabase Realtime channel
  let _questions    = [];
  let _qIdx         = 0;
  let _score        = 0;
  let _answered     = false;
  let _timer        = null;
  let _timeLeft     = 15;
  let _betCoins     = 0;
  let _opponentDone = false;
  let _opponentScore= 0;
  let _opponentName = '...';
  let _opponentAvatar = '🐉';
  let _matchTimeout = null;
  const ROUND_TIME  = 15;

  // ── Helpers ────────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const profile = () => SBAuth.getProfile();
  const user    = () => SBAuth.getUser();

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Open PvP Online Hub ────────────────────────────────────
  function open() {
    if (!SBAuth.isLoggedIn()) {
      alert('Online PvP ke liye pehle login karo!');
      return;
    }
    App.goTo('screen-pvp-online');
    _renderHistory();
  }

  // ── Matchmaking ────────────────────────────────────────────
  async function findMatch() {
    const p = profile();
    if (!p) return;

    const cfg = SelectScreen.get(); // subject, class from existing selection
    const subject = cfg?.subject || 'gk';
    const cls     = cfg?.cls     || 1;
    _betCoins     = parseInt($('pvpBetInput')?.value || 0) || 0;

    // Check coins enough
    if (_betCoins > 0 && p.coins < _betCoins) {
      alert(`Tumhare paas sirf ${p.coins} coins hain!`);
      return;
    }

    _setStatus('🔍 Dushra player dhundh raha hoon...');
    $('pvpFindBtn').disabled = true;

    try {
      // 1. Koi waiting room hai?
      const { data: waiting } = await _sb
        .from('pvp_rooms')
        .select('*')
        .eq('status', 'waiting')
        .eq('subject', subject)
        .eq('class', cls)
        .eq('bet_coins', _betCoins)
        .neq('player1_id', user().id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (waiting) {
        // Join as player2
        await _joinRoom(waiting, subject, cls);
      } else {
        // Create new room as player1
        await _createRoom(subject, cls);
      }
    } catch (e) {
      console.error('Matchmaking error:', e);
      _setStatus('❌ Error! Dobara try karo.');
      $('pvpFindBtn').disabled = false;
    }

    // Timeout agar 30 sec mein match na mile
    _matchTimeout = setTimeout(() => {
      if (_roomId) {
        // Cancel the room
        _sb.from('pvp_rooms').delete().eq('id', _roomId).eq('status', 'waiting');
        _roomId = null;
      }
      _setStatus('😔 Koi player nahi mila. Dobara try karo!');
      $('pvpFindBtn').disabled = false;
    }, 30000);
  }

  async function _createRoom(subject, cls) {
    const p = profile();
    const { data: room, error } = await _sb.from('pvp_rooms').insert({
      status:         'waiting',
      player1_id:     user().id,
      player1_name:   p.username  || 'Player',
      player1_avatar: p.avatar    || '🐉',
      subject, class: cls,
      bet_coins:      _betCoins,
    }).select().single();

    if (error) throw error;
    _roomId  = room.id;
    _myRole  = 'player1';
    _setStatus('⏳ Waiting for opponent...');
    _subscribeRoom();
  }

  async function _joinRoom(room, subject, cls) {
    clearTimeout(_matchTimeout);
    const p = profile();
    const { error } = await _sb.from('pvp_rooms').update({
      status:         'matched',
      player2_id:     user().id,
      player2_name:   p.username  || 'Player',
      player2_avatar: p.avatar    || '🐉',
    }).eq('id', room.id);

    if (error) throw error;
    _roomId         = room.id;
    _myRole         = 'player2';
    _opponentName   = room.player1_name;
    _opponentAvatar = room.player1_avatar;
    _subscribeRoom();
    await _startBattle(subject, cls);
  }

  // ── Realtime Subscription ──────────────────────────────────
  function _subscribeRoom() {
    if (_channel) _channel.unsubscribe();

    _channel = _sb
      .channel(`pvp_room_${_roomId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'pvp_rooms',
        filter: `id=eq.${_roomId}`
      }, payload => _handleRoomUpdate(payload.new))
      .subscribe();
  }

  async function _handleRoomUpdate(room) {
    // Player2 joined — player1 gets this
    if (_myRole === 'player1' && room.status === 'matched') {
      clearTimeout(_matchTimeout);
      _opponentName   = room.player2_name;
      _opponentAvatar = room.player2_avatar;
      await _startBattle(room.subject, room.class);
    }

    // Opponent score update
    if (_myRole === 'player1' && room.player2_score !== _opponentScore) {
      _opponentScore = room.player2_score;
      _updateLiveScore();
    }
    if (_myRole === 'player2' && room.player1_score !== _opponentScore) {
      _opponentScore = room.player1_score;
      _updateLiveScore();
    }

    // Both done — show result
    if (room.player1_done && room.player2_done && room.status === 'finished') {
      _showResult(room);
    }
  }

  // ── Battle Start ───────────────────────────────────────────
  async function _startBattle(subject, cls) {
    _setStatus('✅ Match mil gaya! Loading...');

    // Load questions
    try {
      const res = await fetch(`questions/class${cls}/${subject}.json`);
      const all = await res.json();
      _questions = shuffle(all).slice(0, 10);
    } catch (e) {
      _questions = [];
      alert('Questions load nahi hue!');
      return;
    }

    _qIdx    = 0;
    _score   = 0;
    _answered = false;

    // Show battle screen
    App.goTo('screen-pvp-online-battle');
    _renderBattleHeader();
    _loadQuestion();
  }

  // ── Question Rendering ─────────────────────────────────────
  function _renderBattleHeader() {
    const p = profile();
    if ($('pvpOnlineMyName'))    $('pvpOnlineMyName').textContent    = p?.username || 'You';
    if ($('pvpOnlineMyAvatar'))  $('pvpOnlineMyAvatar').textContent  = p?.avatar   || '🐉';
    if ($('pvpOnlineOppName'))   $('pvpOnlineOppName').textContent   = _opponentName;
    if ($('pvpOnlineOppAvatar')) $('pvpOnlineOppAvatar').textContent = _opponentAvatar;
    _updateLiveScore();
  }

  function _updateLiveScore() {
    if ($('pvpOnlineMyScore'))  $('pvpOnlineMyScore').textContent  = _score;
    if ($('pvpOnlineOppScore')) $('pvpOnlineOppScore').textContent = _opponentDone ? _opponentScore : '...';
  }

  function _loadQuestion() {
    if (_qIdx >= _questions.length) { _finishMyGame(); return; }

    const q = _questions[_qIdx];
    _answered = false;
    _timeLeft = ROUND_TIME;

    if ($('pvpOnlineQNum'))  $('pvpOnlineQNum').textContent  = `Q${_qIdx + 1}/${_questions.length}`;
    if ($('pvpOnlineQText')) $('pvpOnlineQText').textContent = q.q;

    const optsEl = $('pvpOnlineOpts');
    if (!optsEl) return;
    optsEl.innerHTML = '';
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'pvp-online-opt';
      btn.textContent = opt;
      btn.onclick = () => _answer(i, btn, q.ans);
      optsEl.appendChild(btn);
    });

    _startTimer();
  }

  function _startTimer() {
    clearInterval(_timer);
    _updateTimerUI();
    _timer = setInterval(() => {
      _timeLeft--;
      _updateTimerUI();
      if (_timeLeft <= 0) {
        clearInterval(_timer);
        if (!_answered) _answer(-1, null, _questions[_qIdx].ans);
      }
    }, 1000);
  }

  function _updateTimerUI() {
    if ($('pvpOnlineTimer')) {
      $('pvpOnlineTimer').textContent = _timeLeft;
      $('pvpOnlineTimer').style.color = _timeLeft <= 5 ? '#f43f5e' : '#4ade80';
    }
  }

  function _answer(idx, btn, correct) {
    if (_answered) return;
    _answered = true;
    clearInterval(_timer);

    const opts = document.querySelectorAll('.pvp-online-opt');
    opts.forEach(b => b.disabled = true);

    if (idx === correct) {
      _score += 10 + _timeLeft; // Bonus for speed
      if (btn) btn.style.background = 'rgba(74,222,128,.3)';
      if (btn) btn.style.borderColor = '#4ade80';
    } else {
      if (btn) btn.style.background = 'rgba(244,63,94,.3)';
      if (btn) btn.style.borderColor = '#f43f5e';
      opts[correct].style.background   = 'rgba(74,222,128,.3)';
      opts[correct].style.borderColor  = '#4ade80';
    }

    _updateLiveScore();

    // Push my score update to DB
    const scoreField = _myRole === 'player1' ? 'player1_score' : 'player2_score';
    _sb.from('pvp_rooms').update({ [scoreField]: _score }).eq('id', _roomId);

    setTimeout(() => {
      _qIdx++;
      _loadQuestion();
    }, 900);
  }

  // ── Finish ─────────────────────────────────────────────────
  async function _finishMyGame() {
    clearInterval(_timer);
    const doneField  = _myRole === 'player1' ? 'player1_done'  : 'player2_done';
    const scoreField = _myRole === 'player1' ? 'player1_score' : 'player2_score';

    // Mark done + final score
    const { data: room } = await _sb.from('pvp_rooms')
      .update({ [doneField]: true, [scoreField]: _score, status: 'finished' })
      .eq('id', _roomId)
      .select()
      .single();

    // Show waiting screen if opponent not done yet
    if (room && !(room.player1_done && room.player2_done)) {
      if ($('pvpOnlineQText')) $('pvpOnlineQText').textContent = '⏳ Waiting for opponent...';
      if ($('pvpOnlineOpts'))  $('pvpOnlineOpts').innerHTML = '';
      if ($('pvpOnlineTimer')) $('pvpOnlineTimer').textContent = '✓';
    }
  }

  // ── Result Screen ──────────────────────────────────────────
  async function _showResult(room) {
    if (_channel) _channel.unsubscribe();

    const myScore  = _myRole === 'player1' ? room.player1_score : room.player2_score;
    const oppScore = _myRole === 'player1' ? room.player2_score : room.player1_score;
    const won      = myScore > oppScore;
    const draw     = myScore === oppScore;

    App.goTo('screen-pvp-online-result');

    if ($('pvpResTitle')) {
      $('pvpResTitle').textContent = draw ? '🤝 DRAW!' : won ? '🏆 YOU WON!' : '😢 YOU LOST!';
      $('pvpResTitle').style.color = draw ? '#f59e0b' : won ? '#4ade80' : '#f43f5e';
    }
    if ($('pvpResMyScore'))  $('pvpResMyScore').textContent  = myScore;
    if ($('pvpResOppScore')) $('pvpResOppScore').textContent = oppScore;
    if ($('pvpResOppName'))  $('pvpResOppName').textContent  = _opponentName;
    if ($('pvpResMyName'))   $('pvpResMyName').textContent   = profile()?.username || 'You';

    // Coins
    let coinsChange = 0;
    if (_betCoins > 0) {
      coinsChange = won ? _betCoins : draw ? 0 : -_betCoins;
      if (coinsChange !== 0) {
        await _sb.from('profiles').update({
          coins: (profile()?.coins || 0) + coinsChange
        }).eq('id', user().id);
      }
      if ($('pvpResCoins')) {
        $('pvpResCoins').textContent = coinsChange > 0
          ? `+${coinsChange} 🪙 Jeete!`
          : coinsChange < 0
          ? `${coinsChange} 🪙 Haare`
          : 'No coins change (Draw)';
        $('pvpResCoins').style.color = coinsChange > 0 ? '#4ade80' : coinsChange < 0 ? '#f43f5e' : '#f59e0b';
      }
    } else {
      if ($('pvpResCoins')) $('pvpResCoins').textContent = '';
    }

    // Save to history
    if (!draw) {
      const winnerId   = won ? user().id : null;
      const loserId    = won ? null      : user().id;
      const winnerName = won ? (profile()?.username || 'Player') : _opponentName;
      const loserName  = won ? _opponentName : (profile()?.username || 'Player');
      await _sb.from('pvp_history').insert({
        room_id:      _roomId,
        winner_id:    room.winner_id || winnerId,
        loser_id:     loserId,
        winner_name:  winnerName,
        loser_name:   loserName,
        winner_score: Math.max(myScore, oppScore),
        loser_score:  Math.min(myScore, oppScore),
        subject:      room.subject,
        class:        room.class,
        coins_won:    _betCoins,
      });
    }

    _reset();
    _renderHistory();
  }

  // ── Match History ──────────────────────────────────────────
  async function _renderHistory() {
    const el = $('pvpOnlineHistory');
    if (!el || !SBAuth.isLoggedIn()) return;

    const uid = user().id;
    const { data } = await _sb.from('pvp_history')
      .select('*')
      .or(`winner_id.eq.${uid},loser_id.eq.${uid}`)
      .order('played_at', { ascending: false })
      .limit(10);

    if (!data || !data.length) {
      el.innerHTML = '<div style="color:var(--text2);font-size:.85rem;text-align:center;padding:12px">No matches yet!</div>';
      return;
    }

    el.innerHTML = data.map(m => {
      const won  = m.winner_id === uid;
      const opp  = won ? m.loser_name : m.winner_name;
      const ms   = won ? m.winner_score : m.loser_score;
      const os   = won ? m.loser_score  : m.winner_score;
      return `
        <div class="pvp-hist-row">
          <span style="color:${won?'#4ade80':'#f43f5e'};font-weight:900">${won?'WIN':'LOSS'}</span>
          <span>vs ${opp}</span>
          <span style="color:#f59e0b">${ms} - ${os}</span>
          <span style="color:var(--text2);font-size:.75rem">${m.subject}</span>
        </div>`;
    }).join('');
  }

  // ── Reset ──────────────────────────────────────────────────
  function _reset() {
    clearInterval(_timer);
    clearTimeout(_matchTimeout);
    if (_channel) { _channel.unsubscribe(); _channel = null; }
    _roomId = null; _myRole = null;
    _questions = []; _qIdx = 0; _score = 0;
    _opponentDone = false; _opponentScore = 0;
  }

  function cancel() {
    if (_roomId) _sb.from('pvp_rooms').delete().eq('id', _roomId).eq('status', 'waiting');
    _reset();
    App.goTo('screen-pvp-hub');
  }

  function playAgain() { _reset(); open(); }

  // ── Status Helper ──────────────────────────────────────────
  function _setStatus(msg) {
    if ($('pvpOnlineStatus')) $('pvpOnlineStatus').textContent = msg;
  }

  return { open, findMatch, cancel, playAgain };
})();
