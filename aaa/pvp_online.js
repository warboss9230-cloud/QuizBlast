// ══════════════════════════════════════════════════════════════
//  QuizBlast — Online PvP Module v2
//  Features: Matchmaking, Quick Chat, Streak Bonus,
//            Season Leaderboard, Player Profile Card,
//            Challenge Mode, Rank System
// ══════════════════════════════════════════════════════════════

const PvPOnline = (() => {
  let _roomId=null,_myRole=null,_channel=null,_chatChannel=null;
  let _questions=[],_qIdx=0,_score=0,_answered=false;
  let _timer=null,_timeLeft=15,_betCoins=0;
  let _opponentDone=false,_opponentScore=0;
  let _opponentName='...',_opponentAvatar='🐉',_opponentId=null;
  let _matchTimeout=null,_myStreak=0,_challengeId=null;
  const ROUND_TIME=15;
  const QUICK_CHATS=['👋 Hi!','🔥 GG!','😎 Nice!','💪 Let\'s go!','😂 Haha!','🙏 Good game!','⚡ Too fast!','😤 Rematch!'];
  const RANK_ICONS={Bronze:'🥉',Silver:'🥈',Gold:'🥇',Diamond:'💎'};
  const STREAK_BONUS={3:50,5:100,10:250};

  const $=id=>document.getElementById(id);
  const profile=()=>SBAuth.getProfile();
  const user=()=>SBAuth.getUser();
  function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  // ── Open Hub ──────────────────────────────────────────────
  async function open() {
    if(!SBAuth.isLoggedIn()){alert('Online PvP ke liye pehle login karo!');return;}
    App.goTo('screen-pvp-online');
    await _ensureStats();
    _renderMyStats();
    _renderHistory();
    _renderSeasonLeaderboard();
    _listenChallenges();
  }

  // ── Stats ─────────────────────────────────────────────────
  async function _ensureStats(){
    const p=profile();if(!p)return;
    const{data}=await _sb.from('pvp_stats').select('*').eq('user_id',user().id).maybeSingle();
    if(!data)await _sb.from('pvp_stats').insert({user_id:user().id,username:p.username||'Player',avatar:p.avatar||'🐉'});
    _myStreak=data?.win_streak||0;
  }

  async function _updateStats(won){
    const p=profile();
    const{data:st}=await _sb.from('pvp_stats').select('*').eq('user_id',user().id).maybeSingle();
    if(!st)return{streakBonus:0,streak:0};
    const newStreak=won?st.win_streak+1:0;
    const bestStreak=Math.max(st.best_streak,newStreak);
    const newRP=Math.max(0,st.rank_points+(won?30:-15));
    let newRank='Bronze';
    if(newRP>=2000)newRank='Diamond';else if(newRP>=1000)newRank='Gold';else if(newRP>=400)newRank='Silver';
    await _sb.from('pvp_stats').update({
      username:p.username||'Player',avatar:p.avatar||'🐉',
      total_wins:won?st.total_wins+1:st.total_wins,
      total_losses:won?st.total_losses:st.total_losses+1,
      win_streak:newStreak,best_streak:bestStreak,
      rank_points:newRP,rank:newRank,
      season_wins:won?st.season_wins+1:st.season_wins,
      season_points:won?st.season_points+30:st.season_points,
      updated_at:new Date().toISOString(),
    }).eq('user_id',user().id);
    _myStreak=newStreak;
    const bonus=won&&STREAK_BONUS[newStreak]?STREAK_BONUS[newStreak]:0;
    if(bonus>0){const coins=(p.coins||0)+bonus;await _sb.from('profiles').update({coins}).eq('id',user().id);}
    return{streakBonus:bonus,streak:newStreak};
  }

  async function _renderMyStats(){
    const el=$('pvpMyStatsBox');if(!el)return;
    const{data}=await _sb.from('pvp_stats').select('*').eq('user_id',user().id).maybeSingle();
    if(!data)return;
    const ri=RANK_ICONS[data.rank]||'🥉';
    el.innerHTML=`<div style="display:flex;gap:14px;align-items:center">
      <div style="text-align:center"><div style="font-size:1.8rem">${ri}</div>
        <div style="font-size:.72rem;font-weight:900;color:#f59e0b">${data.rank}</div>
        <div style="font-size:.68rem;color:var(--text2)">${data.rank_points}RP</div></div>
      <div style="display:flex;flex-direction:column;gap:3px;flex:1">
        <div style="font-size:.8rem;font-weight:800;color:#4ade80">🏆 ${data.total_wins}W · 💀 ${data.total_losses}L</div>
        <div style="font-size:.8rem;font-weight:800;color:#f59e0b">🔥 Streak: ${data.win_streak} (Best: ${data.best_streak})</div>
        <div style="font-size:.8rem;font-weight:800;color:#a855f7">📅 Season: ${data.season_wins}W · ${data.season_points}pts</div>
      </div></div>`;
  }

  // ── Matchmaking ───────────────────────────────────────────
  async function findMatch(){
    const p=profile();if(!p)return;
    const cfg=SelectScreen.get();
    const subject=cfg?.subject||'gk',cls=cfg?.cls||1;
    _betCoins=parseInt($('pvpBetInput')?.value||0)||0;
    if(_betCoins>0&&p.coins<_betCoins){alert(`Sirf ${p.coins} coins hain!`);return;}
    _setStatus('🔍 Player dhundh raha hoon...');
    $('pvpFindBtn').disabled=true;
    try{
      const{data:waiting}=await _sb.from('pvp_rooms').select('*')
        .eq('status','waiting').eq('subject',subject).eq('class',cls)
        .eq('bet_coins',_betCoins).neq('player1_id',user().id)
        .order('created_at',{ascending:true}).limit(1).maybeSingle();
      if(waiting)await _joinRoom(waiting,subject,cls);
      else await _createRoom(subject,cls);
    }catch(e){_setStatus('❌ Error! Dobara try karo.');$('pvpFindBtn').disabled=false;}
    _matchTimeout=setTimeout(async()=>{
      if(_roomId){await _sb.from('pvp_rooms').delete().eq('id',_roomId).eq('status','waiting');_roomId=null;}
      _setStatus('😔 Koi player nahi mila.');$('pvpFindBtn').disabled=false;
    },30000);
  }

  async function _createRoom(subject,cls){
    const p=profile();
    const{data:room,error}=await _sb.from('pvp_rooms').insert({
      status:'waiting',player1_id:user().id,
      player1_name:p.username||'Player',player1_avatar:p.avatar||'🐉',
      player1_streak:_myStreak,subject,class:cls,bet_coins:_betCoins,
    }).select().single();
    if(error)throw error;
    _roomId=room.id;_myRole='player1';
    _setStatus('⏳ Opponent ka wait kar raha hoon...');
    _subscribeRoom();
  }

  async function _joinRoom(room,subject,cls){
    clearTimeout(_matchTimeout);
    const p=profile();
    const{error}=await _sb.from('pvp_rooms').update({
      status:'matched',player2_id:user().id,
      player2_name:p.username||'Player',player2_avatar:p.avatar||'🐉',
      player2_streak:_myStreak,
    }).eq('id',room.id);
    if(error)throw error;
    _roomId=room.id;_myRole='player2';
    _opponentName=room.player1_name;_opponentAvatar=room.player1_avatar;_opponentId=room.player1_id;
    _subscribeRoom();
    await _showOpponentCard(room.player1_id,room.player1_name,room.player1_avatar,room.player1_streak||0);
    await _startBattle(subject,cls);
  }

  // ── Challenge Mode ────────────────────────────────────────
  async function sendChallenge(){
    const targetName=$('pvpChallengeInput')?.value?.trim();
    if(!targetName){alert('Username daalo!');return;}
    const p=profile();const cfg=SelectScreen.get();
    const{data:target}=await _sb.from('profiles').select('id,username,avatar').eq('username',targetName).maybeSingle();
    if(!target){alert('Player nahi mila!');return;}
    if(target.id===user().id){alert('Apne aap ko challenge nahi kar sakte!');return;}
    const{error}=await _sb.from('pvp_challenges').insert({
      challenger_id:user().id,challenger_name:p.username||'Player',challenger_avatar:p.avatar||'🐉',
      challenged_id:target.id,subject:cfg?.subject||'gk',class:cfg?.cls||1,
      bet_coins:parseInt($('pvpBetInput')?.value||0)||0,
    });
    if(error){alert('Challenge nahi bheja!');return;}
    _setStatus(`✅ Challenge bheja ${targetName} ko!`);
  }

  function _listenChallenges(){
    if(!SBAuth.isLoggedIn())return;
    _sb.channel('my_challenges_'+user().id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'pvp_challenges',filter:`challenged_id=eq.${user().id}`},
        payload=>_showIncomingChallenge(payload.new)).subscribe();
  }

  function _showIncomingChallenge(ch){
    const el=$('pvpIncomingChallenge');if(!el)return;
    el.style.display='block';
    el.innerHTML=`<div style="background:rgba(168,85,247,.15);border:2px solid #a855f7;border-radius:16px;padding:14px;margin:8px 0">
      <div style="font-weight:900;color:#c084fc;margin-bottom:8px">⚔️ ${ch.challenger_name} ne challenge kiya!</div>
      <div style="font-size:.8rem;color:var(--text2);margin-bottom:10px">
        ${ch.subject} · Class ${ch.class}${ch.bet_coins?` · 🪙${ch.bet_coins}`:''}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1;padding:10px;font-size:.85rem"
          onclick="PvPOnline.acceptChallenge('${ch.id}','${ch.challenger_id}','${ch.subject}',${ch.class},${ch.bet_coins||0})">✅ Accept</button>
        <button class="btn btn-ghost" style="flex:1;padding:10px;font-size:.85rem"
          onclick="PvPOnline.declineChallenge('${ch.id}')">❌ Decline</button>
      </div></div>`;
  }

  async function acceptChallenge(cId,challengerId,subject,cls,bet){
    _betCoins=bet||0;_challengeId=cId;
    await _sb.from('pvp_challenges').update({status:'accepted'}).eq('id',cId);
    const{data:ch}=await _sb.from('profiles').select('username,avatar').eq('id',challengerId).maybeSingle();
    _opponentName=ch?.username||'Player';_opponentAvatar=ch?.avatar||'🐉';_opponentId=challengerId;
    const p=profile();
    const{data:room}=await _sb.from('pvp_rooms').insert({
      status:'matched',
      player1_id:user().id,player1_name:p.username||'Player',player1_avatar:p.avatar||'🐉',
      player2_id:challengerId,player2_name:_opponentName,player2_avatar:_opponentAvatar,
      subject,class:cls,bet_coins:_betCoins,
    }).select().single();
    await _sb.from('pvp_challenges').update({room_id:room.id}).eq('id',cId);
    _roomId=room.id;_myRole='player1';
    if($('pvpIncomingChallenge'))$('pvpIncomingChallenge').style.display='none';
    _subscribeRoom();
    await _showOpponentCard(challengerId,_opponentName,_opponentAvatar,0);
    await _startBattle(subject,cls);
  }

  async function declineChallenge(cId){
    await _sb.from('pvp_challenges').update({status:'declined'}).eq('id',cId);
    if($('pvpIncomingChallenge'))$('pvpIncomingChallenge').style.display='none';
  }

  // ── Player Profile Card ───────────────────────────────────
  async function _showOpponentCard(oppId,oppName,oppAvatar,oppStreak){
    const{data:st}=await _sb.from('pvp_stats').select('*').eq('user_id',oppId).maybeSingle();
    const mySt=await _sb.from('pvp_stats').select('*').eq('user_id',user().id).maybeSingle().then(r=>r.data);
    const myP=profile();
    App.goTo('screen-pvp-profile-card');
    const el=$('pvpProfileCard');if(!el)return;
    el.innerHTML=`
      <div style="text-align:center;margin-bottom:16px;font-size:1.4rem;font-weight:900;color:#a855f7">⚔️ MATCH FOUND!</div>
      <div style="display:flex;justify-content:space-around;align-items:center">
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
          <div style="font-size:2.8rem">${myP?.avatar||'🐉'}</div>
          <div style="font-weight:900;color:#4ade80">${myP?.username||'You'}</div>
          <div style="font-size:.75rem;color:var(--text2)">${RANK_ICONS[mySt?.rank||'Bronze']} ${mySt?.rank||'Bronze'}</div>
          <div style="font-size:.75rem;color:#f59e0b">🔥 ${mySt?.win_streak||0} streak</div>
          <div style="font-size:.75rem;color:#4ade80">🏆 ${mySt?.total_wins||0} wins</div>
        </div>
        <div style="font-size:2rem;font-weight:900;color:rgba(255,255,255,.3)">VS</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
          <div style="font-size:2.8rem">${oppAvatar}</div>
          <div style="font-weight:900;color:#f43f5e">${oppName}</div>
          <div style="font-size:.75rem;color:var(--text2)">${RANK_ICONS[st?.rank||'Bronze']} ${st?.rank||'Bronze'}</div>
          <div style="font-size:.75rem;color:#f59e0b">🔥 ${oppStreak||st?.win_streak||0} streak</div>
          <div style="font-size:.75rem;color:#4ade80">🏆 ${st?.total_wins||0} wins</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:18px;color:var(--text2);font-weight:800">
        Starting in <span id="pvpCardCountdown" style="color:#a855f7;font-size:1.2rem;font-weight:900">3</span>
      </div>`;
    return new Promise(resolve=>{
      let c=3;const iv=setInterval(()=>{c--;const cd=$('pvpCardCountdown');if(cd)cd.textContent=c;if(c<=0){clearInterval(iv);resolve();}},1000);
    });
  }

  // ── Realtime ──────────────────────────────────────────────
  function _subscribeRoom(){
    if(_channel)_channel.unsubscribe();
    _channel=_sb.channel(`pvp_room_${_roomId}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'pvp_rooms',filter:`id=eq.${_roomId}`},
        payload=>_handleRoomUpdate(payload.new)).subscribe();
  }

  function _subscribeChatRoom(){
    if(_chatChannel)_chatChannel.unsubscribe();
    _chatChannel=_sb.channel(`pvp_chat_${_roomId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'pvp_chat',filter:`room_id=eq.${_roomId}`},
        payload=>_renderChatMsg(payload.new)).subscribe();
  }

  async function _handleRoomUpdate(room){
    if(_myRole==='player1'&&room.status==='matched'&&!_opponentId){
      clearTimeout(_matchTimeout);
      _opponentName=room.player2_name;_opponentAvatar=room.player2_avatar;_opponentId=room.player2_id;
      await _showOpponentCard(room.player2_id,room.player2_name,room.player2_avatar,room.player2_streak||0);
      await _startBattle(room.subject,room.class);
    }
    const oppField=_myRole==='player1'?'player2_score':'player1_score';
    if(room[oppField]!==_opponentScore){_opponentScore=room[oppField];_updateLiveScore();}
    if(room.player1_done&&room.player2_done)_showResult(room);
  }

  // ── Battle ────────────────────────────────────────────────
  async function _startBattle(subject,cls){
    try{const res=await fetch(`questions/class${cls}/${subject}.json`);const all=await res.json();_questions=shuffle(all).slice(0,10);}
    catch(e){alert('Questions load nahi hue!');return;}
    _qIdx=0;_score=0;_answered=false;
    App.goTo('screen-pvp-online-battle');
    _subscribeRoom();_subscribeChatRoom();
    _renderBattleHeader();_loadQuestion();
  }

  function _renderBattleHeader(){
    const p=profile();
    if($('pvpOnlineMyName'))    $('pvpOnlineMyName').textContent    =p?.username||'You';
    if($('pvpOnlineMyAvatar'))  $('pvpOnlineMyAvatar').textContent  =p?.avatar||'🐉';
    if($('pvpOnlineOppName'))   $('pvpOnlineOppName').textContent   =_opponentName;
    if($('pvpOnlineOppAvatar')) $('pvpOnlineOppAvatar').textContent =_opponentAvatar;
    if($('pvpMyStreak'))        $('pvpMyStreak').textContent        =_myStreak>0?`🔥${_myStreak}`:'';
    _updateLiveScore();
  }

  function _updateLiveScore(){
    if($('pvpOnlineMyScore'))  $('pvpOnlineMyScore').textContent =_score;
    if($('pvpOnlineOppScore')) $('pvpOnlineOppScore').textContent=_opponentDone?_opponentScore:'...';
  }

  function _loadQuestion(){
    if(_qIdx>=_questions.length){_finishMyGame();return;}
    const q=_questions[_qIdx];_answered=false;_timeLeft=ROUND_TIME;
    if($('pvpOnlineQNum'))  $('pvpOnlineQNum').textContent =`Q${_qIdx+1}/${_questions.length}`;
    if($('pvpOnlineQText')) $('pvpOnlineQText').textContent=q.q;
    const optsEl=$('pvpOnlineOpts');if(!optsEl)return;
    optsEl.innerHTML='';
    q.opts.forEach((opt,i)=>{
      const btn=document.createElement('button');
      btn.className='pvp-online-opt';btn.textContent=opt;
      btn.onclick=()=>_answer(i,btn,q.ans);optsEl.appendChild(btn);
    });
    _startTimer();
  }

  function _startTimer(){
    clearInterval(_timer);_updateTimerUI();
    _timer=setInterval(()=>{_timeLeft--;_updateTimerUI();
      if(_timeLeft<=0){clearInterval(_timer);if(!_answered)_answer(-1,null,_questions[_qIdx].ans);}
    },1000);
  }

  function _updateTimerUI(){
    if($('pvpOnlineTimer')){$('pvpOnlineTimer').textContent=_timeLeft;$('pvpOnlineTimer').style.color=_timeLeft<=5?'#f43f5e':'#4ade80';}
  }

  function _answer(idx,btn,correct){
    if(_answered)return;_answered=true;clearInterval(_timer);
    document.querySelectorAll('.pvp-online-opt').forEach(b=>b.disabled=true);
    if(idx===correct){
      _score+=10+_timeLeft;
      if(btn){btn.style.background='rgba(74,222,128,.3)';btn.style.borderColor='#4ade80';}
    }else{
      if(btn){btn.style.background='rgba(244,63,94,.3)';btn.style.borderColor='#f43f5e';}
      const opts=document.querySelectorAll('.pvp-online-opt');
      if(opts[correct]){opts[correct].style.background='rgba(74,222,128,.3)';opts[correct].style.borderColor='#4ade80';}
    }
    _updateLiveScore();
    const sf=_myRole==='player1'?'player1_score':'player2_score';
    _sb.from('pvp_rooms').update({[sf]:_score}).eq('id',_roomId);
    setTimeout(()=>{_qIdx++;_loadQuestion();},900);
  }

  async function _finishMyGame(){
    clearInterval(_timer);
    const df=_myRole==='player1'?'player1_done':'player2_done';
    const sf=_myRole==='player1'?'player1_score':'player2_score';
    const{data:room}=await _sb.from('pvp_rooms').update({[df]:true,[sf]:_score,status:'finished'}).eq('id',_roomId).select().single();
    if(room&&!(room.player1_done&&room.player2_done)){
      if($('pvpOnlineQText'))$('pvpOnlineQText').textContent='⏳ Opponent ka wait...';
      if($('pvpOnlineOpts')) $('pvpOnlineOpts').innerHTML='';
      if($('pvpOnlineTimer'))$('pvpOnlineTimer').textContent='✓';
    }
  }

  // ── Quick Chat ────────────────────────────────────────────
  function toggleChat(){
    const el=$('pvpChatPanel');if(!el)return;
    el.style.display=el.style.display==='block'?'none':'block';
  }

  async function sendChat(msg){
    if(!_roomId)return;const p=profile();
    await _sb.from('pvp_chat').insert({room_id:_roomId,user_id:user().id,username:p?.username||'Player',msg});
    if($('pvpChatPanel'))$('pvpChatPanel').style.display='none';
  }

  function _renderChatMsg(row){
    const isMe=row.user_id===user().id;
    const el=$('pvpChatLog');if(!el)return;
    const div=document.createElement('div');
    div.style.cssText=`text-align:${isMe?'right':'left'};margin:4px 0;font-size:.88rem;font-weight:800;color:${isMe?'#4ade80':'#f59e0b'}`;
    div.textContent=`${isMe?'You':row.username}: ${row.msg}`;
    el.appendChild(div);el.scrollTop=el.scrollHeight;
    setTimeout(()=>{if(div.parentNode)div.remove();},3000);
  }

  // ── Result ────────────────────────────────────────────────
  async function _showResult(room){
    if(_channel)_channel.unsubscribe();if(_chatChannel)_chatChannel.unsubscribe();
    const myScore =_myRole==='player1'?room.player1_score:room.player2_score;
    const oppScore=_myRole==='player1'?room.player2_score:room.player1_score;
    const won=myScore>oppScore,draw=myScore===oppScore;
    App.goTo('screen-pvp-online-result');
    const{streakBonus,streak}=await _updateStats(won&&!draw);
    if($('pvpResTitle')){$('pvpResTitle').textContent=draw?'🤝 DRAW!':won?'🏆 YOU WON!':'😢 YOU LOST!';$('pvpResTitle').style.color=draw?'#f59e0b':won?'#4ade80':'#f43f5e';}
    if($('pvpResMyScore')) $('pvpResMyScore').textContent =myScore;
    if($('pvpResOppScore'))$('pvpResOppScore').textContent=oppScore;
    if($('pvpResOppName')) $('pvpResOppName').textContent =_opponentName;
    if($('pvpResMyName'))  $('pvpResMyName').textContent  =profile()?.username||'You';
    if($('pvpResStreak')){
      $('pvpResStreak').textContent=won?`🔥 ${streak} streak${streakBonus>0?` · +${streakBonus}🪙 Bonus!`:''}`:'💔 Streak Reset';
      $('pvpResStreak').style.color=won?'#f59e0b':'#f43f5e';
    }
    let coinsChange=_betCoins>0?(won?_betCoins:draw?0:-_betCoins):0;
    if(coinsChange!==0)await _sb.from('profiles').update({coins:(profile()?.coins||0)+coinsChange}).eq('id',user().id);
    if($('pvpResCoins')){const total=coinsChange+streakBonus;$('pvpResCoins').textContent=total>0?`+${total} 🪙`:total<0?`${total} 🪙`:'';$('pvpResCoins').style.color=total>=0?'#4ade80':'#f43f5e';}
    if(!draw)await _sb.from('pvp_history').insert({
      room_id:room.id,winner_id:won?user().id:_opponentId,loser_id:won?_opponentId:user().id,
      winner_name:won?(profile()?.username||'Player'):_opponentName,loser_name:won?_opponentName:(profile()?.username||'Player'),
      winner_score:Math.max(myScore,oppScore),loser_score:Math.min(myScore,oppScore),
      subject:room.subject,class:room.class,coins_won:_betCoins,
    });
    _reset();_renderHistory();_renderSeasonLeaderboard();
  }

  // ── Season Leaderboard ────────────────────────────────────
  async function _renderSeasonLeaderboard(){
    const el=$('pvpSeasonBoard');if(!el)return;
    const{data}=await _sb.from('pvp_stats').select('username,avatar,season_wins,season_points,rank').order('season_points',{ascending:false}).limit(10);
    if(!data||!data.length){el.innerHTML='<div style="color:var(--text2);text-align:center;padding:12px;font-size:.82rem">No data yet!</div>';return;}
    el.innerHTML=data.map((r,i)=>{
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
      return `<div class="pvp-hist-row"><span>${medal}</span><span>${r.avatar}</span>
        <span style="font-weight:900;flex:1">${r.username}</span>
        <span style="color:#f59e0b;font-size:.78rem">${RANK_ICONS[r.rank]||'🥉'}</span>
        <span style="color:#4ade80;font-size:.78rem">${r.season_wins}W</span></div>`;
    }).join('');
  }

  // ── Match History ─────────────────────────────────────────
  async function _renderHistory(){
    const el=$('pvpOnlineHistory');if(!el||!SBAuth.isLoggedIn())return;
    const uid=user().id;
    const{data}=await _sb.from('pvp_history').select('*').or(`winner_id.eq.${uid},loser_id.eq.${uid}`).order('played_at',{ascending:false}).limit(8);
    if(!data||!data.length){el.innerHTML='<div style="color:var(--text2);font-size:.82rem;text-align:center;padding:8px">No matches yet!</div>';return;}
    el.innerHTML=data.map(m=>{
      const won=m.winner_id===uid,opp=won?m.loser_name:m.winner_name,ms=won?m.winner_score:m.loser_score,os=won?m.loser_score:m.winner_score;
      return `<div class="pvp-hist-row"><span style="color:${won?'#4ade80':'#f43f5e'};font-weight:900">${won?'WIN':'LOSS'}</span><span>vs ${opp}</span><span style="color:#f59e0b">${ms}-${os}</span><span style="color:var(--text2);font-size:.72rem">${m.subject}</span></div>`;
    }).join('');
  }

  // ── Reset ─────────────────────────────────────────────────
  function _reset(){
    clearInterval(_timer);clearTimeout(_matchTimeout);
    if(_channel){_channel.unsubscribe();_channel=null;}
    if(_chatChannel){_chatChannel.unsubscribe();_chatChannel=null;}
    _roomId=null;_myRole=null;_opponentId=null;_challengeId=null;
    _questions=[];_qIdx=0;_score=0;_opponentDone=false;_opponentScore=0;
  }

  function cancel(){if(_roomId)_sb.from('pvp_rooms').delete().eq('id',_roomId).eq('status','waiting');_reset();App.goTo('screen-pvp-hub');}
  function playAgain(){_reset();open();}
  function _setStatus(msg){if($('pvpOnlineStatus'))$('pvpOnlineStatus').textContent=msg;}

  return{open,findMatch,cancel,playAgain,toggleChat,sendChat,sendChallenge,acceptChallenge,declineChallenge};
})();
